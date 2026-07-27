import React, { useState, useEffect } from 'react';
import type { AnalysisData, Zone } from '../../types';
import RiskScoreRing from './RiskScoreRing';

interface Props {
  zoneA: AnalysisData | null;
  zoneB: AnalysisData | null;
  zones: Zone[];
  selectedZoneA: string;
  selectedZoneB: string;
  onSelectZoneA: (id: string) => void;
  onSelectZoneB: (id: string) => void;
  city: string;
  loading: boolean;
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
  // For risk/incidents: higher is BAD. For growth/population: higher is GOOD
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

  const maxCrime = Math.max(...data.crime_breakdown.map(c => c.count), 1);

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
        {data.crime_breakdown.slice(0, 5).map(item => (
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
  zoneA, zoneB, zones, selectedZoneA, selectedZoneB,
  onSelectZoneA, onSelectZoneB, city, loading,
}: Props) {
  // Fetch trend data for both zones
  const [trendA, setTrendA] = useState<{ month: string; total: number }[]>([]);
  const [trendB, setTrendB] = useState<{ month: string; total: number }[]>([]);

  useEffect(() => {
    if (!selectedZoneA) { setTrendA([]); return; }
    fetch(`/api/analysis/crime-trend/?city=${encodeURIComponent(city)}&zone_id=${selectedZoneA}&months=6`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTrendA(d.month_totals ?? []))
      .catch(() => setTrendA([]));
  }, [selectedZoneA, city]);

  useEffect(() => {
    if (!selectedZoneB) { setTrendB([]); return; }
    fetch(`/api/analysis/crime-trend/?city=${encodeURIComponent(city)}&zone_id=${selectedZoneB}&months=6`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTrendB(d.month_totals ?? []))
      .catch(() => setTrendB([]));
  }, [selectedZoneB, city]);

  const maxTrend = Math.max(...trendA.map(m => m.total), ...trendB.map(m => m.total), 1);

  return (
    <div className="comparison-mode fade-in">
      <div className="comp-header">
        <div>
          <h2 className="comp-title">Zone Comparison</h2>
          <p className="comp-subtitle">{city} · Side-by-side intelligence analysis</p>
        </div>
      </div>

      <div className="comp-selectors">
        <div className="comp-selector">
          <label>Zone A</label>
          <select value={selectedZoneA} onChange={e => onSelectZoneA(e.target.value)}>
            <option value="">— Select Zone A —</option>
            {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
          </select>
        </div>
        <div className="comp-vs">VS</div>
        <div className="comp-selector">
          <label>Zone B</label>
          <select value={selectedZoneB} onChange={e => onSelectZoneB(e.target.value)}>
            <option value="">— Select Zone B —</option>
            {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#a0aec0', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Loading comparison data…
        </div>
      )}

      {!loading && (
        <>
          <div className="comp-grid">
            <ZoneCard data={zoneA} label="ZONE A" colorClass="a" />

            <div className="comp-deltas">
              <h4>Differences (A − B)</h4>
              <Delta a={zoneA?.risk_score ?? null}                             b={zoneB?.risk_score ?? null}                             label="Risk Score" />
              <Delta a={zoneA?.total_incidents ?? null}                        b={zoneB?.total_incidents ?? null}                        label="Incidents" />
              <Delta a={zoneA?.population_info?.density ?? null}               b={zoneB?.population_info?.density ?? null}               label="Density /km²" />
              <Delta a={zoneA?.population_info?.growth_rate ?? null}           b={zoneB?.population_info?.growth_rate ?? null}           label="Growth %" higherIsBetter />
              <Delta a={zoneA?.population_info?.total_population ?? null}      b={zoneB?.population_info?.total_population ?? null}      label="Population" higherIsBetter />
            </div>

            <ZoneCard data={zoneB} label="ZONE B" colorClass="b" />
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
                <span><span className="comp-legend-dot" style={{ background: '#c93030' }} />{zoneA?.zone_name ?? 'Zone A'}</span>
                <span><span className="comp-legend-dot" style={{ background: '#3b82f6' }} />{zoneB?.zone_name ?? 'Zone B'}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
