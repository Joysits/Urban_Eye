import React, { useState } from 'react';
import type { User } from '../../types';
import AreaIntelligenceView from '../area-intelligence/AreaIntelligenceView';
import DevPlanningView from '../planning/DevPlanningView';
import ReportGeneratorView from '../reports/ReportGeneratorView';

interface Props {
  currentUser: User;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',                 icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'analysis', label: 'Area Analysis',        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'planning', label: 'Development Planning', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V12a1 1 0 011-1h2a1 1 0 011 1v9' },
  { id: 'reports',  label: 'Report Generator',    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2 2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Dashboard({ currentUser, onLogout }: Props) {
  const [activePage, setActivePage] = useState('home');
  const [selectedCity, setSelectedCity] = useState(currentUser.city || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const displayName = currentUser.name || currentUser.email || 'User';
  const displayCity = selectedCity || 'your city';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f5f0f1', color: '#1c0507', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      
      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(15, 4, 6, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(124, 29, 36, 0.25)',
            borderRadius: 16,
            padding: '28px 32px',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            textAlign: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124, 29, 36, 0.1)', border: '1px solid rgba(124, 29, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#7c1d24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#1c0507', fontFamily: 'Outfit, sans-serif' }}>
                Confirm Logout
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#592328', lineHeight: 1.45 }}>
                Are you sure you want to log out?
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#ffffff',
                  border: '1px solid rgba(124, 29, 36, 0.3)',
                  color: '#7c1d24',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 29, 36, 0.3)',
                  outline: 'none',
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar Navigation (Dark Garnet Contrast Frame) */}
      <aside style={{ width: 280, flexShrink: 0, background: 'rgba(22, 6, 9, 0.96)', borderRight: '1px solid rgba(201, 107, 107, 0.25)', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24, height: '100vh', boxSizing: 'border-box' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(166, 58, 58, 0.2)', border: '1px solid rgba(201, 107, 107, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fee1e1', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>URBAN EYE</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#c96b6b' }}>Smart planning workspace</p>
          </div>
        </div>

        {/* User Details Pill */}
        <div style={{ background: 'rgba(254, 225, 225, 0.04)', border: '1px solid rgba(201, 107, 107, 0.2)', padding: '12px 14px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ color: '#fee1e1', fontSize: '0.9rem', fontWeight: 600 }}>{displayName}</strong>
          <small style={{ color: '#f87171', fontSize: '0.75rem' }}>{displayCity} / {currentUser.role || 'Urban Planner'}</small>
        </div>

        {/* Navigation Buttons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: isActive ? 'linear-gradient(135deg, rgba(124, 29, 36, 0.85), rgba(166, 58, 58, 0.65))' : 'transparent',
                  border: isActive ? '1px solid rgba(201, 107, 107, 0.55)' : '1px solid transparent',
                  color: isActive ? '#fff' : '#c96b6b',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  outline: 'none',
                  boxShadow: isActive ? '0 4px 16px rgba(124, 29, 36, 0.35)' : 'none',
                }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(201, 107, 107, 0.2)' }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(124, 29, 36, 0.3)',
              border: '1px solid rgba(201, 107, 107, 0.4)',
              color: '#fee1e1',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Workspace Area  */}
      <main style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden', padding: '32px 36px 60px 36px', boxSizing: 'border-box', background: '#f5f0f1' }}>
        {activePage === 'home' && (
          <HomePage
            currentUser={currentUser}
            selectedCity={selectedCity}
            onNavigate={setActivePage}
          />
        )}
        {activePage === 'analysis' && (
          <AreaIntelligenceView
            currentUser={currentUser}
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

// Home Page Component 
function HomePage({ currentUser, selectedCity, onNavigate }: { currentUser: User; selectedCity: string; onNavigate: (p: string) => void }) {
  const displayName = currentUser.name || currentUser.email || 'User';
  const displayCity = selectedCity || 'your city';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#7c1d24', letterSpacing: '-0.01em', fontFamily: 'Outfit, sans-serif' }}>
          WELCOME, {displayName.toUpperCase()}
        </h1>
        <div style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.25)', color: '#7c1d24', padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {displayCity} / {currentUser.role || 'Urban Planner'}
        </div>
      </div>

      {/* Hero Card */}
      <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbf6f6 100%)', border: '1px solid rgba(124, 29, 36, 0.18)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c1d24', letterSpacing: '1.5px' }}>URBAN INTELLIGENCE DASHBOARD</div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#7c1d24', fontFamily: 'Outfit, sans-serif' }}>Your City at a glance</h2>
        <p style={{ margin: 0, color: '#4a181c', fontSize: '0.95rem', maxWidth: 650, lineHeight: 1.5 }}>
          Monitor live risk signals, planning priorities, spatial forecasts, and executive reporting workflows for {displayCity}.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5eded', border: '1px solid rgba(124, 29, 36, 0.2)', padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', color: '#7c1d24', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c1d24', boxShadow: '0 0 8px rgba(124, 29, 36, 0.5)' }} />
            Live Spatial Sync ({displayCity})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5eded', border: '1px solid rgba(124, 29, 36, 0.2)', padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', color: '#7c1d24', fontWeight: 600 }}>
            Geo Analytics Active
          </span>
        </div>
      </div>

      {/* 3 Action Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        
        {/* Card 1: Area Intelligence */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.15)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124, 29, 36, 0.08)', border: '1px solid rgba(124, 29, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#7c1d24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c1d24', fontFamily: 'Outfit, sans-serif' }}>Area Intelligence</div>
          <p style={{ fontSize: '0.85rem', color: '#592328', lineHeight: 1.4, margin: 0, flex: 1 }}>Analyze neighborhood risk scores, crime trends, and live infrastructure.</p>
          <button
            onClick={() => onNavigate('analysis')}
            style={{
              background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              width: '100%',
              outline: 'none',
              boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
            }}
          >
            Explore Area Intelligence
          </button>
        </div>

        {/* Card 2: Development Planning */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.15)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124, 29, 36, 0.08)', border: '1px solid rgba(124, 29, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#7c1d24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V12a1 1 0 011-1h2a1 1 0 011 1v9" />
            </svg>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c1d24', fontFamily: 'Outfit, sans-serif' }}>Development Planning</div>
          <p style={{ fontSize: '0.85rem', color: '#592328', lineHeight: 1.4, margin: 0, flex: 1 }}>Simulate proposed project impacts, land prices, and phase roadmaps.</p>
          <button
            onClick={() => onNavigate('planning')}
            style={{
              background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              width: '100%',
              outline: 'none',
              boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
            }}
          >
            Launch Impact Simulator
          </button>
        </div>

        {/* Card 3: Report Generator */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(124, 29, 36, 0.15)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124, 29, 36, 0.08)', border: '1px solid rgba(124, 29, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#7c1d24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2 2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c1d24', fontFamily: 'Outfit, sans-serif' }}>Report Generator</div>
          <p style={{ fontSize: '0.85rem', color: '#592328', lineHeight: 1.4, margin: 0, flex: 1 }}>Generate 1-click PDF executive reports for Area Analysis or Planning.</p>
          <button
            onClick={() => onNavigate('reports')}
            style={{
              background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              width: '100%',
              outline: 'none',
              boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
            }}
          >
            Export PDF Reports
          </button>
        </div>

      </div>
    </div>
  );
}
