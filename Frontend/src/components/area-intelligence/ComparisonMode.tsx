import React, { useState, useEffect } from 'react';
import type { AnalysisData, Zone } from '../../types';
import RiskScoreRing from './RiskScoreRing';

interface Props {
  currentUser?: any;
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
  onSaveReport?: (title: string, summary: string) => void;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: token ? `Token ${token}` : '' };
}

function DeltaRow({ a, b, label, higherIsBetter = false }: {
  a: number | null | undefined; b: number | null | undefined; label: string; higherIsBetter?: boolean;
}) {
  if (a == null || b == null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(124, 29, 36, 0.12)', fontSize: '0.8rem' }}>
        <span style={{ color: '#7a4d52' }}>{label}</span>
        <span style={{ color: '#7a4d52' }}>—</span>
      </div>
    );
  }

  const diff = a - b;
  const isPositive = diff >= 0;
  const isBetter = higherIsBetter ? isPositive : !isPositive;
  const color = diff === 0 ? '#7a4d52' : isBetter ? '#16a34a' : '#dc2626';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(124, 29, 36, 0.12)', fontSize: '0.82rem' }}>
      <span style={{ color: '#1c0507', fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontWeight: 800, fontFamily: 'monospace' }}>
        {diff === 0 ? '=' : isPositive ? '▲ +' : '▼ '}
        {Math.abs(diff).toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </span>
    </div>
  );
}

