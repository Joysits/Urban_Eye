import React from 'react';
import type { AnalysisData, InfrastructureNearby } from '../../types';
import RiskScoreRing from './RiskScoreRing';

interface Props {
  data: AnalysisData | null;
  infraNearby: InfrastructureNearby | null;
  loading: boolean;
  onExportReport: () => void;
  exportLoading: boolean;
  onSwitchToReports?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Theft:     '#ef4444',
  Assault:   '#f97316',
  Traffic:   '#3b82f6',
  Vandalism: '#eab308',
  Robbery:   '#8b5cf6',
  Burglary:  '#10b981',
};

const SEVERITY_COLOR: Record<string, string> = {
  Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', Critical: '#8b5cf6',
};

export default function SummaryPanel({
  data, infraNearby, loading,
  onExportReport, exportLoading, onSwitchToReports,
}: Props) {
  if (loading || !data) {
    return (
      <div className="summary-panel-refined">
        <div className="summary-loading">
          <div className="spinner" />
          <p>Loading location intelligence data…</p>
        </div>
      </div>
    );
  }

  // Filter out 'Other' category from Crime Breakdown
  const filteredCrimeBreakdown = (data.crime_breakdown ?? []).filter(c => c.category !== 'Other');

  // Filter infrastructure summary
  const infraData =
    infraNearby?.infrastructure ??
    (data.infrastructure_summary ?? []).map(i => ({
      infra_type: (i as { infra_type?: string; type?: string }).infra_type || (i as { infra_type?: string; type?: string }).type || 'Facility',
      count: i.count,
    }));

  const recentIncidents = (Array.isArray(data.recent_incidents)
    ? data.recent_incidents
    : (data.recent_incidents as { features?: unknown[] })?.features ?? []
  ).slice(0, 5).map((inc: unknown) => {
    const item = inc as { id: number; properties?: Record<string, string>; category?: string; severity?: string; description?: string };
    const p = item.properties;
    return {
      id: item.id,
      category: p?.category ?? item.category ?? 'Incident',
      severity: p?.severity ?? item.severity ?? 'Moderate',
      description: p?.description ?? item.description ?? '',
    };
  });

  const locationName = data.zone_name === 'All Zones (Nairobi)' || data.zone_name.startsWith('All Zones')
    ? `All Locations (${data.city})`
    : data.zone_name;

  const maxCrimeCount = Math.max(...filteredCrimeBreakdown.map(c => c.count), 1);

  return (
    <div className="summary-panel-refined fade-in">
      {/* Header */}
      <div className="summary-ref-header">
        <div>
          <h2 className="summary-ref-title">{locationName}</h2>
          <span className="summary-ref-subtitle">{data.city} • Area Intelligence</span>
        </div>
        <button
          className="ref-export-btn"
          onClick={onExportReport}
          disabled={exportLoading}
          title="Export current location analysis as a report"
        >
          {exportLoading ? 'Saving…' : 'Export Report'}
        </button>
      </div>

      {/* Risk Score Ring & Key Metrics */}
      <div className="summary-ref-hero">
        <RiskScoreRing score={data.risk_score} />
        <div className="summary-ref-stats-grid">
          <div className="ref-stat-box">
            <span className="ref-stat-label">Total Incidents</span>
            <span className="ref-stat-val val-incidents">{data.total_incidents.toLocaleString()}</span>
          </div>
          <div className="ref-stat-box">
            <span className="ref-stat-label">Population</span>
            <span className="ref-stat-val">
              {data.population_info?.total_population?.toLocaleString() ?? '—'}
            </span>
          </div>
          <div className="ref-stat-box">
            <span className="ref-stat-label">Density /km²</span>
            <span className="ref-stat-val">{data.population_info?.density?.toLocaleString() ?? '—'}</span>
          </div>
          <div className="ref-stat-box">
            <span className="ref-stat-label">Growth Rate</span>
            <span className="ref-stat-val val-growth">
              {data.population_info?.growth_rate != null
                ? `+${data.population_info.growth_rate}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Crime Breakdown Section */}
      {filteredCrimeBreakdown.length > 0 && (
        <div className="summary-ref-card">
          <div className="ref-card-header">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2" style={{ marginRight: 6 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3>Crime Breakdown</h3>
          </div>
          <div className="ref-breakdown-list">
            {filteredCrimeBreakdown.map(item => {
              const catColor = CATEGORY_COLORS[item.category] || '#ef4444';
              const fillPct = (item.count / maxCrimeCount) * 100;
              return (
                <div key={item.category} className="ref-breakdown-row">
                  <span className="ref-breakdown-name">{item.category}</span>
                  <div className="ref-breakdown-track">
                    <div
                      className="ref-breakdown-fill"
                      style={{
                        width: `${Math.max(fillPct, 6)}%`,
                        background: `linear-gradient(90deg, ${catColor}, ${catColor}cc)`,
                        boxShadow: `0 0 10px ${catColor}44`,
                      }}
                    />
                  </div>
                  <strong className="ref-breakdown-count" style={{ color: catColor }}>
                    {item.count}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Infrastructure Nearby Section */}
      <div className="summary-ref-card">
        <div className="ref-card-header">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth="2" style={{ marginRight: 6 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V12a1 1 0 011-1h2a1 1 0 011 1v9" />
          </svg>
          <h3>Infrastructure Nearby</h3>
        </div>
        {infraData.length === 0 ? (
          <p className="summary-empty-text">No infrastructure recorded for this location.</p>
        ) : (
          <div className="ref-infra-grid">
            {infraData.map(item => (
              <div key={item.infra_type} className="ref-infra-card">
                <span className="ref-infra-type-name">{item.infra_type}</span>
                <span className="ref-infra-count">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Incidents Section */}
      {recentIncidents.length > 0 && (
        <div className="summary-ref-card">
          <div className="ref-card-header">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth="2" style={{ marginRight: 6 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3>Recent Incidents</h3>
          </div>
          <div className="ref-incidents-list">
            {recentIncidents.map(inc => (
              <div key={inc.id} className="ref-incident-item">
                <div className="ref-incident-details">
                  <span className="ref-incident-cat">{inc.category}</span>
                  {inc.description && (
                    <span className="ref-incident-desc">
                      {inc.description.slice(0, 64)}{inc.description.length > 64 ? '…' : ''}
                    </span>
                  )}
                </div>
                <span
                  className="ref-severity-badge"
                  style={{
                    color: SEVERITY_COLOR[inc.severity] ?? '#a0aec0',
                    borderColor: `${SEVERITY_COLOR[inc.severity] ?? '#a0aec0'}44`,
                    background: `${SEVERITY_COLOR[inc.severity] ?? '#a0aec0'}15`,
                  }}
                >
                  {inc.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onSwitchToReports && (
        <button className="ref-switch-reports-btn" onClick={onSwitchToReports}>
          View All Reports →
        </button>
      )}
    </div>
  );
}
