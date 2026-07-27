import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import AreaIntelligenceView from '../area-intelligence/AreaIntelligenceView';
import DevPlanningView from '../planning/DevPlanningView';

interface Props {
  currentUser: User;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',                 icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'analysis', label: 'Area Analysis',        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'planning', label: 'Development Planning', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V12a1 1 0 011-1h2a1 1 0 011 1v9' },
  { id: 'reports',  label: 'Report Generator',    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Dashboard({ currentUser, onLogout }: Props) {
  const [activePage, setActivePage] = useState('home');
  const displayName = currentUser.name || currentUser.email || 'User';

  return (
    <div className="dashboard-skyline-shell">
      {/* Sidebar with dark glass floating over Nairobi skyline */}
      <aside className="sidebar-skyline-glass">
        {/* Brand Header */}
        <div className="brand-skyline">
          <div className="brand-skyline-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e65c5c" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <div>
            <h2 className="brand-skyline-title">URBAN EYE</h2>
            <p className="brand-skyline-sub">Smart planning workspace</p>
          </div>
        </div>

        {/* User Card Pill */}
        <div className="user-skyline-card">
          <span className="user-skyline-label">Signed in as</span>
          <strong className="user-skyline-name">{displayName}</strong>
          <small className="user-skyline-role">{currentUser.city || 'Nairobi'} / {currentUser.role || 'Urban Planner'}</small>
        </div>

        {/* Navigation Items */}
        <nav className="nav-skyline">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-skyline-btn${activePage === item.id ? ' nav-skyline-active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-logout-skyline">
          <button className="logout-skyline-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-skyline-area">
        {activePage === 'home' && (
          <HomePage
            currentUser={currentUser}
            onNavigate={setActivePage}
          />
        )}
        {activePage === 'analysis' && (
          <AreaIntelligenceView
            currentCity={currentUser.city || 'Nairobi'}
            onSwitchToReports={() => setActivePage('reports')}
          />
        )}
        {activePage === 'planning' && (
          <DevPlanningView currentUser={currentUser} />
        )}
        {activePage === 'reports' && (
          <ReportsPage currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}

// ─── Home Page Component ───
function HomePage({ currentUser, onNavigate }: { currentUser: User; onNavigate: (p: string) => void }) {
  return (
    <div className="home-skyline-container fade-in">

      {/* Top Header Bar */}
      <div className="home-skyline-topbar">
        <h1 className="home-skyline-title">HOME</h1>
        <div className="home-skyline-user-badge">
          {currentUser.city || 'Nairobi'} / {currentUser.role || 'Urban Planner'}
        </div>
      </div>

      {/* Hero Card with Glass overlay */}
      <div className="home-skyline-hero">
        <div className="hero-skyline-eyebrow">HOME DASHBOARD</div>
        <h2 className="hero-skyline-headline">City Intelligence at a Glance.</h2>
        <p className="hero-skyline-body">
          Monitor live risk signals, planning priorities, AI forecasts, and reporting workflows from one workspace.
        </p>

        <div className="hero-skyline-pills">
          <span className="skyline-pill">
            <span className="live-pulse-dot" /> Live profile sync
          </span>
          <span className="skyline-pill">
            Geo analytics ready
          </span>
          <span className="skyline-pill">
            AI predictions active
          </span>
        </div>
      </div>

      {/* 3 Action Cards Grid */}
      <div className="home-skyline-grid">
        {/* Card 1: Area Analysis */}
        <div className="skyline-action-card">
          <div className="skyline-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#e65c5c" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="skyline-card-category">EXPLORE AREA ANALYSIS</div>
          <p className="skyline-card-desc">
            Select or draw a zone to view crime, population, and landuse layers.
          </p>
          <button className="skyline-card-btn" onClick={() => onNavigate('analysis')}>
            OPEN AREA ANALYSIS
          </button>
        </div>

        {/* Card 2: Development Planning */}
        <div className="skyline-action-card">
          <div className="skyline-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#e65c5c" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V12a1 1 0 011-1h2a1 1 0 011 1v9" />
            </svg>
          </div>
          <div className="skyline-card-category">DEVELOPMENT PLANNING</div>
          <p className="skyline-card-desc">
            Sketch proposals, run impact simulations, and save draft plans.
          </p>
          <button className="skyline-card-btn" onClick={() => onNavigate('planning')}>
            OPEN PLANNING TOOLS
          </button>
        </div>

        {/* Card 3: Report Generator */}
        <div className="skyline-action-card">
          <div className="skyline-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#e65c5c" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="skyline-card-category">REPORTS & EXPORT</div>
          <p className="skyline-card-desc">
            Export current map view and selected data to the Report Generator.
          </p>
          <button className="skyline-card-btn" onClick={() => onNavigate('reports')}>
            GO TO REPORT GENERATOR
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Reports Page Component ───
function ReportsPage({ currentUser }: { currentUser: User }) {
  const [reports, setReports] = useState<Array<{
    id: number; title: string; city: string; focus: string; created_at: string; summary: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/reports/', {
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
    })
      .then(r => r.json())
      .then(d => setReports(d.results ?? d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser.city]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#e65c5c' }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />Loading reports…
    </div>
  );

  return (
    <div className="reports-page-skyline fade-in">
      <div className="reports-header-skyline">
        <h2>Generated Reports</h2>
        <span className="reports-count-skyline">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
      </div>
      {reports.length === 0 ? (
        <div className="reports-empty-skyline">
          <div style={{ fontSize: '3rem' }}>▤</div>
          <h3>No reports saved yet</h3>
          <p>Export a report from Area Analysis to archive it here.</p>
        </div>
      ) : (
        <div className="reports-grid-skyline">
          {reports.map(r => (
            <div key={r.id} className="report-card-skyline">
              <div className="report-card-skyline-top">
                <span className={`report-focus-tag focus-${r.focus}`}>{r.focus}</span>
                <span className="report-date-str">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="report-card-skyline-title">{r.title}</h3>
              <div className="report-city-skyline-badge">{r.city}</div>
              <pre className="report-pre-skyline-summary">{r.summary.slice(0, 240)}{r.summary.length > 240 ? '…' : ''}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
