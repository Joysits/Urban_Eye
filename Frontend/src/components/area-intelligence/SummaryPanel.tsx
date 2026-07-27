import React from 'react';
import type { AnalysisData, CrimeTrendData, InfrastructureNearby } from '../../types';
import RiskScoreRing from './RiskScoreRing';
import CrimeTrendChart from './CrimeTrendChart';

interface Props {
  data: AnalysisData | null;
  trendData: CrimeTrendData | null;
  infraNearby: InfrastructureNearby | null;
  loading: boolean;
  trendLoading: boolean;
  onExportReport: () => void;
  exportLoading: boolean;
  onSwitchToReports?: () => void;
}

const INFRA_ICONS: Record<string, string> = {
  School: '🏫', Hospital: '🏥', Road: '🛣️', Power: '⚡', Water: '💧', Other: '🏗️',
};

const SEVERITY_COLOR: Record<string, string> = {
  Low: '#48bb78', Moderate: '#ed8936', High: '#f56565', Critical: '#9f7aea',
};

export default function SummaryPanel({
  data, trendData, infraNearby, loading, trendLoading,
  onExportReport, exportLoading, onSwitchToReports,
}: Props) {
  if (loading || !data) {
    return (
      <div className="summary-panel">
        <div className="summary-loading">
          <div className="spinner" />
          <p>Loading area data…</p>
        </div>
      </div>
    );
  }

  const infraData =
    infraNearby?.infrastructure ??
    data.infrastructure_summary.map(i => ({ infra_type: i.type, count: i.count }));

  const recentIncidents = (data.recent_incidents ?? []).slice(0, 5).map(inc => {
    const p = (inc as { properties?: Record<string, string> }).properties;
    return {
      id: inc.id,
      category: p?.category ?? (inc as { category?: string }).category ?? 'Unknown',
      severity: p?.severity ?? (inc as { severity?: string }).severity ?? 'Moderate',
      description: p?.description ?? (inc as { description?: string }).description ?? '',
    };
  });

  return (
    <div className="summary-panel fade-in">
      {/* Header */}
      <div className="summary-header">
        <div>
          <h2 className="summary-title">{data.zone_name}</h2>
          <span className="summary-subtitle">{data.city} • Area Intelligence</span>
        </div>
        <button
          className="report-export-btn"
          onClick={onExportReport}
          disabled={exportLoading}
          title="Export current view as a report"
        >
          {exportLoading ? '⏳ Saving…' : '📄 Export Report'}
        </button>
      </div>

      {/* Risk Score + Key Stats */}
      <div className="summary-hero">
        <RiskScoreRing score={data.risk_score} />
        <div className="summary-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-label">Total Incidents</span>
            <span className="hero-stat-val" style={{ color: '#f56565' }}>{data.total_incidents}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Population</span>
            <span className="hero-stat-val">
              {data.population_info?.total_population?.toLocaleString() ?? 'N/A'}
            </span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Density /km²</span>
            <span className="hero-stat-val">{data.population_info?.density ?? 'N/A'}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Growth Rate</span>
            <span className="hero-stat-val" style={{ color: '#48bb78' }}>
              {data.population_info?.growth_rate != null
                ? `${data.population_info.growth_rate}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Crime Trend Chart */}
      <div className="summary-card">
        <h3 className="summary-card-title">📈 Crime Trend (Last 6 Months)</h3>
        <CrimeTrendChart data={trendData} loading={trendLoading} />
      </div>

      {/* Crime Breakdown */}
      {data.crime_breakdown.length > 0 && (
        <div className="summary-card">
          <h3 className="summary-card-title">🔍 Crime Breakdown</h3>
          <div className="breakdown-list">
            {data.crime_breakdown.map(item => {
              const pct =
                data.total_incidents > 0
                  ? Math.round((item.count / data.total_incidents) * 100)
                  : 0;
              return (
                <div key={item.category} className="breakdown-item">
                  <span className="breakdown-cat">{item.category}</span>
                  <div className="breakdown-bar-wrap">
                    <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Infrastructure Nearby */}
      <div className="summary-card">
        <h3 className="summary-card-title">🏗️ Infrastructure Nearby</h3>
        {infraData.length === 0 ? (
          <p className="summary-empty">No infrastructure recorded for this area.</p>
        ) : (
          <div className="infra-grid">
            {infraData.map(item => (
              <div key={item.infra_type} className="infra-badge">
                <span className="infra-icon">{INFRA_ICONS[item.infra_type] || '🏗️'}</span>
                <span className="infra-label">{item.infra_type}</span>
                <span className="infra-count">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Incidents */}
      {recentIncidents.length > 0 && (
        <div className="summary-card">
          <h3 className="summary-card-title">⚡ Recent Incidents</h3>
          <div className="incidents-list">
            {recentIncidents.map(inc => (
              <div key={inc.id} className="incident-row">
                <div className="incident-info">
                  <span className="incident-category">{inc.category}</span>
                  {inc.description && (
                    <span className="incident-desc">
                      {inc.description.slice(0, 60)}
                      {inc.description.length > 60 ? '…' : ''}
                    </span>
                  )}
                </div>
                <span
                  className="incident-badge"
                  style={{
                    background: `${SEVERITY_COLOR[inc.severity] ?? '#718096'}22`,
                    color: SEVERITY_COLOR[inc.severity] ?? '#718096',
                    border: `1px solid ${SEVERITY_COLOR[inc.severity] ?? '#718096'}44`,
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
        <button className="switch-reports-btn" onClick={onSwitchToReports}>
          View All Reports →
        </button>
      )}
    </div>
  );
}