function MiniBar({ value, max, label, total }: { value: number; max: number; label: string; total?: number }) {
  const pct = total && total > 0 ? (value / total) * 100 : (max > 0 ? (value / max) * 100 : 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, margin: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#1c0507', fontWeight: 600 }}>
        <span>{label}</span>
        <span style={{ color: '#7c1d24', fontWeight: 800 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, width: '100%', background: '#f5f0f1', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg, #7c1d24, #a63a3a)', borderRadius: 3 }} />
      </div>
    </div>
  );
}

function ZoneCard({ data, label, colorBadge }: {
  data: AnalysisData | null; label: string; colorBadge: string;
}) {
  if (!data) {
    return (
      <div style={{ background: '#ffffff', border: '1px dashed rgba(124, 29, 36, 0.3)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
        <div style={{ background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.2)', color: colorBadge, padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', marginBottom: 16 }}>
          {label}
        </div>
        <p style={{ color: '#7c1d24', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>Select a sub-county from the dropdown above to load comparative data</p>
      </div>
    );
  }

  const filteredCrime = (data.crime_breakdown ?? []).filter(c => c.category !== 'Other');
  const totalCrimeCount = filteredCrime.reduce((acc, c) => acc + c.count, 0) || 1;

  return (
    <div className="fade-in" style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.15)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(124, 29, 36, 0.12)', paddingBottom: 14 }}>
        <div>
          <span style={{ background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.2)', color: colorBadge, padding: '3px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {label}
          </span>
          <h3 style={{ margin: '8px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1c0507', fontFamily: 'Outfit, sans-serif' }}>{data.zone_name}</h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#7c1d24', fontWeight: 700 }}>{data.city} Sub-County</span>
      </div>

      {/* Sub-County Risk Score Ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 6 }}>
        <RiskScoreRing score={data.risk_score} />
        <span style={{ fontSize: '0.72rem', color: '#7c1d24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sub-County Risk Score</span>
      </div>

      {/* Stats Grid: Focus exclusively on Sub-County Risk, Population, and Density */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.12)', padding: '10px 10px', borderRadius: 10, textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.66rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Sub-County Risk</span>
          <strong style={{ display: 'block', fontSize: '1.05rem', color: '#b91c1c', marginTop: 2 }}>{data.risk_score}%</strong>
        </div>
        <div style={{ background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.12)', padding: '10px 10px', borderRadius: 10, textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.66rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Population</span>
          <strong style={{ display: 'block', fontSize: '1.05rem', color: '#1c0507', marginTop: 2 }}>
            {data.population_info?.total_population?.toLocaleString() ?? '—'}
          </strong>
        </div>
        <div style={{ background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.12)', padding: '10px 10px', borderRadius: 10, textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.66rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Density /km²</span>
          <strong style={{ display: 'block', fontSize: '1.05rem', color: '#1c0507', marginTop: 2 }}>
            {data.population_info?.density?.toLocaleString() ?? '—'}
          </strong>
        </div>
      </div>

      {/* Sub-County Physical Infrastructure */}
      {data.infrastructure_summary?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(124, 29, 36, 0.12)' }}>
          <span style={{ fontSize: '0.72rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Sub-County Physical Infrastructure</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {data.infrastructure_summary.slice(0, 4).map((inf: { infra_type?: string; type?: string; count: number }) => (
              <div key={inf.infra_type ?? inf.type} style={{ background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.15)', padding: '6px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: '#1c0507', fontWeight: 600 }}>• {inf.infra_type ?? inf.type}</span>
                <span style={{ color: '#7c1d24', fontWeight: 800 }}>{inf.count}</span>
              </div>
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
  onSelectZoneB, onZoneBChange, city, loading, onSaveReport, currentUser
}: Props) {
  const activeZoneAData = zoneA ?? dataA ?? null;
  const activeZoneBData = zoneB ?? dataB ?? null;

  const selA = selectedZoneA ?? zoneAId ?? '';
  const selB = selectedZoneB ?? zoneBId ?? '';

  const setA = onSelectZoneA ?? onZoneAChange;
  const setB = onSelectZoneB ?? onZoneBChange;

  const [toastSaved, setToastSaved] = useState(false);

  const handleSaveComparison = () => {
    if (!activeZoneAData || !activeZoneBData) {
      alert('Please select both Sub-County A and Sub-County B from the dropdowns before saving the comparison.');
      return;
    }

    const title = `${activeZoneAData.zone_name} vs ${activeZoneBData.zone_name} Sub-County Comparison`;
    const summary = `=== SUB-COUNTY COMPARATIVE ANALYSIS SUMMARY ===\nCity: ${city}\nSub-County A (${activeZoneAData.zone_name}): Risk Score ${activeZoneAData.risk_score}% | Pop: ${activeZoneAData.population_info?.total_population?.toLocaleString()} | Density: ${activeZoneAData.population_info?.density} /km²\nSub-County B (${activeZoneBData.zone_name}): Risk Score ${activeZoneBData.risk_score}% | Pop: ${activeZoneBData.population_info?.total_population?.toLocaleString()} | Density: ${activeZoneBData.population_info?.density} /km²\nSub-County Risk Score Delta (A - B): ${(activeZoneAData.risk_score - activeZoneBData.risk_score).toFixed(1)} points.`;

    let userEmail = currentUser?.email || '';
    if (!userEmail) {
      try {
        const storedUser = localStorage.getItem('smart_urban_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u && u.email) userEmail = u.email;
        }
      } catch {}
    }

    const userKey = (userEmail || 'guest').toLowerCase();
    const storageKey = `saved_zone_comparisons_${userKey}`;

    const newComparison = {
      id: 'comp_' + Date.now(),
      title,
      city: city || 'Nairobi',
      created_at: new Date().toISOString(),
      zoneA: {
        name: activeZoneAData.zone_name,
        risk_score: activeZoneAData.risk_score || 50,
        population: activeZoneAData.population_info?.total_population || 0,
        density: activeZoneAData.population_info?.density || 0,
      },
      zoneB: {
        name: activeZoneBData.zone_name,
        risk_score: activeZoneBData.risk_score || 50,
        population: activeZoneBData.population_info?.total_population || 0,
        density: activeZoneBData.population_info?.density || 0,
      },
      summary,
    };

    try {
      const existing = localStorage.getItem(storageKey);
      const parsed = existing ? JSON.parse(existing) : [];
      const updated = [newComparison, ...parsed];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      localStorage.setItem('urban_eye_saved_comparisons', JSON.stringify(updated));
      localStorage.setItem('saved_zone_comparisons_guest', JSON.stringify(updated));
    } catch {}

    try {
      fetch('/api/reports/generate_from_analysis/', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          city,
          title,
          focus: 'analytics',
          summary,
        }),
      });
    } catch {}

    setToastSaved(true);
    setTimeout(() => setToastSaved(false), 4000);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Top Selector Bar ── */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.15)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1c0507', fontFamily: 'Outfit, sans-serif' }}>SUB-COUNTY COMPARISON</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#7c1d24', fontWeight: 600 }}>{city} · Side-by-side comparative sub-county metrics</p>
        </div>

        {/* Dropdown Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.7rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Select Sub-County A</label>
            <select
              value={selA}
              onChange={e => setA?.(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, background: '#ffffff', color: '#1c0507', border: '1px solid rgba(124, 29, 36, 0.25)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer', minWidth: 200 }}
            >
              <option value="">Select Sub-County A</option>
              {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
            </select>
          </div>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c1d24', fontFamily: 'Outfit, sans-serif', padding: '16px 4px 0' }}>VS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.7rem', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Select Sub-County B</label>
            <select
              value={selB}
              onChange={e => setB?.(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, background: '#ffffff', color: '#1c0507', border: '1px solid rgba(29, 78, 216, 0.35)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer', minWidth: 200 }}
            >
              <option value="">Select Sub-County B</option>
              {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#7c1d24', padding: '40px', fontWeight: 600 }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Calculating sub-county comparative metrics…
        </div>
      )}

      {!loading && (
        <>
          {/* 3-Column Grid: Zone A Card | Differences Panel | Zone B Card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1.1fr', gap: 20, alignItems: 'start' }}>
            
            {/* Column 1: Zone A */}
            <ZoneCard data={activeZoneAData} label="SUB-COUNTY A" colorBadge="#7c1d24" />

            {/* Column 2: Differences Panel */}
            <div style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.15)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(124, 29, 36, 0.12)', paddingBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1c0507', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                  SUB-COUNTY VARIANCE (A − B)
                </h4>
                <small style={{ color: '#7c1d24', fontSize: '0.72rem', fontWeight: 700 }}>Comparing sub-county metrics</small>
              </div>

              <div>
                <DeltaRow a={activeZoneAData?.risk_score} b={activeZoneBData?.risk_score} label="Sub-County Risk Score" />
                <DeltaRow a={activeZoneAData?.population_info?.total_population} b={activeZoneBData?.population_info?.total_population} label="Sub-County Population" higherIsBetter />
                <DeltaRow a={activeZoneAData?.population_info?.density} b={activeZoneBData?.population_info?.density} label="Sub-County Density /km²" />
              </div>

              {/* Action Button */}
              <button
                onClick={handleSaveComparison}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
                  transition: 'all 0.2s ease',
                  marginTop: 8,
                }}
              >
                Save Sub-County Comparison Report
              </button>
            </div>

            {/* Column 3: Zone B */}
            <ZoneCard data={activeZoneBData} label="SUB-COUNTY B" colorBadge="#1d4ed8" />
          </div>
        </>
      )}

      {/* Toast Banner for Saved Report */}
      {toastSaved && (
        <div className="intel-toast intel-toast-success">
          <span>Comparative report saved successfully to Report Generator!</span>
        </div>
      )}
    </div>
  );
}
