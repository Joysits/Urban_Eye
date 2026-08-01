import React from 'react';

interface Props {
  compact?: boolean;
  size?: number;
  color?: string;
  className?: string;
}

export default function UrbanEyeLogo({ compact = false, size, color = '#e65c5c', className = '' }: Props) {
  const iconSize = size ?? (compact ? 24 : 38);

  return (
    <div className={`urbaneye-logo ${compact ? 'urbaneye-logo-compact' : ''} ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.25" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </div>
  );
}
