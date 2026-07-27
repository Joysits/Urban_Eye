import React, { useState } from 'react';
import { User, AlertMsg } from '../../types';

const UrbanEyeLogo = ({ compact = false }: { compact?: boolean }) => (
  <svg width={compact ? '24' : '40'} height={compact ? '24' : '40'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const UserIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const LockIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const EyeIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOffIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.018 10.018 0 013.98-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-3.182-3.182a3 3 0 01-4.243-4.243M3 3l18 18" /></svg>;
const EnvelopeIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const BriefcaseIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

const FacebookIcon = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>;
const TwitterIcon = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
const GoogleIcon = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.24 10.285V13.4h6.887c-.58 3.325-3.133 5.76-6.887 5.76-4.14 0-7.5-3.36-7.5-7.5s3.36-7.5 7.5-7.5c1.86 0 3.55.68 4.86 1.8l2.38-2.38C17.61 2.01 15.06 1 12.24 1A10.74 10.74 0 0 0 1.5 11.74a10.74 10.74 0 0 0 10.74 10.74c6.14 0 10.24-4.32 10.24-10.42 0-.71-.07-1.21-.16-1.78H12.24z"/></svg>;
const LinkedinIcon = () => <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/></svg>;

interface Props {
  onAuthenticated: (user: User, token: string) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [alert, setAlert] = useState<AlertMsg | null>(null);
  const [loading, setLoading] = useState(false);

  // signin
  const [siUser, setSiUser] = useState('');
  const [siPass, setSiPass] = useState('');
  const [showSiPass, setShowSiPass] = useState(false);

  // signup
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suCity, setSuCity] = useState('Nairobi');
  const [suRole, setSuRole] = useState('Urban Planner');
  const [suPass, setSuPass] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [showSuPass, setShowSuPass] = useState(false);

  // forgot
  const [fEmail, setFEmail] = useState('');
  const [fPass, setFPass] = useState('');
  const [fConfirm, setFConfirm] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setAlert(null);
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: siUser, password: siPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const user: User = {
        name: data.user?.name || siUser,
        email: data.user?.email || siUser,
        city: data.user?.profile?.focus_city || 'Nairobi',
        role: data.user?.profile?.agency_role || 'Urban Planner',
      };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuthenticated(user, data.token);
    } catch (err: unknown) {
      setAlert({ message: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPass !== suConfirm) { setAlert({ message: 'Passwords do not match.', type: 'error' }); return; }
    setLoading(true); setAlert(null);
    try {
      const res = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: suName, email: suEmail, city: suCity, role: suRole, password: suPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setAlert({ message: 'Account created! Please sign in.', type: 'success' });
      setView('signin');
    } catch (err: unknown) {
      setAlert({ message: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fPass !== fConfirm) { setAlert({ message: 'Passwords do not match.', type: 'error' }); return; }
    setLoading(true); setAlert(null);
    try {
      const res = await fetch('/api/auth/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fEmail, password: fPass, confirm_password: fConfirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setAlert({ message: 'Password updated! Please sign in.', type: 'success' });
      setView('signin');
    } catch (err: unknown) {
      setAlert({ message: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const AlertBanner = () => alert ? (
    <div className={`auth-alert auth-alert-${alert.type}`}>
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        {alert.type === 'error'
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
      </svg>
      <span>{alert.message}</span>
    </div>
  ) : null;

  return (
    <div className="auth-screen">
      <div className="auth-glow-orb-1" />
      <div className="auth-glow-orb-2" />
      <div className="auth-card">
        <div className="auth-form-side">
          <div className="brand-header" style={{ marginBottom: 28 }}>
            <div className="brand-logo-container brand-logo-container-light"><UrbanEyeLogo compact /></div>
            <span className="brand-name brand-name-dark">Urban Eye</span>
          </div>

          <AlertBanner />

          {view === 'signin' && (
            <div className="fade-in">
              <h2>Welcome Back</h2>
              <p className="auth-subtitle">Enter your credentials to access the urban planning & crime intelligence node.</p>
              <form className="auth-form" onSubmit={handleSignIn}>
                <div className="input-group">
                  <label htmlFor="si-user">Username or Email</label>
                  <div className="input-wrapper"><UserIcon /><input id="si-user" type="text" placeholder="admin or email address" value={siUser} onChange={e => setSiUser(e.target.value)} required /></div>
                </div>
                <div className="input-group">
                  <label htmlFor="si-pass">Password</label>
                  <div className="input-wrapper">
                    <LockIcon />
                    <input id="si-pass" type={showSiPass ? 'text' : 'password'} placeholder="Enter password" value={siPass} onChange={e => setSiPass(e.target.value)} required />
                    <button type="button" className="input-icon-right" onClick={() => setShowSiPass(!showSiPass)}>{showSiPass ? <EyeOffIcon /> : <EyeIcon />}</button>
                  </div>
                </div>
                <div className="auth-meta">
                  <label className="remember-me"><input type="checkbox" defaultChecked /> Remember me</label>
                  <button type="button" className="forgot-link" onClick={() => setView('forgot')}>Forgot password?</button>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
              </form>
              <div className="auth-switch">Don't have an account? <button onClick={() => setView('signup')}>Sign Up Now</button></div>
              <div className="social-login">
                <span className="social-title">Or continue with</span>
                <div className="social-icons">
                  <button type="button" className="social-btn" onClick={() => setAlert({ message: 'Social login simulated.', type: 'success' })} aria-label="Facebook"><FacebookIcon /></button>
                  <button type="button" className="social-btn" onClick={() => setAlert({ message: 'Social login simulated.', type: 'success' })} aria-label="Twitter"><TwitterIcon /></button>
                  <button type="button" className="social-btn" onClick={() => setAlert({ message: 'Social login simulated.', type: 'success' })} aria-label="Google"><GoogleIcon /></button>
                  <button type="button" className="social-btn" onClick={() => setAlert({ message: 'Social login simulated.', type: 'success' })} aria-label="LinkedIn"><LinkedinIcon /></button>
                </div>
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="fade-in">
              <h2>Create Account</h2>
              <p className="auth-subtitle">Configure your dashboard role and focus region parameters.</p>
              <form className="auth-form" onSubmit={handleSignUp}>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="su-name">Full Name</label>
                    <div className="input-wrapper"><UserIcon /><input id="su-name" type="text" placeholder="e.g. Joy Nduta" value={suName} onChange={e => setSuName(e.target.value)} required /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="su-email">Email Address</label>
                    <div className="input-wrapper"><EnvelopeIcon /><input id="su-email" type="email" placeholder="name@agency.go.ke" value={suEmail} onChange={e => setSuEmail(e.target.value)} required /></div>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="su-city">Focus City</label>
                    <div className="input-wrapper"><BriefcaseIcon />
                      <select id="su-city" value={suCity} onChange={e => setSuCity(e.target.value)}>
                        <option>Nairobi</option><option>Mombasa</option><option>Eldoret</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="su-role">Agency Role</label>
                    <div className="input-wrapper"><BriefcaseIcon />
                      <select id="su-role" value={suRole} onChange={e => setSuRole(e.target.value)}>
                        <option>Urban Planner</option><option>Law Enforcement</option><option>Researcher</option><option>Administrator</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="su-pass">Password</label>
                    <div className="input-wrapper">
                      <LockIcon />
                      <input id="su-pass" type={showSuPass ? 'text' : 'password'} placeholder="6+ characters" value={suPass} onChange={e => setSuPass(e.target.value)} required />
                      <button type="button" className="input-icon-right" onClick={() => setShowSuPass(!showSuPass)}>{showSuPass ? <EyeOffIcon /> : <EyeIcon />}</button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="su-confirm">Confirm Password</label>
                    <div className="input-wrapper"><LockIcon /><input id="su-confirm" type={showSuPass ? 'text' : 'password'} placeholder="Re-enter password" value={suConfirm} onChange={e => setSuConfirm(e.target.value)} required /></div>
                  </div>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Creating account...' : 'Complete Registration'}</button>
              </form>
              <div className="auth-switch">Already have an account? <button type="button" onClick={() => setView('signin')}>Sign In Now</button></div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="fade-in">
              <h2>Reset Password</h2>
              <p className="auth-subtitle">Confirm your account email and choose a new password.</p>
              <form className="auth-form" onSubmit={handleForgot}>
                <div className="input-group">
                  <label htmlFor="f-email">Email Address</label>
                  <div className="input-wrapper"><EnvelopeIcon /><input id="f-email" type="email" placeholder="your email address" value={fEmail} onChange={e => setFEmail(e.target.value)} required /></div>
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="f-pass">New Password</label>
                    <div className="input-wrapper"><LockIcon /><input id="f-pass" type="password" placeholder="New password" value={fPass} onChange={e => setFPass(e.target.value)} required /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="f-confirm">Confirm New Password</label>
                    <div className="input-wrapper"><LockIcon /><input id="f-confirm" type="password" placeholder="Confirm new password" value={fConfirm} onChange={e => setFConfirm(e.target.value)} required /></div>
                  </div>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
              </form>
              <div className="auth-switch">Remembered your password? <button type="button" onClick={() => setView('signin')}>Back to Sign In</button></div>
            </div>
          )}
        </div>

        <div className="auth-brand-side">
          <div className="brand-header">
            <div className="brand-logo-container"><UrbanEyeLogo /></div>
            <span className="brand-name">Urban Eye</span>
          </div>
          <div className="brand-content">
            <div className="brand-content-logo"><UrbanEyeLogo /></div>
            <h3>Smart City Intelligence</h3>
            <p className="brand-desc">Integrated predictive GIS analytics, population growth insights, AI crime forecasting, and incident maps supporting Kenya's key administrative regions.</p>
            <div className="city-pills">
              <span className="city-pill">Nairobi Central Analytics</span>
              <span className="city-pill">Mombasa Port Corridor</span>
              <span className="city-pill">Eldoret Expansion</span>
            </div>
          </div>
          <div className="brand-footer">
            <div>Official Data Acquisition Pipeline</div>
            <div style={{ opacity: 0.65, marginTop: 4 }}>KNBS Census &amp; National Police Service Integrated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
