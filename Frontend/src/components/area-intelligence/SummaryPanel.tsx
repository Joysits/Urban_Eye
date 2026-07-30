import React from 'react';
import type { AnalysisData, InfrastructureNearby } from '../../types';
import RiskScoreRing from './RiskScoreRing';

interface Props {
  data: AnalysisData | null;
  infraNearby?: InfrastructureNearby | null;
  loading: boolean;
  onExportReport: () => void;
  exportLoading: boolean;
  onSwitchToReports?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Theft:                           '#eab308',
  Assault:                         '#ef4444',
  'Traffic & Mobility Disruptions': '#3b82f6',
  Traffic:                         '#3b82f6',
  Vandalism:                       '#a855f7',
  Robbery:                         '#ec4899',
  Burglary:                        '#10b981',
};

const SEVERITY_COLOR: Record<string, string> = {
  Low: '#10b981', Moderate: '#f59e0b', High: '#f97316', Critical: '#ef4444',
};

export default function SummaryPanel({
  data, infraNearby, loading,
  onExportReport, exportLoading,
}: Props) {
  if (loading || !data) {
    return (
      <div className="summary-panel-refined" style={{ padding: 32, textAlign: 'center', background: '#0e1117', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="summary-loading">
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Calculating zone metrics & risk score…</p>
        </div>
      </div>
    );
  }

  // Map category names
  const filteredCrimeBreakdown = (data.crime_breakdown ?? [])
    .filter(c => c.category !== 'Other')
    .map(c => ({
      ...c,
      category: c.category === 'Traffic' ? 'Traffic & Mobility Disruptions' : c.category,
    }));

  const zoneDisplayName = data.zone_name.includes('All Zones') || data.zone_name.includes('All Locations')
    ? `All Zones (${data.city})`
    : data.zone_name;

  const maxCrimeCount = Math.max(...filteredCrimeBreakdown.map(c => c.count), 1);
  const totalCategoryIncidents = filteredCrimeBreakdown.reduce((acc, curr) => acc + curr.count, 0);

  const isSpecificZone = data.zone_id != null || (!data.zone_name.includes('All Zones') && data.zone_name !== '');

  // Physical Infrastructure list (excluding power/water)
  const infraData = (
    infraNearby?.infrastructure ??
    (data?.infrastructure_summary ?? []).map(i => ({
      infra_type: (i as { infra_type?: string; type?: string }).infra_type || (i as { infra_type?: string; type?: string }).type || 'Facility',
      count: i.count,
    }))
  ).filter(i => {
    const name = ((i as any).infra_type || (i as any).type || '').toLowerCase();
    return !name.includes('power') && !name.includes('water') && !name.includes('substation');
  });

  return (
    <div className="summary-panel-refined fade-in" style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace, sans-serif' }}>
      {/* Zone Title Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', fontFamily: 'sans-serif' }}>{zoneDisplayName}</h2>
        <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.city} • ZONE INTELLIGENCE ASSESSMENT</span>
      </div>

      {/* Hero Section: Risk Score & Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16, alignItems: 'center', marginBottom: 24, padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
        <RiskScoreRing score={data.risk_score} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 6 }}>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Incidents</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444' }}>{data.total_incidents.toLocaleString()}</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 6 }}>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isSpecificZone ? 'Zone Pop.' : 'City Pop.'} (2026)
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              {data.population_info?.total_population ? data.population_info.total_population.toLocaleString() : '—'}
            </span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 6 }}>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isSpecificZone ? 'Zone Density' : 'City Density'}
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              {data.population_info?.density ? `${data.population_info.density.toLocaleString()} /km²` : '—'}
            </span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 6 }}>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Growth</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10b981' }}>
              {data.population_info?.growth_rate ? `+${data.population_info.growth_rate}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* INCIDENT BREAKDOWN (Matching Screenshot Layout) */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>
          INCIDENT BREAKDOWN
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredCrimeBreakdown.map((item) => {
            const pct = totalCategoryIncidents > 0
              ? ((item.count / totalCategoryIncidents) * 100).toFixed(1)
              : '0.0';
            const barWidth = `${(item.count / maxCrimeCount) * 100}%`;
            const color = CATEGORY_COLORS[item.category] || '#94a3b8';

            return (
              <div key={item.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0', fontFamily: 'sans-serif' }}>{item.category}</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{item.count.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
                  <div style={{ width: barWidth, height: '100%', backgroundColor: color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#475569' }}>{pct}% of total incidents</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Major Physical Infrastructure List */}
      {infraData.length > 0 && (
        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
            MAJOR PHYSICAL INFRASTRUCTURE
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {infraData.map((inf: { infra_type?: string; type?: string; count: number }) => {
              const typeLabel = inf.infra_type || inf.type || 'Facility';
              return (
                <div key={typeLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#cbd5e1' }}>• {typeLabel}</span>
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>{inf.count} Facilities</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export PDF Button (Matching Sleek Thin Bordered Button in Screenshot) */}
      <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onExportReport}
          disabled={exportLoading}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#cbd5e1',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            padding: '10px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {exportLoading ? 'GENERATING REPORT…' : 'EXPORT PDF REPORT'}
        </button>
      </div>
    </div>
  );
}

// ── Recent Reported Incidents In the Past 6 Months Table (Matching Right Column Screenshot Layout) ──
export function RecentIncidentsCard({ data }: { data: AnalysisData | null }) {
  const zoneName = data?.zone_name || 'Selected Zone';
  const city = data?.city || 'Nairobi';

  const sampleFeed = [
    { category: 'TRAFFIC & MOBILITY DISRUPTIONS', location: `${zoneName}, ${city}`, severity: 'LOW', color: '#10b981', time: '14:32', desc: 'Traffic congestion peaks during afternoon travel (4:00 PM - 7:30 PM).' },
    { category: 'TRAFFIC & MOBILITY DISRUPTIONS', location: `Central Business District, ${city}`, severity: 'CRITICAL', color: '#ef4444', time: '13:18', desc: 'Major arterial corridor delay near central transit station.' },
    { category: 'TRAFFIC & MOBILITY DISRUPTIONS', location: `${zoneName}, ${city}`, severity: 'LOW', color: '#10b981', time: '12:04', desc: 'Routine traffic slow-down near commercial intersection.' },
    { category: 'ASSAULT', location: `${zoneName}, ${city}`, severity: 'MODERATE', color: '#f59e0b', time: '10:51', desc: 'Late-night disturbance reported near commercial entertainment venues.' },
    { category: 'THEFT', location: `${zoneName}, ${city}`, severity: 'HIGH', color: '#f97316', time: '09:37', desc: 'Pickpocketing & sneak theft near crowded transit boarding points.' },
  ];

  return (
    <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace, sans-serif' }}>
      {/* Header Table Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 60px', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>INCIDENT</span>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>SEVERITY</span>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>TIME</span>
      </div>

      {/* Incident Feed Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sampleFeed.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 60px', alignItems: 'start', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{item.category}</span>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f1f5f9', fontFamily: 'sans-serif' }}>{item.location}</strong>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0', fontFamily: 'sans-serif', lineHeight: 1.3 }}>{item.desc}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontSize: '0.75rem', color: item.color, fontWeight: 700, letterSpacing: '0.5px' }}>{item.severity}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right', paddingTop: 4 }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
