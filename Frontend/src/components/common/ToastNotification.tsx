import React from 'react';

interface Props {
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
}

export default function ToastNotification({ message, actionText = 'Report Generator →', onAction, onClose }: Props) {
  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#f8fafc',
        padding: '12px 20px',
        borderRadius: 10,
        border: '1px solid rgba(168, 28, 28, 0.4)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(168, 28, 28, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        maxWidth: 420,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc' }}>{message}</span>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          style={{
            background: '#a81c1c',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(168, 28, 28, 0.35)',
          }}
        >
          {actionText}
        </button>
      )}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '0.85rem',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Close
      </button>
    </div>
  );
}
