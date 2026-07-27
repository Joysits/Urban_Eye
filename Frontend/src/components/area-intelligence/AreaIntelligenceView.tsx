import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AnalysisData, CrimeTrendData, InfrastructureNearby,
  Zone, IncidentPoint,
} from '../../types';
import MapPanel from './MapPanel';
import SummaryPanel from './SummaryPanel';
import ComparisonMode from './ComparisonMode';

interface Props {
  currentCity: string;
  onSwitchToReports?: () => void;
}

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

export default function AreaIntelligenceView({ currentCity, onSwitchToReports }: Props) {
  const [city, setCity] = useState(currentCity);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectionMode, setSelectionMode] = useState<'zone' | 'pin'>('zone');
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [compareMode, setCompareMode] = useState(false);
  const [zoneAId, setZoneAId] = useState('');
  const [zoneBId, setZoneBId] = useState('');

  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [trendData, setTrendData] = useState<CrimeTrendData | null>(null);
  const [infraNearby, setInfraNearby] = useState<InfrastructureNearby | null>(null);
  const [zoneAData, setZoneAData] = useState<AnalysisData | null>(null);
  const [zoneBData, setZoneBData] = useState<AnalysisData | null>(null);

  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [compLoading, setCompLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [incidentPoints, setIncidentPoints] = useState<IncidentPoint[]>([]);
  const [infraMapMarkers, setInfraMapMarkers] = useState<
    Array<{ lat: number; lng: number; type: string; name: string }>
  >([]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch zones on city change
  useEffect(() => {
    setSelectedZone('');
    setDroppedPin(null);
    fetch(`/api/zones/?city=${encodeURIComponent(city)}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : {})
      .then((d: unknown) => {
        const data = d as Record<string, unknown>;
        // Handle both plain list and GeoJSON FeatureCollection
        const list: Zone[] = Array.isArray(data)
          ? (data as Zone[])
          : ((data.results as Zone[] | undefined) ??
              ((data.features as Array<{ properties: Zone; geometry: Zone['geometry'] }> | undefined)
                ?.map(f => ({ ...f.properties, geometry: f.geometry })) ?? []));
        setZones(list);
      })
      .catch(() => setZones([]));
  }, [city]);

  // Fetch incidents for heatmap
  useEffect(() => {
    const q = selectedZone
      ? `/api/incidents/?city=${encodeURIComponent(city)}&zone_id=${selectedZone}`
      : `/api/incidents/?city=${encodeURIComponent(city)}`;
    fetch(q, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : {})
      .then((d: unknown) => {
        type RawFeature = {
          id: number;
          geometry?: { coordinates: number[] };
          properties?: { severity?: string; category?: string };
        };
        const data = d as Record<string, unknown>;
        const features: RawFeature[] = (data.features as RawFeature[] | undefined) ?? (data.results as RawFeature[] | undefined) ?? [];
        const pts: IncidentPoint[] = features
          .filter(f => f.geometry?.coordinates?.length === 2)
          .map(f => ({
            id: f.id,
            lat: f.geometry!.coordinates[1],
            lng: f.geometry!.coordinates[0],
            intensity: SEVERITY_WEIGHT[f.properties?.severity ?? 'Moderate'] ?? 0.6,
            category: f.properties?.category ?? 'Other',
            severity: f.properties?.severity ?? 'Moderate',
          }));
        setIncidentPoints(pts);
      })
      .catch(() => setIncidentPoints([]));
  }, [city, selectedZone]);

  // Fetch infrastructure map markers
  useEffect(() => {
    fetch(`/api/infrastructure/?city=${encodeURIComponent(city)}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : {})
      .then((d: unknown) => {
        type RawInfra = {
          geometry?: { coordinates: number[] };
          properties?: { infra_type?: string; name?: string };
        };
        const data = d as Record<string, unknown>;
        const features: RawInfra[] = (data.features as RawInfra[] | undefined) ?? (data.results as RawInfra[] | undefined) ?? [];
        setInfraMapMarkers(
          features
            .filter(f => f.geometry?.coordinates?.length === 2)
            .map(f => ({
              lat: f.geometry!.coordinates[1],
              lng: f.geometry!.coordinates[0],
              type: f.properties?.infra_type ?? 'Other',
              name: f.properties?.name ?? 'Infrastructure',
            }))
        );
      })
      .catch(() => setInfraMapMarkers([]));
  }, [city]);

  // Fetch main analysis data
  useEffect(() => {
    setLoading(true);
    let url = `/api/analysis/detail/?city=${encodeURIComponent(city)}`;
    if (selectedZone) url += `&zone_id=${selectedZone}`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setAnalysisData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, selectedZone]);

  // Fetch 6-month crime trend
  useEffect(() => {
    setTrendLoading(true);
    let url = `/api/analysis/crime-trend/?city=${encodeURIComponent(city)}&months=6`;
    if (selectedZone) url += `&zone_id=${selectedZone}`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTrendData(d))
      .catch(() => {})
      .finally(() => setTrendLoading(false));
  }, [city, selectedZone]);

  // Fetch infrastructure nearby when pin is dropped
  useEffect(() => {
    if (!droppedPin) return;
    const url = `/api/analysis/infrastructure-nearby/?city=${encodeURIComponent(city)}&lat=${droppedPin.lat}&lng=${droppedPin.lng}&radius_km=${radiusKm}`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setInfraNearby(d))
      .catch(() => {});
  }, [droppedPin, radiusKm, city]);

  // Fetch comparison zone data
  useEffect(() => {
    if (!compareMode) return;
    setCompLoading(true);
    const fetchZone = (id: string): Promise<AnalysisData | null> =>
      id
        ? fetch(`/api/analysis/detail/?city=${encodeURIComponent(city)}&zone_id=${id}`, {
            headers: authHeaders(),
          }).then(r => r.json())
        : Promise.resolve(null);
    Promise.all([fetchZone(zoneAId), fetchZone(zoneBId)])
      .then(([a, b]) => { setZoneAData(a); setZoneBData(b); })
      .catch(() => {})
      .finally(() => setCompLoading(false));
  }, [compareMode, zoneAId, zoneBId, city]);

  const handlePinDrop = useCallback((lat: number, lng: number) => {
    setDroppedPin({ lat, lng });
    setSelectedZone('');
    setInfraNearby(null);
  }, []);

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
                🗂 Zone
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
              <label>Zone / Sector</label>
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="intel-select"
              >
                <option value="">All Zones</option>
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
            {compareMode ? '✖ Exit Compare' : '⚖ Compare Zones'}
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
          <SummaryPanel
            data={analysisData}
            trendData={trendData}
            infraNearby={infraNearby}
            loading={loading}
            trendLoading={trendLoading}
            onExportReport={handleExportReport}
            exportLoading={exportLoading}
            onSwitchToReports={onSwitchToReports}
          />
        </div>
      )}
    </div>
  );
}
