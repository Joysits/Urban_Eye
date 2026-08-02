import React, { useState } from 'react';
import type { CrimeTrendData } from '../../types';

interface Props {
  data: CrimeTrendData | null;
  loading: boolean;
}

const CATEGORY_STYLES: Record<string, { color: string; fill: string }> = {
  Theft:     { color: '#ef4444', fill: 'rgba(239, 68, 68, 0.12)' },
  Assault:   { color: '#f97316', fill: 'rgba(249, 115, 22, 0.10)' },
  Traffic:   { color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.10)' },
  Vandalism: { color: '#eab308', fill: 'rgba(234, 179, 8, 0.10)' },
  Robbery:   { color: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.10)' },
  Burglary:  { color: '#10b981', fill: 'rgba(16, 185, 129, 0.10)' },
};

function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function CrimeTrendChart({ data, loading }: Props) {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="spline-chart-loading">
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <p>Loading multi-curve trend analysis…</p>
      </div>
    );
  }

  
  const rawTrend = (data?.trend ?? []).filter(t => t.category !== 'Other');
  const monthTotals = data?.month_totals ?? [];

  if (monthTotals.length === 0) {
    return (
      <div className="spline-chart-empty">
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <p>No crime trend records available for this location.</p>
      </div>
    );
  }

  // Extract unique categories and months
  const categories = Array.from(new Set(rawTrend.map(t => t.category)));
  const months = monthTotals.map(m => m.month).filter(Boolean) as string[];

  // Chart SVG dimensions
  const svgWidth = 680;
  const svgHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Max value calculation across category counts
  let maxCount = 10;
  rawTrend.forEach(t => {
    if (t.count > maxCount) maxCount = t.count;
  });
  maxCount = Math.ceil(maxCount * 1.15); // Add top padding

  // Build coordinate mapping per category
  const categoryCurves = categories.map(cat => {
    const points = months.map((m, idx) => {
      const entry = rawTrend.find(t => t.month === m && t.category === cat);
      const count = entry ? entry.count : 0;

      const x = paddingLeft + (months.length > 1 ? (idx / (months.length - 1)) * chartW : chartW / 2);
      const y = paddingTop + chartH - (count / maxCount) * chartH;

      return { x, y, count, month: m, category: cat };
    });

    const pathD = getSplinePath(points);
    const style = CATEGORY_STYLES[cat] || { color: '#a855f7', fill: 'rgba(168, 85, 247, 0.1)' };

    return { cat, points, pathD, style };
  });

  // Month X positions for vertical highlight band
  const monthXPositions = months.map((_, idx) =>
    paddingLeft + (months.length > 1 ? (idx / (months.length - 1)) * chartW : chartW / 2)
  );

  const activeIdx = hoveredMonthIdx !== null ? hoveredMonthIdx : months.length - 1;
  const activeMonthStr = months[activeIdx]
    ? new Date(months[activeIdx] + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })
    : '';

  return (
    <div className="spline-chart-container fade-in">
      {/* Header matching Screenshot 1 */}
      <div className="spline-chart-header">
        <div>
          <h4 className="spline-chart-title">Incident Trend Over Time</h4>
          <span className="spline-chart-subtitle">6 Months Comparative Category Curves</span>
        </div>
        <div className="spline-legend">
          {categories.map(cat => {
            const style = CATEGORY_STYLES[cat] || { color: '#a855f7' };
            return (
              <span key={cat} className="spline-legend-item">
                <span className="spline-legend-dot" style={{ background: style.color }} />
                {cat}
              </span>
            );
          })}
        </div>
      </div>

      {/* SVG Multi-Line Curved Chart */}
      <div className="spline-svg-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="spline-svg"
          onMouseLeave={() => setHoveredMonthIdx(null)}
        >
          {/* Y-Axis Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartH * (1 - ratio);
            const val = Math.round(maxCount * ratio);
            return (
              <g key={i} className="spline-grid-group">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#718096"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="Inter, sans-serif"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Active Hover Month Vertical Highlight Band (Matching Screenshot 1) */}
          {activeIdx !== null && monthXPositions[activeIdx] !== undefined && (
            <rect
              x={monthXPositions[activeIdx] - 25}
              y={paddingTop}
              width={50}
              height={chartH}
              fill="rgba(255, 255, 255, 0.05)"
              rx={6}
            />
          )}

          {/* Smooth Category Spline Curves */}
          {categoryCurves.map(curve => (
            <g key={curve.cat}>
              {/* Curve Line */}
              <path
                d={curve.pathD}
                fill="none"
                stroke={curve.style.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 2px 8px ${curve.style.color}66)` }}
              />

              {/* Data Points */}
              {curve.points.map((pt, pIdx) => {
                const isActive = pIdx === activeIdx;
                return (
                  <circle
                    key={pIdx}
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 5.5 : 3.5}
                    fill={isActive ? '#ffffff' : curve.style.color}
                    stroke={curve.style.color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className="spline-point"
                    onMouseEnter={() => setHoveredMonthIdx(pIdx)}
                  />
                );
              })}
            </g>
          ))}

          {/* X-Axis Date Labels */}
          {months.map((m, idx) => {
            const x = monthXPositions[idx];
            const dateLabel = m
              ? new Date(m + '-01').toLocaleString('default', { month: 'short' })
              : '';
            const isActive = idx === activeIdx;

            return (
              <g
                key={m}
                onClick={() => setHoveredMonthIdx(idx)}
                onMouseEnter={() => setHoveredMonthIdx(idx)}
                style={{ cursor: 'pointer' }}
              >
                <text
                  x={x}
                  y={svgHeight - 8}
                  fill={isActive ? '#f7fafc' : '#718096'}
                  fontSize="11"
                  fontWeight={isActive ? '700' : '500'}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Floating Tooltip (Matching Screenshot 1 Box) */}
        {activeIdx !== null && monthXPositions[activeIdx] !== undefined && (
          <div
            className="spline-tooltip-box fade-in"
            style={{
              left: `${(monthXPositions[activeIdx] / svgWidth) * 100}%`,
            }}
          >
            <div className="spline-tooltip-header">{activeMonthStr}</div>
            <div className="spline-tooltip-rows">
              {categoryCurves.map(curve => {
                const pt = curve.points[activeIdx];
                if (!pt || pt.count === 0) return null;
                return (
                  <div key={curve.cat} className="spline-tooltip-row">
                    <span className="tooltip-dot" style={{ background: curve.style.color }} />
                    <span className="tooltip-cat">{curve.cat}:</span>
                    <strong className="tooltip-val" style={{ color: curve.style.color }}>{pt.count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
