import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import type { Zone, IncidentPoint } from '../../types';

const CITY_CENTERS: Record<string, [number, number]> = {
  Nairobi: [-1.286389, 36.817223],
  Mombasa: [-4.043477, 39.668206],
  Eldoret: [0.514277, 35.26978],
  Nakuru: [-0.303099, 36.080025],
  Kisumu: [-0.10221, 34.76171],
};

interface LayerState {
  heatmap: boolean;
  infrastructure: boolean;
  zones: boolean;
}

interface InfraMarker {
  id: number;
  lat: number;
  lng: number;
  infra_type: string;
  name: string;
}

interface Props {
  city: string;
  selectedZoneId?: string;
  selectedZone?: string;
  zones: Zone[];
  incidents?: IncidentPoint[];
  infraMarkers?: InfraMarker[];
  onSelectZone?: (id: string) => void;
  onPinDrop?: (lat: number, lng: number) => void;
  onDropPin?: (pin: { lat: number; lng: number }) => void;
  selectionMode?: 'zone' | 'pin';
  pinMode?: boolean;
  droppedPin: { lat: number; lng: number } | null;
  radiusKm: number;
}

const INFRA_EMOJI: Record<string, string> = {
  School: '🏫', Hospital: '🏥', Road: '🛣️', Power: '⚡', Water: '💧',
  'Police Station': '🚓', 'Transit Hub': '🚌', Other: '🏗️',
};

function makeInfraIcon(type: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:20px;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.8));">${INFRA_EMOJI[type] || '📍'}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const TILE_PRESETS: Record<string, { url: string; maxZoom: number }> = {
  'OSM Buildings': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  'Esri Streets': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
  'Carto Voyager': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
  },
};

