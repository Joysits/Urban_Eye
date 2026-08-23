import React from 'react';
import type { CrimeTrendData } from '../../types';
import { calculateCityRiskSeverity, getKnbsCrimeDataForCity } from '../../utils/ncrcCrimeData';

interface Props {
  data: CrimeTrendData | null;
  loading: boolean;
  city?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Stealing & Theft': '#f87171',
  'House Burglary': '#e65c5c',
  'Illegal Drug Possession': '#c96b6b',
  'Illicit Alcohol Possession': '#f59e0b',
  'Domestic & Gender Violence': '#ec4899',
  'Armed / Violent Robbery': '#dc2626',
  'Physical Assault': '#ef4444',
  'Public Drunkenness': '#d97706',
};

export default function CrimeTrendChart({ data, loading, city = 'Nairobi' }: Props) {
  const selectedCity = city || data?.city || 'Nairobi';
  const knbsResult = getKnbsCrimeDataForCity(selectedCity);
  const ncrcResult = calculateCityRiskSeverity(selectedCity, 6);

  if (loading) {
    return (
      <div className="chart-skeleton" style={{ height: 340, display: 'flex', alignItems: 'flex-end', gap: 12, padding: 20, background: '#ffffff', borderRadius: 12, border: '1px solid rgba(124, 29, 36, 0.15)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="chart-bar-skeleton" style={{ flex: 1, height: `${30 + Math.random() * 60}%`, background: 'rgba(124, 29, 36, 0.12)', borderRadius: '6px 6px 0 0' }} />
        ))}
      </div>
    );
  }

  // Calculate scaling for KNBS 2021-2025 values
  const knbsYears = [2021, 2022, 2023, 2024, 2025];
  const maxKnbsValue = Math.max(...Object.values(knbsResult.data));
  const yAxisTicksKnbs = [
    Math.ceil(maxKnbsValue),
    Math.ceil(maxKnbsValue * 0.75),
    Math.ceil(maxKnbsValue * 0.5),
    Math.ceil(maxKnbsValue * 0.25),
    0
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* GRAPH 1: KNBS 2021-2025 Multi-Year Police Command Station Trend */}
      <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid rgba(124, 29, 36, 0.15)', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#7c1d24' }}>
              Graph 1: {knbsResult.commandStation} Multi-Year Trend (2021 – 2025)
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#7a4d52', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Data Source: Kenya National Bureau of Statistics (KNBS Economic Survey 2026 Table 17.2)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f4f4', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.15)' }}>
            <span style={{ fontSize: '0.72rem', color: '#7c1d24', textTransform: 'uppercase', fontWeight: 700 }}>5-Yr Change:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: knbsResult.pctChange2021To2025 >= 0 ? '#dc2626' : '#16a34a' }}>
              {knbsResult.pctChange2021To2025 >= 0 ? '+' : ''}{knbsResult.pctChange2021To2025}%
            </span>
          </div>
        </div>

        {/* Summary Stat Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: '#f8f4f4', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.12)' }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#7c1d24', textTransform: 'uppercase', fontWeight: 700 }}>2025 Reported Crimes</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c1d24' }}>{knbsResult.latestYear.toLocaleString()}</span>
          </div>
          <div style={{ background: '#f8f4f4', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.12)' }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#7c1d24', textTransform: 'uppercase', fontWeight: 700 }}>5-Yr Annual Average</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c1d24' }}>{knbsResult.fiveYearAvg.toLocaleString()}</span>
          </div>
          <div style={{ background: '#f8f4f4', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(124, 29, 36, 0.12)' }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#7c1d24', textTransform: 'uppercase', fontWeight: 700 }}>5-Yr Cumulative Total</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c1d24' }}>{knbsResult.fiveYearTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Bar Graph */}
        <div style={{ position: 'relative', height: 190, display: 'flex', alignItems: 'flex-end', paddingTop: 10 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 25, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {yAxisTicksKnbs.map((tick, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.66rem', color: '#7a4d52', width: 38, textAlign: 'right', paddingRight: 8, fontFamily: 'monospace', fontWeight: 700 }}>
                  {tick.toLocaleString()}
                </span>
                <div style={{ flex: 1, borderBottom: tick === 0 ? '1px solid rgba(124, 29, 36, 0.3)' : '1px dashed rgba(124, 29, 36, 0.1)' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', width: '100%', height: 'calc(100% - 25px)', paddingLeft: 46, alignItems: 'flex-end', gap: 18 }}>
            {knbsYears.map((yr) => {
              const val = knbsResult.data[yr];
              const heightPct = Math.min(100, Math.max(10, (val / maxKnbsValue) * 100));
              const isPeak = val === maxKnbsValue;

              return (
                <div key={yr} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isPeak ? '#dc2626' : '#7c1d24', marginBottom: 4, fontFamily: 'monospace' }}>
                    {val.toLocaleString()}
                  </span>
                  <div
                    style={{
                      width: '70%',
                      maxWidth: 44,
                      height: `${heightPct}%`,
                      background: isPeak
                        ? 'linear-gradient(180deg, #dc2626 0%, #7c1d24 100%)'
                        : 'linear-gradient(180deg, #7c1d24 0%, #a63a3a 100%)',
                      borderRadius: '6px 6px 0 0',
                      boxShadow: isPeak ? '0 4px 14px rgba(220, 38, 38, 0.35)' : '0 2px 8px rgba(124, 29, 36, 0.15)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', paddingLeft: 46, gap: 18, marginTop: 4 }}>
          {knbsYears.map((yr) => (
            <div key={yr} style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: '#7c1d24', fontWeight: 800 }}>
              {yr}{yr === 2025 ? '*' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* GRAPH 2: Crime Category Prevalence Distribution */}
      <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid rgba(124, 29, 36, 0.15)', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#7c1d24' }}>
              Graph 2: Offense Category Prevalence ({ncrcResult.cityName})
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#7a4d52', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Data Source: National Crime Research Centre (NCRC Kenya Outlook)
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', background: '#f8f4f4', border: '1px solid rgba(124, 29, 36, 0.15)', color: '#7c1d24', padding: '4px 10px', borderRadius: 6, fontWeight: 800 }}>
            Baseline: {ncrcResult.score}%
          </span>
        </div>

        <div style={{ position: 'relative', height: 180, display: 'flex', alignItems: 'flex-end', paddingTop: 10 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 25, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {[100, 75, 50, 25, 0].map((tick) => (
              <div key={tick} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.66rem', color: '#7a4d52', width: 28, textAlign: 'right', paddingRight: 8, fontFamily: 'monospace' }}>
                  {tick}%
                </span>
                <div style={{ flex: 1, borderBottom: tick === 0 ? '1px solid rgba(124, 29, 36, 0.3)' : '1px dashed rgba(124, 29, 36, 0.1)' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', width: '100%', height: 'calc(100% - 25px)', paddingLeft: 36, alignItems: 'flex-end', gap: 12 }}>
            {ncrcResult.topIncidents.map((item) => {
              const heightPct = Math.min(100, Math.max(0, item.percentage));
              const barColor = CATEGORY_COLORS[item.category] || '#7c1d24';
              return (
                <div key={item.category} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c1d24', marginBottom: 4, fontFamily: 'monospace' }}>
                    {item.percentage.toFixed(1)}%
                  </span>
                  <div
                    style={{
                      width: '75%',
                      maxWidth: 38,
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${barColor} 0%, #7c1d24 100%)`,
                      borderRadius: '4px 4px 0 0',
                    }}
                    title={`${item.category}: ${item.percentage}%`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', paddingLeft: 36, gap: 12, marginTop: 6 }}>
          {ncrcResult.topIncidents.map((item) => (
            <div key={item.category} style={{ flex: 1, textAlign: 'center', fontSize: '0.68rem', color: '#7c1d24', lineHeight: 1.2, fontWeight: 700 }}>
              {item.category}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
