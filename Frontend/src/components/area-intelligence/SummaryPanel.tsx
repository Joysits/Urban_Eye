import React from 'react';
import type { AnalysisData, InfrastructureNearby } from '../../types';
import RiskScoreRing from './RiskScoreRing';
import { calculateCityRiskSeverity, getKnbsCrimeDataForCity } from '../../utils/ncrcCrimeData';

interface Props {
  data: AnalysisData | null;
  infraNearby?: InfrastructureNearby | null;
  loading: boolean;
  onExportReport: () => void;
  exportLoading: boolean;
  onSwitchToReports?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Stealing & Theft': '#f87171',
  'House Burglary': '#e65c5c',
  'Illegal Drug Possession': '#c96b6b',
  'Illicit Alcohol Possession': '#f59e0b',
  'Domestic & Gender Violence': '#ec4899',
  'Child Abuse & Neglect': '#fb7185',
  'Physical Assault': '#d97706',
  'Street Mugging & Robbery': '#ea580c',
  'Armed / Violent Robbery': '#dc2626',
  'Public Drunkenness': '#eab308',
  'Defilement': '#f43f5e',
  'Murder': '#991b1b',
  'Rape': '#e11d48',
};

export default function SummaryPanel({
  data, infraNearby, loading,
  onExportReport, exportLoading,
}: Props) {
  if (loading || !data) {
    return (
      <div className="summary-panel-refined" style={{ padding: 32, textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px solid rgba(124, 29, 36, 0.15)', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
        <div className="summary-loading">
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#7c1d24', fontSize: '0.85rem', fontWeight: 600 }}>Calculating intelligence metrics…</p>
        </div>
      </div>
    );
  }

  // Calculated exact empirical City Risk Severity from NCRC & KNBS data
  const ncrcResult = calculateCityRiskSeverity(data.city, 6);
  const knbsData = getKnbsCrimeDataForCity(data.city);
  const activeSeverityScore = data.risk_score || ncrcResult.score;

  const zoneDisplayName = data.zone_name.includes('All Zones') || data.zone_name.includes('All Locations') || data.zone_name.includes('All Sub-Locations')
    ? `All Sub-Locations (${data.city})`
    : data.zone_name;

  const isSpecificZone = data.zone_id != null || (!data.zone_name.includes('All Zones') && !data.zone_name.includes('All Sub-Locations') && data.zone_name !== '');

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
    <div className="summary-panel-refined fade-in" style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid rgba(124, 29, 36, 0.15)', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)', fontFamily: 'sans-serif' }}>
      
      {/* Zone Title Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7c1d24', margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>{zoneDisplayName}</h2>
        <span style={{ fontSize: '0.78rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
          {data.city} • Security Assessment
        </span>
      </div>

      {/* Hero Section: Risk Score & Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16, alignItems: 'center', marginBottom: 20, padding: 14, background: '#f8f4f4', borderRadius: 12, border: '1px solid rgba(124, 29, 36, 0.12)' }}>
        <div style={{ textAlign: 'center' }}>
          <RiskScoreRing score={activeSeverityScore} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.1)' }}>
            <span style={{ display: 'block', fontSize: '0.62rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              {isSpecificZone ? 'Sub-County Risk Level' : 'City Base Risk Level'}
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c' }}>{activeSeverityScore}%</span>
          </div>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.1)' }}>
            <span style={{ display: 'block', fontSize: '0.62rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              {isSpecificZone ? 'Sub-County Pop.' : 'City Pop.'}
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c1d24' }}>
              {data.population_info?.total_population ? data.population_info.total_population.toLocaleString() : '—'}
            </span>
          </div>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.1)' }}>
            <span style={{ display: 'block', fontSize: '0.62rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              Sub-County Density /km²
            </span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c1d24' }}>
              {data.population_info?.density ? `${data.population_info.density.toLocaleString()}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Official KNBS Economic Survey 2026 Police Command Station Summary */}
      <div style={{ marginBottom: 20, padding: 12, background: '#f8f4f4', borderRadius: 12, border: '1px solid rgba(124, 29, 36, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
            POLICE COMMAND STATION (KNBS 2026)
          </h4>
          <span style={{ fontSize: '0.62rem', background: '#7c1d24', color: '#fff', borderRadius: 4, padding: '2px 6px', fontWeight: 800 }}>
            SURVEY 2026
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1c0507', marginBottom: 8 }}>
          {knbsData.commandStation}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75rem' }}>
          <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(124, 29, 36, 0.1)' }}>
            <span style={{ display: 'block', fontSize: '0.64rem', color: '#7c1d24', textTransform: 'uppercase', fontWeight: 700 }}>2025 Reported Cases</span>
            <strong style={{ color: '#7c1d24', fontSize: '0.95rem', fontWeight: 800 }}>{knbsData.latestYear.toLocaleString()}</strong>
          </div>
          <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(124, 29, 36, 0.1)' }}>
            <span style={{ display: 'block', fontSize: '0.64rem', color: '#7c1d24', textTransform: 'uppercase', fontWeight: 700 }}>5-Yr Total (2021–25)</span>
            <strong style={{ color: '#7c1d24', fontSize: '0.95rem', fontWeight: 800 }}>{knbsData.fiveYearTotal.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Crime Category Prevalence Graph */}
      <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid rgba(124, 29, 36, 0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            CRIME CATEGORY PREVALENCE GRAPH ({ncrcResult.cityName})
          </h4>
          <span style={{ fontSize: '0.64rem', color: '#7a4d52', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
            NCRC SURVEY DATA
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ncrcResult.topIncidents.map((item) => {
            const color = CATEGORY_COLORS[item.category] || '#7c1d24';
            return (
              <div key={item.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1c0507', fontFamily: 'Inter, sans-serif' }}>{item.category}</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#7c1d24', fontFamily: 'Outfit, sans-serif' }}>{item.percentage.toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: 7, background: '#f5f0f1', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(124, 29, 36, 0.08)' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', backgroundColor: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Major Physical Infrastructure List */}
      <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid rgba(124, 29, 36, 0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
            Physical Infrastructure (per Sub-County / Zone)
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {infraData.map((inf: { infra_type?: string; type?: string; count: number }) => {
            const typeLabel = inf.infra_type || inf.type || 'Facility';
            return (
              <div key={typeLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#1c0507', fontWeight: 600 }}>• {typeLabel}</span>
                <span style={{ color: '#7c1d24', fontWeight: 700 }}>{inf.count} Facilities</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export PDF Button */}
      <div style={{ paddingTop: 16, borderTop: '1px solid rgba(124, 29, 36, 0.12)' }}>
        <button
          onClick={onExportReport}
          disabled={exportLoading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          {exportLoading ? 'GENERATING REPORT…' : 'EXPORT PDF REPORT'}
        </button>
      </div>
    </div>
  );
}
