import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import AreaIntelligenceView from '../area-intelligence/AreaIntelligenceView';

interface Props {
  currentUser: User;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',             icon: '⌂' },
  { id: 'analysis', label: 'Area Intelligence', icon: '◎' },
  { id: 'map',      label: 'GIS Map',           icon: '⬡' },
  { id: 'planning', label: 'Dev Planning',      icon: '⬢' },
  { id: 'reports',  label: 'Reports',           icon: '▤' },
];

export default function Dashboard({ currentUser, onLogout }: Props) {
  const [activePage, setActivePage] = useState('home');
  const displayName = currentUser.name || currentUser.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <div>
            <h2 className="sidebar-title">URBAN EYE</h2>
            <p className="sidebar-sub">Intelligence Platform</p>
          </div>
        </div>

        <div className="sidebar-city-badge">
          <span className="city-badge-dot" />
          <span>{currentUser.city || 'Nairobi'} Node</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item${activePage === item.id ? ' nav-item-active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && <span className="nav-active-bar" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initial}</div>
            <div className="user-info">
              <strong>{displayName}</strong>
              <small>{currentUser.role || 'Analyst'}</small>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{marginRight:6}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {activePage === 'home'     && <HomePage currentUser={currentUser} onNavigate={setActivePage} />}
        {activePage === 'analysis' && <AreaIntelligenceView currentCity={currentUser.city || 'Nairobi'} onSwitchToReports={() => setActivePage('reports')} />}
        {activePage === 'reports'  && <ReportsPage currentUser={currentUser} />}
        {(activePage === 'map' || activePage === 'planning') && (
          <div className="coming-soon-page fade-in">
            <div className="coming-soon-icon">🚧</div>
            <h2>{NAV_ITEMS.find(n => n.id === activePage)?.label}</h2>
            <p>This module is under development and will be available soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ currentUser, onNavigate }: { currentUser: User; onNavigate: (p: string) => void }) {
  const city = currentUser.city || 'Nairobi';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (currentUser.name || currentUser.email || 'Analyst').split(' ')[0];

  const [stats, setStats] = useState({ incidents: 0, zones: 0, infra: 0, reports: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { 'Content-Type': 'application/json', Authorization: `Token ${token}` };
    Promise.allSettled([
      fetch(`/api/incidents/?city=${city}`, { headers: h }).then(r => r.json()),
      fetch(`/api/zones/?city=${city}`, { headers: h }).then(r => r.json()),
      fetch(`/api/infrastructure/?city=${city}`, { headers: h }).then(r => r.json()),
      fetch(`/api/reports/`, { headers: h }).then(r => r.json()),
    ]).then(([inc, zon, inf, rep]) => {
      const c = (d: unknown): number => {
        const data = d as Record<string, unknown>;
        if (typeof data.count === 'number') return data.count;
        if (Array.isArray(data.results)) return (data.results as unknown[]).length;
        if (Array.isArray(data.features)) return (data.features as unknown[]).length;
        if (Array.isArray(d)) return (d as unknown[]).length;
        return 0;
      };
      setStats({
        incidents: inc.status === 'fulfilled' ? c(inc.value) : 0,
        zones:     zon.status === 'fulfilled' ? c(zon.value) : 0,
        infra:     inf.status === 'fulfilled' ? c(inf.value) : 0,
        reports:   rep.status === 'fulfilled' ? c(rep.value) : 0,
      });
      setLoaded(true);
    });
  }, [city]);

  return (
    <div className="home-page fade-in">

      {/* ── TOP STRIP: greeting + live status ── */}
      <div className="home-topstrip">
        <div className="home-topstrip-left">
          <span className="home-greeting-pill">{greeting}, {firstName}</span>
          <span className="home-city-chip">
            <span className="city-badge-dot" style={{width:5,height:5}} />
            {city} · {new Date().toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long' })}
          </span>
        </div>
        <div className="home-topstrip-right">
          <span className="home-live-chip">● LIVE</span>
          <span className="home-role-chip">{currentUser.role || 'Urban Analyst'}</span>
        </div>
      </div>

      {/* ── HERO SPLIT: left dark + right white card ── */}
      <div className="home-hero-split">
        {/* LEFT: headline */}
        <div className="home-hero-left">
          <div className="home-hero-eyebrow">Urban Intelligence · Kenya</div>
          <h1 className="home-hero-title">
            See the city<br />
            <em>differently.</em>
          </h1>
          <p className="home-hero-body">
            Urban Eye fuses crime incident data, population statistics, and
            geospatial infrastructure records into a single investigative workspace —
            so planners and analysts can make decisions grounded in real evidence.
          </p>
          <div className="home-hero-actions">
            <button className="home-btn-primary" onClick={() => onNavigate('analysis')}>
              Open Area Intelligence
            </button>
            <button className="home-btn-ghost" onClick={() => onNavigate('reports')}>
              View Reports
            </button>
          </div>
          <div className="home-data-sources">
            <span className="ds-label">Powered by</span>
            <span className="ds-tag knbs">KNBS 2019</span>
            <span className="ds-tag nps">NPS Annual Crime</span>
            <span className="ds-tag osm">OpenStreetMap</span>
          </div>
        </div>

        {/* RIGHT: white stats card */}
        <div className="home-hero-right">
          <div className="home-stats-card">
            <div className="home-stats-card-header">
              <span className="home-stats-card-title">City Snapshot</span>
              <span className="home-stats-card-city">{city}</span>
            </div>
            <div className="home-stats-grid">
              <div className="hsg-item hsg-red">
                <div className="hsg-num">{loaded ? stats.incidents.toLocaleString() : '—'}</div>
                <div className="hsg-label">Incidents on Record</div>
                <div className="hsg-icon">⚡</div>
              </div>
              <div className="hsg-item hsg-dark">
                <div className="hsg-num">{loaded ? stats.zones : '—'}</div>
                <div className="hsg-label">Mapped Zones</div>
                <div className="hsg-icon">⬡</div>
              </div>
              <div className="hsg-item hsg-light">
                <div className="hsg-num">{loaded ? stats.infra : '—'}</div>
                <div className="hsg-label">Infrastructure Points</div>
                <div className="hsg-icon">🏗</div>
              </div>
              <div className="hsg-item hsg-outline">
                <div className="hsg-num">{loaded ? stats.reports : '—'}</div>
                <div className="hsg-label">Reports Generated</div>
                <div className="hsg-icon">▤</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODULE GRID ── */}
      <div className="home-modules">
        <div className="home-modules-header">
          <span className="home-modules-label">Platform Modules</span>
          <div className="home-modules-line" />
        </div>

        <div className="home-modules-grid">
          {/* Large card: Area Intelligence */}
          <button className="hm-card hm-card-large hm-card-featured" onClick={() => onNavigate('analysis')}>
            <div className="hm-card-badge">Core Feature</div>
            <div className="hm-card-icon hm-icon-red">◎</div>
            <h3>Area Intelligence</h3>
            <p>
              Select a zone or drop a pin. Instantly see the crime heatmap,
              6-month trend, risk score, population density and nearby infrastructure
              — all in one investigative view. Supports zone comparison.
            </p>
            <span className="hm-card-arrow">Open →</span>
          </button>

          {/* Stack: GIS + Planning */}
          <div className="hm-card-stack">
            <button className="hm-card hm-card-half" onClick={() => onNavigate('map')}>
              <div className="hm-card-icon hm-icon-blue">⬡</div>
              <h3>GIS Map</h3>
              <p>Full geospatial workspace with layered overlays.</p>
              <span className="hm-card-arrow hm-arrow-small">Soon →</span>
            </button>
            <button className="hm-card hm-card-half" onClick={() => onNavigate('planning')}>
              <div className="hm-card-icon hm-icon-green">⬢</div>
              <h3>Dev Planning</h3>
              <p>Evaluate candidate sites against city baselines.</p>
              <span className="hm-card-arrow hm-arrow-small">Soon →</span>
            </button>
          </div>

          {/* Reports */}
          <button className="hm-card hm-card-wide" onClick={() => onNavigate('reports')}>
            <div className="hm-card-icon hm-icon-purple">▤</div>
            <h3>Report Generator</h3>
            <p>
              Export any area analysis into a structured intelligence brief.
              Archive, share, and track site decisions over time.
            </p>
            <span className="hm-card-arrow">View Reports →</span>
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
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
    <div style={{ padding: 60, textAlign: 'center', color: '#a0aec0' }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />Loading reports…
    </div>
  );

  return (
    <div className="reports-page fade-in">
      <div className="reports-header">
        <h2>Generated Reports</h2>
        <span className="reports-count">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
      </div>
      {reports.length === 0 ? (
        <div className="reports-empty">
          <div style={{ fontSize: '3rem' }}>▤</div>
          <h3>No reports yet</h3>
          <p>Export a report from Area Intelligence to see it here.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map(r => (
            <div key={r.id} className="report-card">
              <div className="report-card-header">
                <span className={`report-focus-badge focus-${r.focus}`}>{r.focus}</span>
                <span className="report-date">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="report-card-title">{r.title}</h3>
              <div className="report-city-tag">{r.city}</div>
              <pre className="report-summary">{r.summary.slice(0, 240)}{r.summary.length > 240 ? '…' : ''}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
