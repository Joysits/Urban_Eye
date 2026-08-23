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
      scrollWheelZoom: false,
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

const KNOWN_SUBCOUNTY_COORDS: Record<string, [number, number]> = {
  // Nairobi
  'westlands': [-1.2676, 36.8080],
  'kilimani': [-1.2921, 36.7865],
  'lavington': [-1.2800, 36.7680],
  'kibra': [-1.3133, 36.7886],
  'karen': [-1.3197, 36.7065],
  'langata': [-1.3458, 36.7589],
  'kasarani': [-1.2229, 36.8973],
  'embakasi': [-1.3211, 36.9142],
  'cbd': [-1.286389, 36.817223],
  'central': [-1.286389, 36.817223],
  'parklands': [-1.2605, 36.8208],
  'roysambu': [-1.2185, 36.8860],
  'mathare': [-1.2600, 36.8580],
  'dagoretti': [-1.2980, 36.7380],
  'starehe': [-1.2780, 36.8380],
  'kamukunji': [-1.2820, 36.8480],
  'ruaraka': [-1.2380, 36.8780],
  'makadara': [-1.3020, 36.8680],

  // Mombasa
  'nyali': [-4.0450, 39.7020],
  'likoni': [-4.0830, 39.6580],
  'changamwe': [-4.0300, 39.6300],
  'kisauni': [-4.0050, 39.6880],
  'bamburi': [-3.9850, 39.7150],
  'mombasa island': [-4.0600, 39.6750],
  'old town': [-4.0620, 39.6780],
  'tudor': [-4.0400, 39.6600],
  'mikindani': [-4.0150, 39.6200],
  'jomvu': [-4.0080, 39.6120],
  'mvita': [-4.0600, 39.6750],
  'shanzu': [-3.9650, 39.7400],

  // Eldoret
  'eldoret cbd': [0.514277, 35.26978],
  'pioneer': [0.5020, 35.2750],
  'langas': [0.4850, 35.2850],
  'huruma': [0.5280, 35.2520],
  'kapseret': [0.4580, 35.2350],
  'elgon view': [0.4950, 35.2650],
  'annex': [0.5350, 35.2950],
  'kimumu': [0.5520, 35.3050],
  'chepkoilel': [0.5650, 35.3000],
  'west indies': [0.5180, 35.2620],
  'maili nne': [0.5400, 35.2400],
  'munyaka': [0.5250, 35.3020],
  'kipkaren': [0.5100, 35.2400],
};

  // Handle Location Search (Local sub-county coordinates + Nominatim API fallback)
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryClean = searchQuery.trim().toLowerCase();
    if (!queryClean) return;
    setSearchLoading(true);

    // 1. Check Local Known Sub-County Coordinates Index
    const matchedKey = Object.keys(KNOWN_SUBCOUNTY_COORDS).find(
      k => queryClean.includes(k) || k.includes(queryClean)
    );

    if (matchedKey) {
      const [lat, lng] = KNOWN_SUBCOUNTY_COORDS[matchedKey];
      const formattedName = matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1);
      setSearchResultName(formattedName);
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
      }
      if (onDropPin) onDropPin({ lat, lng });
      if (onPinDrop) onPinDrop(lat, lng);
      setSearchLoading(false);
      return;
    }

    // 2. Query OpenStreetMap Nominatim API
    try {
      const q = `${searchQuery.trim()}, ${city}, Kenya`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const placeName = item.display_name.split(',')[0];
        setSearchResultName(placeName);
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
        }
        if (onDropPin) onDropPin({ lat, lng });
        if (onPinDrop) onPinDrop(lat, lng);
      } else {
        alert(`Location "${searchQuery}" not found in ${city}. Please try searching a sub-county name e.g. Westlands, Kibra, Nyali, Pioneer.`);
      }
    } catch (_) {
      alert(`Unable to search "${searchQuery}". Please check your internet connection or try searching a sub-county name e.g. Westlands, Kilimani, Likoni.`);
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
          gradient: { 0.2: '#e65c5c', 0.4: '#d97706', 0.6: '#f59e0b', 0.8: '#ea580c', 1.0: '#dc2626' },
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
          color: isSelected ? '#ef4444' : '#34d399',
          weight: isSelected ? 3 : 1.5,
          fillColor: isSelected ? '#ef4444' : '#34d399',
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

  // Handles Dropped Pin & Radius Circle
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
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 440, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(201, 107, 107, 0.25)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
      {/* Floating Search & Layer Overlay Bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 500, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', pointerEvents: 'auto' }}>
        
        {/* Nominatim Search Input */}
        <form onSubmit={handleLocationSearch} style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 360 }}>
          <input
            type="text"
            placeholder={`🔍 Search place in ${city}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(18, 5, 8, 0.92)',
              border: '1px solid rgba(201, 107, 107, 0.35)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fee1e1',
              fontSize: '0.82rem',
              outline: 'none',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
          />
          <button
            type="submit"
            disabled={searchLoading}
            style={{
              background: 'linear-gradient(135deg, rgba(124,29,36,0.8), rgba(166,58,58,0.6))',
              border: '1px solid rgba(201,107,107,0.5)',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 29, 36, 0.4)',
            }}
          >
            {searchLoading ? '...' : 'Search'}
          </button>
        </form>

        {/* Layer Toggles (Distinct Vibrant Map Colors: Heatmap=Red/Orange, Infra=Cyan, Zones=Emerald Green) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => toggleLayer('heatmap')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: layers.heatmap ? '1px solid #E93B3B' : '1px solid rgba(248, 113, 113, 0.3)',
              background: layers.heatmap ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(234, 88, 12, 0.8))' : 'rgba(18, 5, 8, 0.88)',
              color: layers.heatmap ? '#fff' : '#f87171',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: layers.heatmap ? '0 4px 12px rgba(220, 38, 38, 0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            🔥 Heatmap ({incidents.length})
          </button>
          <button
            onClick={() => toggleLayer('infrastructure')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: layers.infrastructure ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.3)',
              background: layers.infrastructure ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(37, 99, 235, 0.8))' : 'rgba(18, 5, 8, 0.88)',
              color: layers.infrastructure ? '#fff' : '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: layers.infrastructure ? '0 4px 12px rgba(14, 165, 233, 0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            🏗️ Infrastructure ({infraMarkers.length})
          </button>
          <button
            onClick={() => toggleLayer('zones')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: layers.zones ? '1px solid #34d399' : '1px solid rgba(52, 211, 153, 0.3)',
              background: layers.zones ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.8))' : 'rgba(18, 5, 8, 0.88)',
              color: layers.zones ? '#fff' : '#34d399',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: layers.zones ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
             Zones ({zones.length})
          </button>
        </div>

        {/* Tile Preset Dropdown */}
        <div>
          <select
            value={tilePreset}
            onChange={e => setTilePreset(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(30, 8, 12, 0.95)',
              color: '#fee1e1',
              border: '1px solid rgba(201, 107, 107, 0.35)',
              fontSize: '0.78rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <option value="OSM Buildings">🏢 Buildings & POIs (OSM)</option>
            <option value="Esri Streets">🛣️ Detailed Streets (Esri)</option>
            <option value="Carto Voyager">🗺️ Carto Voyager</option>
          </select>
        </div>
      </div>

      {activePinMode && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 500, background: 'rgba(124, 29, 36, 0.92)', border: '1px solid rgba(248, 113, 113, 0.6)', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          📍 DROP PIN  — Click anywhere on the map to inspect location
          {searchResultName && ` | Near: "${searchResultName}"`}
        </div>
      )}

      <div ref={containerRef} className="leaflet-map-container" style={{ width: '100%', height: '100%', minHeight: 440 }} />
    </div>
  );
}
