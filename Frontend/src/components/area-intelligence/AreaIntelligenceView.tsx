import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AnalysisData, CrimeTrendData, InfrastructureNearby,
  Zone, IncidentPoint,
} from '../../types';
import MapPanel from './MapPanel';
import SummaryPanel from './SummaryPanel';
import ComparisonMode from './ComparisonMode';
import CrimeTrendChart from './CrimeTrendChart';

const CITY_CENTERS_MAP: Record<string, [number, number]> = {
  Nairobi: [-1.286389, 36.817223],
  Mombasa: [-4.043477, 39.668206],
  Eldoret: [0.514277, 35.26978],
};

const SEVERITY_WEIGHT: Record<string, number> = {
  Low: 0.3, Moderate: 0.6, High: 1.0, Critical: 1.0,
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Token ${token}` : '',
  };
}

interface Props {
  currentCity: string;
  onSwitchToReports?: () => void;
}

export default function AreaIntelligenceView({ currentCity, onSwitchToReports }: Props) {
  const [city, setCity] = useState(currentCity || 'Nairobi');
  const [selectionMode, setSelectionMode] = useState<'zone' | 'pin'>('zone');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [compareMode, setCompareMode] = useState(false);

  // Compare mode selections
  const [zoneAId, setZoneAId] = useState<string>('');
  const [zoneBId, setZoneBId] = useState<string>('');
  const [zoneAData, setZoneAData] = useState<AnalysisData | null>(null);
  const [zoneBData, setZoneBData] = useState<AnalysisData | null>(null);

  // Core data states
  const [zones, setZones] = useState<Zone[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [trendData, setTrendData] = useState<CrimeTrendData | null>(null);
  const [infraNearby, setInfraNearby] = useState<InfrastructureNearby | null>(null);
  const [incidentPoints, setIncidentPoints] = useState<IncidentPoint[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [compLoading, setCompLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const prevCityRef = useRef(city);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Reset location selection when city changes
  useEffect(() => {
    if (prevCityRef.current !== city) {
      setSelectedZone('');
      setDroppedPin(null);
      setZoneAId('');
      setZoneBId('');
      prevCityRef.current = city;
    }
  }, [city]);

  // Load Locations for active city
  useEffect(() => {
    fetch(`/api/zones/?city=${encodeURIComponent(city)}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const rawList = Array.isArray(data)
          ? data
          : (data.features ?? data.results ?? []);

        const list: Zone[] = rawList.map((item: Record<string, unknown>) => {
          if (item.properties && typeof item.properties === 'object') {
            const props = item.properties as Record<string, string>;
            const geom = item.geometry as Zone['geometry'];
            return {
              id: Number(item.id),
              name: props.name || `Location #${item.id}`,
              city: props.city || city,
              geometry: geom,
            };
          }
          return item as unknown as Zone;
        });

        setZones(list);
      })
      .catch(() => setZones([]));
  }, [city]);

  // Fetch Area Analysis Detail
  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/analysis/detail/?city=${encodeURIComponent(city)}`;
      if (selectedZone) url += `&zone_id=${selectedZone}`;

      const res = await fetch(url, { headers: authHeaders() });
      const data: AnalysisData = await res.json();
      setAnalysisData(data);
    } catch {
      showToast('Failed to load area analysis data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [city, selectedZone]);

  // Fetch Crime Trend
  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      let url = `/api/analysis/crime-trend/?city=${encodeURIComponent(city)}&months=6`;
      if (selectedZone) url += `&zone_id=${selectedZone}`;

      const res = await fetch(url, { headers: authHeaders() });
      const data: CrimeTrendData = await res.json();
      setTrendData(data);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  }, [city, selectedZone]);

  // Fetch Infrastructure Nearby (pin mode)
  useEffect(() => {
    if (selectionMode !== 'pin' || !droppedPin) {
      setInfraNearby(null);
      return;
    }
    const url = `/api/analysis/infrastructure-nearby/?city=${encodeURIComponent(city)}&lat=${droppedPin.lat}&lng=${droppedPin.lng}&radius_km=${radiusKm}`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setInfraNearby(d))
      .catch(() => setInfraNearby(null));
  }, [selectionMode, droppedPin, radiusKm, city]);

  // Fetch Incidents for map heat layer & markers
  useEffect(() => {
    let url = `/api/incidents/?city=${encodeURIComponent(city)}`;
    if (selectedZone) url += `&zone_id=${selectedZone}`;

    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const rawList = Array.isArray(data) ? data : data.results ?? [];

        const parsed: IncidentPoint[] = rawList
          .map((inc: Record<string, unknown>) => {
            const geom = inc.geometry as { coordinates: [number, number] } | undefined;
            const props = (inc.properties as Record<string, string>) ?? {};
            const lat = geom ? geom.coordinates[1] : Number(inc.latitude || inc.lat || 0);
            const lng = geom ? geom.coordinates[0] : Number(inc.longitude || inc.lng || 0);
            const severity = props.severity ?? (inc.severity as string) ?? 'Moderate';
            const category = props.category ?? (inc.category as string) ?? 'Other';
            const intensity = SEVERITY_WEIGHT[severity] ?? 0.5;

            return { id: Number(inc.id), lat, lng, intensity, category, severity };
          })
          .filter((p: IncidentPoint) => p.lat !== 0 && p.lng !== 0 && !isNaN(p.lat) && !isNaN(p.lng));

        setIncidentPoints(parsed);
      })
      .catch(() => setIncidentPoints([]));
  }, [city, selectedZone]);

  // Trigger analysis data load
  useEffect(() => {
    fetchAnalysis();
    fetchTrend();
  }, [fetchAnalysis, fetchTrend]);

  // Comparison mode fetch
  useEffect(() => {
    if (!compareMode) return;
    setCompLoading(true);

    const fetchSingleZone = (zId: string) => {
      if (!zId) return Promise.resolve(null);
      return fetch(`/api/analysis/detail/?city=${encodeURIComponent(city)}&zone_id=${zId}`, {
        headers: authHeaders(),
      }).then(r => r.json());
    };

    Promise.all([fetchSingleZone(zoneAId), fetchSingleZone(zoneBId)])
      .then(([a, b]) => {
        setZoneAData(a);
        setZoneBData(b);
      })
      .catch(() => {
        setZoneAData(null);
        setZoneBData(null);
      })
      .finally(() => setCompLoading(false));
  }, [compareMode, zoneAId, zoneBId, city]);

  const handlePinDrop = (lat: number, lng: number) => {
    setDroppedPin({ lat, lng });
    showToast(`Pin dropped at ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
  };

  // Convert infrastructure summary to map markers
  const infraMapMarkers = (analysisData?.infrastructure_summary ?? []).map((inf, idx) => {
    const typeStr = inf.type || 'Infrastructure';
    const center = CITY_CENTERS_MAP[city] ?? [-1.286389, 36.817223];
    return {
      id: idx,
      infra_type: typeStr,
      name: `${typeStr} (${inf.count})`,
      lat: center[0] + (Math.random() - 0.5) * 0.04,
      lng: center[1] + (Math.random() - 0.5) * 0.04,
    };
  });

  const handleExportReport = async () => {
    if (!analysisData) return;
    setExportLoading(true);
    try {
      const res = await fetch('/api/analysis/generate-report/', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          city,
          zone_id: selectedZone || null,
          zone_name: analysisData.zone_name,
          risk_score: analysisData.risk_score,
          crime_breakdown: analysisData.crime_breakdown,
          infrastructure_summary: analysisData.infrastructure_summary,
          population_info: analysisData.population_info,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Export failed');
      showToast(`Report saved: "${data.title}"`, 'success');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="area-intel-shell fade-in">
      {/* ── Control Bar ── */}
      <div className="intel-control-bar">
        <div className="intel-controls-left">
          <div className="intel-control-group">
            <label>City</label>
            <select value={city} onChange={e => setCity(e.target.value)} className="intel-select">
              <option>Nairobi</option>
              <option>Mombasa</option>
              <option>Eldoret</option>
            </select>
          </div>

          <div className="intel-control-group">
            <label>Selection Mode</label>
            <div className="mode-toggle">
              <button
                className={`mode-btn${selectionMode === 'zone' ? ' active' : ''}`}
                onClick={() => { setSelectionMode('zone'); setDroppedPin(null); }}
              >
                🗂 Location
              </button>
              <button
                className={`mode-btn${selectionMode === 'pin' ? ' active' : ''}`}
                onClick={() => { setSelectionMode('pin'); setSelectedZone(''); }}
              >
                📍 Drop Pin
              </button>
            </div>
          </div>

          {selectionMode === 'zone' && (
            <div className="intel-control-group">
              <label>Location / Sector</label>
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="intel-select"
              >
                <option value="">All Locations</option>
                {zones.map(z => (
                  <option key={z.id} value={String(z.id)}>{z.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectionMode === 'pin' && droppedPin && (
            <div className="intel-control-group">
              <label>Radius: {radiusKm} km</label>
              <input
                type="range" min={1} max={20} value={radiusKm}
                onChange={e => setRadiusKm(Number(e.target.value))}
                className="radius-slider"
              />
            </div>
          )}

          {selectionMode === 'pin' && !droppedPin && (
            <div className="intel-pin-hint">👆 Click anywhere on the map to drop a pin</div>
          )}
        </div>

        <div className="intel-controls-right">
          <button
            className={`compare-btn${compareMode ? ' compare-btn-active' : ''}`}
            onClick={() => setCompareMode(!compareMode)}
          >
            {compareMode ? '✖ Exit Compare' : '⚖ Compare Locations'}
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`intel-toast intel-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          {onSwitchToReports && toast.type === 'success' && (
            <button onClick={onSwitchToReports} className="toast-link">
              View Reports →
            </button>
          )}
        </div>
      )}

      {/* ── Main Content ── */}
      {compareMode ? (
        <ComparisonMode
          zoneA={zoneAData}
          zoneB={zoneBData}
          zones={zones}
          selectedZoneA={zoneAId}
          selectedZoneB={zoneBId}
          onSelectZoneA={setZoneAId}
          onSelectZoneB={setZoneBId}
          city={city}
          loading={compLoading}
        />
      ) : (
        <div className="intel-main">
          {/* Left Column: Map + Crime Trend Graph placed right below it */}
          <div className="intel-left-section">
            <MapPanel
              city={city}
              selectedZone={selectedZone}
              zones={zones}
              incidents={incidentPoints}
              infraMarkers={infraMapMarkers}
              onPinDrop={handlePinDrop}
              pinMode={selectionMode === 'pin'}
              droppedPin={droppedPin}
              radiusKm={radiusKm}
            />

            {/* Crime Trend Chart Card directly below Map */}
            <div className="map-bottom-chart-card">
              <div className="mbc-header">
                <h3>📈 Crime Trend (Last 6 Months)</h3>
                <span className="mbc-sub">{analysisData?.zone_name || city}</span>
              </div>
              <CrimeTrendChart data={trendData} loading={trendLoading} />
            </div>
          </div>

          {/* Right Column: Detailed Intelligence Summary Panel */}
          <SummaryPanel
            data={analysisData}
            infraNearby={infraNearby}
            loading={loading}
            onExportReport={handleExportReport}
            exportLoading={exportLoading}
            onSwitchToReports={onSwitchToReports}
          />
        </div>
      )}
    </div>
  );
}
