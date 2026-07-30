import React, { useState } from 'react';
import type { User } from '../../types';
import AreaIntelligenceView from '../area-intelligence/AreaIntelligenceView';
import DevPlanningView from '../planning/DevPlanningView';
import ReportGeneratorView from '../reports/ReportGeneratorView';

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
  const [selectedCity, setSelectedCity] = useState(currentUser.city || 'Nairobi');
  const displayName = currentUser.name || currentUser.email || 'User';

  return (
    <div className="dashboard-skyline-shell">
      {/* Sidebar */}
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

        {/* User Details Pill */}
        <div className="user-skyline-card">
          <strong className="user-skyline-name">{displayName}</strong>
          <small className="user-skyline-role">{selectedCity} / {currentUser.role || 'Urban Planner'}</small>
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
            selectedCity={selectedCity}
            onNavigate={setActivePage}
          />
        )}
        {activePage === 'analysis' && (
          <AreaIntelligenceView
            currentCity={selectedCity}
            onCityChange={setSelectedCity}
            onSwitchToReports={() => setActivePage('reports')}
          />
        )}
        {activePage === 'planning' && (
          <DevPlanningView
            currentUser={currentUser}
            currentCity={selectedCity}
            onCityChange={setSelectedCity}
          />
        )}
        {activePage === 'reports' && (
          <ReportGeneratorView currentUser={{ ...currentUser, city: selectedCity }} />
        )}
      </main>
    </div>
  );
}

// ─── Home Page Component (All green and yellow removed, uniform Red/Coral theme applied) ───
function HomePage({ currentUser, selectedCity, onNavigate }: { currentUser: User; selectedCity: string; onNavigate: (p: string) => void }) {
  const displayName = currentUser.name || currentUser.email || 'User';

  return (
    <div className="home-skyline-container fade-in">
      {/* Top Header Bar */}
      <div className="home-skyline-topbar">
        <h1 className="home-skyline-title">WELCOME, {displayName.toUpperCase()}</h1>
        <div className="home-skyline-user-badge">
          {selectedCity} / {currentUser.role || 'Urban Planner'}
        </div>
      </div>

      {/* Hero Card */}
      <div className="home-skyline-hero">
        <div className="hero-skyline-eyebrow">URBAN INTELLIGENCE DASHBOARD</div>
        <h2 className="hero-skyline-headline">Your City at a glance</h2>
        <p className="hero-skyline-body">
          Monitor live risk signals, planning priorities, spatial forecasts, and executive reporting workflows for {selectedCity}.
        </p>

        <div className="hero-skyline-pills">
          <span className="skyline-pill">
            <span className="live-pulse-dot" /> Live Spatial Sync ({selectedCity})
          </span>
          <span className="skyline-pill">
            Geo Analytics Active
          </span>
        </div>
      </div>

      {/* 3 Action Cards Grid (All green and yellow removed) */}
      <div className="home-skyline-grid">
        <div className="skyline-action-card">
          <div className="skyline-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="skyline-card-category">Area Intelligence</div>
          <p className="skyline-card-desc">Analyze neighborhood risk scores, crime trends, and live infrastructure.</p>
          <button className="skyline-card-btn" onClick={() => onNavigate('analysis')}>
            Explore Area Intelligence &rarr;
          </button>
        </div>

        <div className="skyline-action-card">
          <div className="skyline-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V12a1 1 0 011-1h2a1 1 0 011 1v9" />
            </svg>
          </div>
          <div className="skyline-card-category">Development Planning</div>
          <p className="skyline-card-desc">Simulate proposed project impacts, land prices, and phase roadmaps.</p>
          <button className="skyline-card-btn" onClick={() => onNavigate('planning')}>
            Launch Impact Simulator &rarr;
          </button>
        </div>

        <div className="skyline-action-card">
          <div className="skyline-icon-box">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="skyline-card-category">Report Generator</div>
          <p className="skyline-card-desc">Generate 1-click PDF executive reports for Area Analysis or Planning.</p>
          <button className="skyline-card-btn" onClick={() => onNavigate('reports')}>
            Export PDF Reports &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
