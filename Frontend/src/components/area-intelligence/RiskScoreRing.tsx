import React from 'react';

interface Props {
  score: number;
}

export default function RiskScoreRing({ score }: Props) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  const color =
    score > 70 ? '#f56565'
    : score > 40 ? '#ed8936'
    : '#48bb78';

  const label =
    score > 70 ? 'High Risk'
    : score > 40 ? 'Moderate'
    : 'Low Risk';

  return (
    <div className="risk-ring-wrapper">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{
            transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }}
        />
        <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700" fontFamily="Outfit, Inter, sans-serif">
          {score}
        </text>
        <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
          / 100
        </text>
      </svg>
      <div className="risk-ring-label" style={{ color }}>{label}</div>
    </div>
  );
}
