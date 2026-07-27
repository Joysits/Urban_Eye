import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import type { Zone, IncidentPoint } from '../../types';

const CITY_CENTERS: Record<string, [number, number]> = {
  Nairobi: [-1.286389, 36.817223],
  Mombasa: [-4.043477, 39.668206],
  Eldoret: [0.514277, 35.26978],
};

interface LayerState {
  heatmap: boolean;
  infrastructure: boolean;
  zones: boolean;
}

interface InfraMarker {
  lat: number;
  lng: number;
  type: string;
  name: string;
}

interface Props {
  city: string;
  selectedZone: string;
  zones: Zone[];
  incidents: IncidentPoint[];
  infraMarkers: InfraMarker[];
  onPinDrop?: (lat: number, lng: number) => void;
  pinMode: boolean;
  droppedPin: { lat: number; lng: number } | null;
  radiusKm: number;
}

const INFRA_EMOJI: Record<string, string> = {
  School: '🏫', Hospital: '🏥', Road: '🛣️', Power: '⚡', Water: '💧', Other: '🏗️',
};

function makeInfraIcon(type: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:18px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7));">${INFRA_EMOJI[type] || '📍'}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Typed access to heatLayer (augmented by leaflet.heat import)
type HeatLayerFn = (
  pts: [number, number, number][],
  opts: object
) => L.Layer;

export default function MapPanel({
  city, selectedZone, zones, incidents, infraMarkers,
  onPinDrop, pinMode, droppedPin, radiusKm,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatRef = useRef<L.Layer | null>(null);
  const infraLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const pinCircleRef = useRef<L.Circle | null>(null);

  const [layers, setLayers] = useState<LayerState>({ heatmap: true, infrastructure: true, zones: true });

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = CITY_CENTERS[city] ?? [-1.286389, 36.817223];
    mapRef.current = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });
    // Normal Google Maps-style tile (Carto Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '\u00a9 OpenStreetMap \u00a9 CARTO',
    }).addTo(mapRef.current);


    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter on city change
  useEffect(() => {
    const center = CITY_CENTERS[city] ?? [-1.286389, 36.817223];
    mapRef.current?.flyTo(center, 13, { duration: 1.2 });
  }, [city]);

  // Pin drop click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (pinMode && onPinDrop) onPinDrop(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [pinMode, onPinDrop]);

  // Cursor crosshair in pin mode
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = pinMode ? 'crosshair' : '';
    }
  }, [pinMode]);

  // Heatmap layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    if (layers.heatmap && incidents.length > 0) {
      const pts: [number, number, number][] = incidents.map(i => [i.lat, i.lng, i.intensity]);
      const heatFn = (L as unknown as { heatLayer: HeatLayerFn }).heatLayer;
      heatRef.current = heatFn(pts, {
        radius: 28,
        blur: 20,
        maxZoom: 17,
        gradient: { 0.2: '#1a0a3b', 0.4: '#7c1d24', 0.6: '#c96b6b', 0.8: '#ed8936', 1.0: '#fff5b4' },
      });
      heatRef.current.addTo(map);
    }
  }, [incidents, layers.heatmap]);

  // Infrastructure markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (infraLayerRef.current) { map.removeLayer(infraLayerRef.current); infraLayerRef.current = null; }
    if (layers.infrastructure && infraMarkers.length > 0) {
      infraLayerRef.current = L.layerGroup();
      infraMarkers.forEach(m => {
        L.marker([m.lat, m.lng], { icon: makeInfraIcon(m.type) })
          .bindPopup(`<div style="color:#1a202c"><strong>${m.name}</strong><br/><em>${m.type}</em></div>`)
          .addTo(infraLayerRef.current!);
      });
      infraLayerRef.current.addTo(map);
    }
  }, [infraMarkers, layers.infrastructure]);

  // Zone polygon overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (zoneLayerRef.current) { map.removeLayer(zoneLayerRef.current); zoneLayerRef.current = null; }
    if (layers.zones && zones.length > 0) {
      zoneLayerRef.current = L.layerGroup();
      zones.forEach(z => {
        if (!z.geometry) return;
        try {
          const geoLayer = L.geoJSON(z.geometry as Parameters<typeof L.geoJSON>[0], {
            style: {
              color: z.id === Number(selectedZone) ? '#c96b6b' : 'rgba(201,107,107,0.5)',
              weight: z.id === Number(selectedZone) ? 2.5 : 1,
              fillColor: z.id === Number(selectedZone) ? 'rgba(201,107,107,0.15)' : 'transparent',
              fillOpacity: 1,
            },
          });
          geoLayer.bindTooltip(z.name, {
            permanent: false,
            direction: 'center',
            className: 'zone-tooltip',
          });
          geoLayer.addTo(zoneLayerRef.current!);
        } catch (_) { /* skip invalid geometries */ }
      });
      zoneLayerRef.current.addTo(map);
    }
  }, [zones, layers.zones, selectedZone]);

  // Dropped pin + radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pinMarkerRef.current) { map.removeLayer(pinMarkerRef.current); pinMarkerRef.current = null; }
    if (pinCircleRef.current) { map.removeLayer(pinCircleRef.current); pinCircleRef.current = null; }
    if (droppedPin) {
      pinMarkerRef.current = L.marker([droppedPin.lat, droppedPin.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#c96b6b;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px #c96b6b;"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      }).addTo(map);
      pinCircleRef.current = L.circle([droppedPin.lat, droppedPin.lng], {
        radius: radiusKm * 1000,
        color: '#c96b6b',
        weight: 1.5,
        fillColor: 'rgba(201,107,107,0.08)',
        fillOpacity: 1,
        dashArray: '6 4',
      }).addTo(map);
    }
  }, [droppedPin, radiusKm]);

  const toggleLayer = (key: keyof LayerState) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="map-panel">
      {/* Floating layer toggles */}
      <div className="layer-toggle-bar">
        {(['heatmap', 'infrastructure', 'zones'] as const).map(key => (
          <button
            key={key}
            className={`layer-btn ${layers[key] ? 'layer-btn-active' : ''}`}
            onClick={() => toggleLayer(key)}
          >
            {key === 'heatmap' && '🔥'}
            {key === 'infrastructure' && '🏗️'}
            {key === 'zones' && '🗺️'}
            {' '}{key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
        {pinMode && (
          <span style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#ed8936', fontWeight: 600 }}>
            📍 Click map to drop pin
          </span>
        )}
      </div>
      <div ref={containerRef} className="leaflet-map-container" />
    </div>
  );
}
