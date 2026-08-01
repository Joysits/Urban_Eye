import React, { useState, useEffect } from 'react';
import type { AnalysisData, Zone } from '../../types';
import RiskScoreRing from './RiskScoreRing';
import type { ComparisonReportData } from '../../utils/reportExporter';

interface Props {
  zoneA?: AnalysisData | null;
  dataA?: AnalysisData | null;
  zoneB?: AnalysisData | null;
  dataB?: AnalysisData | null;
  zones: Zone[];
  selectedZoneA?: string;
  selectedZoneB?: string;
  zoneAId?: string;
  zoneBId?: string;
  onSelectZoneA?: (id: string) => void;
  onSelectZoneB?: (id: string) => void;
  onZoneAChange?: (id: string) => void;
  onZoneBChange?: (id: string) => void;
  city: string;
  loading: boolean;
  onShowToast?: (msg: string) => void;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Token ${token}` };
}

function Delta({ a, b, label, higherIsBetter = false }: {
  a: number | null; b: number | null; label: string; higherIsBetter?: boolean;
}) {
  if (a == null || b == null) return null;
  const diff = a - b;
  const isPositive = diff >= 0;
  const isBetter = higherIsBetter ? isPositive : !isPositive;
  const color = diff === 0 ? '#718096' : isBetter ? '#68d391' : '#fc8181';
  return (
    <div className="delta-row">
      <span className="delta-label">{label}</span>
      <span className="delta-value" style={{ color }}>
        {diff === 0 ? '=' : isPositive ? '▲' : '▼'} {Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </span>
    </div>
  );
}

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const t = pct / 100;
  const r = Math.round(255 - t * (255 - 90));
  const g = Math.round(179 - t * (179 - 10));
  const b = Math.round(179 - t * (179 - 16));
  return (
    <div className="comp-mini-bar-row">
      <span className="comp-mini-label">{label}</span>
      <div className="comp-mini-track">
        <div
          className="comp-mini-fill"
          style={{ width: `${pct}%`, background: `rgb(${r},${g},${b})` }}
        />
      </div>
      <span className="comp-mini-count">{value}</span>
    </div>
  );
}

function ZoneCard({ data, label, colorClass }: {
  data: AnalysisData | null; label: string; colorClass: string;
}) {
  if (!data) {
    return (
      <div className={`comp-card comp-card-empty comp-card-${colorClass}`}>
        <div className="comp-card-label-badge">{label}</div>
        <p>Select a zone to load data</p>
      </div>
    );
  }

  const filteredCrime = (data.crime_breakdown ?? []).filter(c => c.category !== 'Other');
  const maxCrime = Math.max(...filteredCrime.map(c => c.count), 1);

  return (
    <div className={`comp-card fade-in comp-card-${colorClass}`}>
      <div className="comp-card-header">
        <span className="comp-card-label-badge">{label}</span>
        <h3 className="comp-card-title">{data.zone_name}</h3>
        <span className="comp-card-city">{data.city}</span>
      </div>

      <div className="comp-card-ring">
        <RiskScoreRing score={data.risk_score} />
      </div>

      <div className="comp-stats-grid">
        <div className="comp-stat-box">
          <span className="comp-stat-label">Incidents</span>
          <strong className="comp-stat-val">{data.total_incidents.toLocaleString()}</strong>
        </div>
        <div className="comp-stat-box">
          <span className="comp-stat-label">Population</span>
          <strong className="comp-stat-val">
            {data.population_info?.total_population?.toLocaleString() ?? '—'}
          </strong>
        </div>
        <div className="comp-stat-box">
          <span className="comp-stat-label">Density /km²</span>
          <strong className="comp-stat-val">
            {data.population_info?.density?.toLocaleString() ?? '—'}
          </strong>
        </div>
        <div className="comp-stat-box">
          <span className="comp-stat-label">Growth</span>
          <strong className="comp-stat-val" style={{ color: '#68d391' }}>
            {data.population_info?.growth_rate != null
              ? `+${data.population_info.growth_rate}%`
              : '—'}
          </strong>
        </div>
      </div>

      <div className="comp-breakdown-section">
        <p className="comp-breakdown-title">Crime by Category</p>
        {filteredCrime.slice(0, 5).map(item => (
          <MiniBar key={item.category} value={item.count} max={maxCrime} label={item.category} />
        ))}
      </div>

      {data.infrastructure_summary?.length > 0 && (
        <div className="comp-infra-section">
          <p className="comp-breakdown-title">Infrastructure</p>
          <div className="comp-infra-chips">
            {data.infrastructure_summary.slice(0, 4).map((inf: { infra_type?: string; type?: string; count: number }) => (
              <span key={inf.infra_type ?? inf.type} className="comp-infra-chip">
                {inf.infra_type ?? inf.type} · {inf.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparisonMode({
  zoneA, dataA, zoneB, dataB, zones, selectedZoneA, zoneAId,
  selectedZoneB, zoneBId, onSelectZoneA, onZoneAChange,
  onSelectZoneB, onZoneBChange, city, loading, onShowToast,
}: Props) {
  const activeZoneAData = zoneA ?? dataA ?? null;
  const activeZoneBData = zoneB ?? dataB ?? null;

  const selA = selectedZoneA ?? zoneAId ?? '';
  const selB = selectedZoneB ?? zoneBId ?? '';

  const setA = onSelectZoneA ?? onZoneAChange;
  const setB = onSelectZoneB ?? onZoneBChange;

  const [savedAlert, setSavedAlert] = useState<string | null>(null);

  // Fetch trend data for both zones
  const [trendA, setTrendA] = useState<{ month: string; total: number }[]>([]);
  const [trendB, setTrendB] = useState<{ month: string; total: number }[]>([]);

  useEffect(() => {
    if (!selA) { setTrendA([]); return; }
    fetch(`/api/analysis/crime-trend/?city=${encodeURIComponent(city)}&zone_id=${selA}&months=6`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTrendA(d.month_totals ?? []))
      .catch(() => setTrendA([]));
  }, [selA, city]);

  useEffect(() => {
    if (!selB) { setTrendB([]); return; }
    fetch(`/api/analysis/crime-trend/?city=${encodeURIComponent(city)}&zone_id=${selB}&months=6`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTrendB(d.month_totals ?? []))
      .catch(() => setTrendB([]));
  }, [selB, city]);

  const maxTrend = Math.max(...trendA.map(m => m.total), ...trendB.map(m => m.total), 1);

  const handleSaveComparison = () => {
    if (!activeZoneAData || !activeZoneBData) {
      setSavedAlert('Please select both Zone A and Zone B before saving.');
      setTimeout(() => setSavedAlert(null), 4000);
      return;
    }

    const item: ComparisonReportData = {
      id: `comp_${Date.now()}`,
      city,
      created_at: new Date().toISOString(),
      zoneA_name: activeZoneAData.zone_name,
      zoneA_risk: activeZoneAData.risk_score,
      zoneA_incidents: activeZoneAData.total_incidents,
      zoneA_density: activeZoneAData.population_info?.density ?? 0,
      zoneB_name: activeZoneBData.zone_name,
      zoneB_risk: activeZoneBData.risk_score,
      zoneB_incidents: activeZoneBData.total_incidents,
      zoneB_density: activeZoneBData.population_info?.density ?? 0,
      risk_diff: (activeZoneAData.risk_score ?? 0) - (activeZoneBData.risk_score ?? 0),
      incidents_diff: (activeZoneAData.total_incidents ?? 0) - (activeZoneBData.total_incidents ?? 0),
      density_diff: (activeZoneAData.population_info?.density ?? 0) - (activeZoneBData.population_info?.density ?? 0),
    };

    try {
      const savedUser = localStorage.getItem('user');
      const userKey = savedUser ? (JSON.parse(savedUser).email || 'guest').toLowerCase() : 'guest';
      const existing = JSON.parse(localStorage.getItem(`saved_zone_comparisons_${userKey}`) || '[]');
      const updated = [item, ...existing.filter((e: ComparisonReportData) => e.id !== item.id).slice(0, 9)];
      localStorage.setItem(`saved_zone_comparisons_${userKey}`, JSON.stringify(updated));
      setSavedAlert(`Saved comparison (${activeZoneAData.zone_name} vs ${activeZoneBData.zone_name}) to Report Generator!`);
      onShowToast?.("Comparison Saved!");
      setTimeout(() => setSavedAlert(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="comparison-mode fade-in">
      <div className="comp-header">
        <div>
          <h2 className="comp-title">Zone Comparison</h2>
          <p className="comp-subtitle">{city} · Side-by-side comparative analysis</p>
        </div>
      </div>

      <div className="comp-selectors">
        <div className="comp-selector">
          <label>Zone A</label>
          <select value={selA} onChange={e => setA?.(e.target.value)}>
            <option value="">Select Zone A</option>
            {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
          </select>
        </div>
        <div className="comp-vs">VS</div>
        <div className="comp-selector">
          <label>Zone B</label>
          <select value={selB} onChange={e => setB?.(e.target.value)}>
            <option value="">Select Zone B</option>
            {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#a0aec0', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading zone comparison data…
        </div>
      )}

      {!loading && (
        <>
          <div className="comp-grid">
            <ZoneCard data={activeZoneAData} label="ZONE A" colorClass="a" />

            <div className="comp-deltas">
              <h4>Differences (A − B)</h4>
              <Delta a={activeZoneAData?.risk_score ?? null}                             b={activeZoneBData?.risk_score ?? null}                             label="Risk Score" />
              <Delta a={activeZoneAData?.total_incidents ?? null}                        b={activeZoneBData?.total_incidents ?? null}                        label="Incidents" />
              <Delta a={activeZoneAData?.population_info?.density ?? null}               b={activeZoneBData?.population_info?.density ?? null}               label="Density /km²" />
              <Delta a={activeZoneAData?.population_info?.growth_rate ?? null}           b={activeZoneBData?.population_info?.growth_rate ?? null}           label="Growth %" higherIsBetter />
              <Delta a={activeZoneAData?.population_info?.total_population ?? null}      b={activeZoneBData?.population_info?.total_population ?? null}      label="Population" higherIsBetter />

              <button
                type="button"
                onClick={handleSaveComparison}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'linear-gradient(135deg, #e65c5c, #b91c1c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(230, 92, 92, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                💾 Save Comparison to Report
              </button>

              {savedAlert && (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#68d391', fontWeight: 600, textAlign: 'center' }}>
                  {savedAlert}
                </div>
              )}
            </div>

            <ZoneCard data={activeZoneBData} label="ZONE B" colorClass="b" />
          </div>

          {/* Trend overlay chart */}
          {(trendA.length > 0 || trendB.length > 0) && (
            <div className="comp-trend-section">
              <h4 className="comp-trend-title">6-Month Incident Trend Overlay</h4>
              <div className="comp-trend-chart">
                {(trendA.length > 0 ? trendA : trendB).map((m, i) => {
                  const aVal = trendA[i]?.total ?? 0;
                  const bVal = trendB[i]?.total ?? 0;
                  const label = m.month
                    ? new Date(m.month + '-01').toLocaleString('default', { month: 'short' })
                    : `M${i + 1}`;
                  return (
                    <div key={m.month ?? i} className="comp-trend-col">
                      <div className="comp-trend-bars">
                        <div
                          className="comp-trend-bar comp-trend-bar-a"
                          style={{ height: `${(aVal / maxTrend) * 100}%` }}
                          title={`Zone A: ${aVal}`}
                        />
                        <div
                          className="comp-trend-bar comp-trend-bar-b"
                          style={{ height: `${(bVal / maxTrend) * 100}%` }}
                          title={`Zone B: ${bVal}`}
                        />
                      </div>
                      <span className="comp-trend-label">{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="comp-trend-legend">
                <span><span className="comp-legend-dot" style={{ background: '#c93030' }} />{activeZoneAData?.zone_name ?? 'Zone A'}</span>
                <span><span className="comp-legend-dot" style={{ background: '#3b82f6' }} />{activeZoneBData?.zone_name ?? 'Zone B'}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