export default function MapPanel({
  city, selectedZoneId, selectedZone, zones, incidents = [], infraMarkers = [],
  onSelectZone, onPinDrop, onDropPin, selectionMode, pinMode, droppedPin, radiusKm,
}: Props) {
  const activeZone = selectedZoneId ?? selectedZone ?? '';
  const activePinMode = pinMode || selectionMode === 'pin';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const zoneLayersRef = useRef<L.Polygon[]>([]);
  const infraMarkersRef = useRef<L.Marker[]>([]);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [layers, setLayers] = useState<LayerState>({ heatmap: true, infrastructure: true, zones: true });
  const [tilePreset, setTilePreset] = useState<string>('OSM Buildings');

  // Search Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResultName, setSearchResultName] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = CITY_CENTERS[city] ?? [-1.286389, 36.817223];
    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    const preset = TILE_PRESETS['OSM Buildings'];
    tileLayerRef.current = L.tileLayer(preset.url, { maxZoom: preset.maxZoom }).addTo(map);

    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);

    const resizeObs = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (containerRef.current) resizeObs.observe(containerRef.current);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObs.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer Preset
  useEffect(() => {
    if (!mapRef.current) return;
    const preset = TILE_PRESETS[tilePreset] || TILE_PRESETS['OSM Buildings'];
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(preset.url, { maxZoom: preset.maxZoom }).addTo(mapRef.current);
  }, [tilePreset]);

  // Recenter on city change
  useEffect(() => {
    const center = CITY_CENTERS[city] ?? [-1.286389, 36.817223];
    mapRef.current?.flyTo(center, 13, { duration: 1.2 });
    setSearchResultName(null);
  }, [city]);

  // Pin drop click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (activePinMode) {
        if (onDropPin) onDropPin({ lat: e.latlng.lat, lng: e.latlng.lng });
        if (onPinDrop) onPinDrop(e.latlng.lat, e.latlng.lng);
      }
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [activePinMode, onPinDrop, onDropPin]);

  // Handle Location Search (Nominatim API)
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const q = `${searchQuery.trim()}, ${city}, Kenya`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setSearchResultName(item.display_name.split(',')[0]);
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
        }
        if (onDropPin) onDropPin({ lat, lng });
        if (onPinDrop) onPinDrop(lat, lng);
      } else {
        alert(`Location "${searchQuery}" not found in ${city}.`);
      }
    } catch (_) {
      alert('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle Heatmap Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (layers.heatmap && incidents.length > 0) {
      const heatPoints: L.HeatLatLng[] = incidents.map(p => [p.lat, p.lng, p.intensity]);
      try {
        const hLayer = L.heatLayer(heatPoints, {
          radius: 25, blur: 15, maxZoom: 17,
          gradient: { 0.2: '#3b82f6', 0.4: '#10b981', 0.6: '#f59e0b', 0.8: '#f97316', 1.0: '#ef4444' },
        });
        hLayer.addTo(map);
        heatLayerRef.current = hLayer;
      } catch {}
    }
  }, [layers.heatmap, incidents]);

  // Handle Zone Boundary Polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    zoneLayersRef.current.forEach(layer => map.removeLayer(layer));
    zoneLayersRef.current = [];

    if (layers.zones && zones.length > 0) {
      zones.forEach(z => {
        const geom = z.geometry || (z as any).boundary;
        if (!geom || geom.type !== 'Polygon') return;
        const rawCoords = geom.coordinates[0];
        const latLngs: L.LatLngTuple[] = rawCoords.map((c: number[]) => [c[1], c[0]]);

        const isSelected = activeZone === String(z.id) || activeZone === z.name;
        const poly = L.polygon(latLngs, {
          color: isSelected ? '#ef4444' : '#3b82f6',
          weight: isSelected ? 3 : 1.5,
          fillColor: isSelected ? '#ef4444' : '#3b82f6',
          fillOpacity: isSelected ? 0.25 : 0.08,
          dashArray: isSelected ? undefined : '4, 4',
        });

        poly.on('click', () => {
          if (onSelectZone) onSelectZone(String(z.id));
        });

        poly.bindPopup(`<strong>Zone: ${z.name}</strong><br/>City: ${z.city}`);
        poly.addTo(map);
        zoneLayersRef.current.push(poly);

        if (isSelected) {
          map.flyToBounds(poly.getBounds(), { padding: [40, 40], duration: 1.0 });
        }
      });
    }
  }, [layers.zones, zones, activeZone, onSelectZone]);

  // Handle Infrastructure Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    infraMarkersRef.current.forEach(m => map.removeLayer(m));
    infraMarkersRef.current = [];

    if (layers.infrastructure && infraMarkers.length > 0) {
      infraMarkers.forEach(inf => {
        const marker = L.marker([inf.lat, inf.lng], { icon: makeInfraIcon(inf.infra_type) });
        marker.bindPopup(`<strong>${inf.name}</strong><br/>Type: ${inf.infra_type}`);
        marker.addTo(map);
        infraMarkersRef.current.push(marker);
      });
    }
  }, [layers.infrastructure, infraMarkers]);

  // Handle Dropped Pin & Radius Circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pinMarkerRef.current) { map.removeLayer(pinMarkerRef.current); pinMarkerRef.current = null; }
    if (radiusCircleRef.current) { map.removeLayer(radiusCircleRef.current); radiusCircleRef.current = null; }

    if (droppedPin) {
      const pinIcon = L.divIcon({
        className: '',
        html: '<div style="font-size:26px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.9));">📍</div>',
        iconSize: [32, 32], iconAnchor: [16, 32],
      });
      const pMarker = L.marker([droppedPin.lat, droppedPin.lng], { icon: pinIcon });
      pMarker.bindPopup(`<strong>Dropped Pin Location</strong><br/>Lat: ${droppedPin.lat.toFixed(5)}, Lng: ${droppedPin.lng.toFixed(5)}<br/>Analysis Radius: ${radiusKm} km`).openPopup();
      pMarker.addTo(map);
      pinMarkerRef.current = pMarker;

      const circle = L.circle([droppedPin.lat, droppedPin.lng], {
        radius: radiusKm * 1000, color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.12,
      });
      circle.addTo(map);
      radiusCircleRef.current = circle;

      map.flyToBounds(circle.getBounds(), { padding: [30, 30], duration: 0.8 });
    }
  }, [droppedPin, radiusKm]);

  const toggleLayer = (key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="map-panel" style={{ position: 'relative', width: '100%', height: '100%', minHeight: 440 }}>
      {/* Floating Search & Control Bar Overlay */}
      <div className="map-overlay-controls" style={{ gap: 12, padding: '12px 16px' }}>
        {/* Nominatim Search Input */}
        <form onSubmit={handleLocationSearch} style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 360 }}>
          <input
            type="text"
            placeholder={`🔍 Search place in ${city}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(20, 24, 35, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#fff',
              fontSize: '0.82rem',
              outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
          />
          <button
            type="submit"
            disabled={searchLoading}
            style={{
              background: '#e65c5c',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {searchLoading ? '...' : 'Search'}
          </button>
        </form>

        <div className="map-layer-pills">
          <button className={`map-pill-btn${layers.heatmap ? ' pill-active-heat' : ''}`} onClick={() => toggleLayer('heatmap')}>
            🔥 Heatmap ({incidents.length})
          </button>
          <button className={`map-pill-btn${layers.infrastructure ? ' pill-active-infra' : ''}`} onClick={() => toggleLayer('infrastructure')}>
            🏗️ Infrastructure ({infraMarkers.length})
          </button>
          <button className={`map-pill-btn${layers.zones ? ' pill-active-zones' : ''}`} onClick={() => toggleLayer('zones')}>
            🗺️ Zones ({zones.length})
          </button>
        </div>

        <div className="map-tile-selector">
          <select value={tilePreset} onChange={e => setTilePreset(e.target.value)} className="map-tile-select">
            <option value="OSM Buildings">🏢 Buildings & POIs (OSM)</option>
            <option value="Esri Streets">🛣️ Detailed Streets (Esri)</option>
            <option value="Carto Voyager">🗺️ Carto Voyager</option>
          </select>
        </div>
      </div>

      {activePinMode && (
        <div className="pin-mode-banner" style={{ zIndex: 1000 }}>
          📍 DROP PIN ACTIVE — Click anywhere on the map to inspect location
          {searchResultName && ` | Near: "${searchResultName}"`}
        </div>
      )}

      <div ref={containerRef} className="leaflet-map-container" style={{ width: '100%', height: '100%', minHeight: 440 }} />
    </div>
  );
}
