import React from 'react';
import type { CrimeTrendData } from '../../types';

interface Props {
  data: CrimeTrendData | null;
  loading: boolean;
}

/** Maps a count relative to the max to a red shade: low = pale pink, high = deep crimson */
function redShade(count: number, max: number): string {
  const t = max > 0 ? count / max : 0;
  // Lerp from pale #ffb3b3 → vivid #c93030 → deep #5a0a10
  if (t < 0.4) {
    // pale pink to medium red
    const f = t / 0.4;
    const r = Math.round(255 - f * (255 - 201));
    const g = Math.round(179 - f * (179 - 48));
    const b = Math.round(179 - f * (179 - 48));
    return `rgb(${r},${g},${b})`;
  } else {
    // medium red to deep crimson
    const f = (t - 0.4) / 0.6;
    const r = Math.round(201 - f * (201 - 90));
    const g = Math.round(48  - f * (48  - 10));
    const b = Math.round(48  - f * (48  - 16));
    return `rgb(${r},${g},${b})`;
  }
}

function glowShade(count: number, max: number): string {
  const t = max > 0 ? count / max : 0;
  const alpha = 0.15 + t * 0.55;
  return `rgba(201,48,48,${alpha.toFixed(2)})`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Theft:    '#ef4444',
  Assault:  '#dc2626',
  Vandalism:'#b91c1c',
  Traffic:  '#f87171',
  Other:    '#fca5a5',
};

export default function CrimeTrendChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="chart-skeleton">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="chart-bar-skeleton" style={{ height: `${30 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  const months = data?.month_totals ?? [];

  if (months.length === 0) {
    return (
      <div className="chart-empty">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(201,107,107,0.4)" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No incident data for this period</p>
      </div>
    );
  }

  const maxVal = Math.max(...months.map(m => m.total), 1);

  // Also build per-month per-category breakdown for stacked display
  const categorySet = Array.from(new Set(data?.trend.map(t => t.category) ?? []));

  return (
    <div className="crime-trend-chart">
      <div className="trend-bars">
        {months.map(m => {
          const pct = (m.total / maxVal) * 100;
          const fill = redShade(m.total, maxVal);
          const glow = glowShade(m.total, maxVal);
          const monthLabel = m.month
            ? new Date(m.month + '-01').toLocaleString('default', { month: 'short' })
            : '?';

          return (
            <div key={m.month} className="trend-bar-col">
              <span className="trend-bar-val">{m.total}</span>
              <div className="trend-bar-wrap">
                <div
                  className="trend-bar-fill"
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    background: `linear-gradient(180deg, ${fill} 0%, #3f0610 100%)`,
                    boxShadow: `0 0 12px ${glow}, 0 4px 20px ${glow}`,
                  }}
                  title={`${monthLabel}: ${m.total} total incidents`}
                />
              </div>
              <span className="trend-bar-label">{monthLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Category intensity legend */}
      {categorySet.length > 0 && (
        <div className="trend-legend">
          {categorySet.map(cat => {
            const total = data?.trend
              .filter(t => t.category === cat)
              .reduce((s, t) => s + t.count, 0) ?? 0;
            const maxCat = Math.max(
              ...(data?.trend.map(t => t.count) ?? [1]), 1
            );
            const shade = redShade(total / categorySet.length, maxCat);
            return (
              <span key={cat} className="legend-item">
                <span className="legend-dot" style={{ background: CATEGORY_COLORS[cat] ?? shade }} />
                {cat}
                <span className="legend-count">({total})</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Intensity scale hint */}
      <div className="trend-intensity-bar">
        <span className="intensity-label">Low</span>
        <div className="intensity-gradient" />
        <span className="intensity-label">High</span>
      </div>
    </div>
  );
}
