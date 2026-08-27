import React, { useState, useEffect } from 'react';
import { User, AlertMsg } from '../../types';
import { getApiUrl } from '../../api';

const UrbanEyeLogo = ({ compact = false }: { compact?: boolean }) => (
  <svg width={compact ? '26' : '42'} height={compact ? '26' : '42'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
const KeyIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;

interface Props {
  onAuthenticated: (user: User, token: string) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [alert, setAlert] = useState<AlertMsg | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // signin
  const [siUser, setSiUser] = useState('');
  const [siPass, setSiPass] = useState('');
  const [showSiPass, setShowSiPass] = useState(false);

  // signup
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suRole, setSuRole] = useState('Urban Planner');
  const [suPass, setSuPass] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [showSuPass, setShowSuPass] = useState(false);

  // forgot & reset
  const [fEmail, setFEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isValidEmail = (email: string): boolean => {
    return /\S+@\S+/.test(email.trim());
  };

  const isStrictPassword = (pass: string): boolean => {
    return pass.length >= 8;
  };

  const showShortToast = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Clear legacy mock localStorage cache on mount
  useEffect(() => {
    localStorage.removeItem('registered_user_db_map');
    localStorage.removeItem('registered_users_map');
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const cleanEmail = siUser.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      showShortToast('Please enter a valid email address.', 'error');
      return;
    }

    if (siPass.length < 8) {
      showShortToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/login/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanEmail, password: siPass }),
      });

      let data: any = null;
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data?.token) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const apiUser = data.user;
        const apiName = apiUser?.name || ((apiUser?.first_name || apiUser?.last_name) ? `${apiUser?.first_name || ''} ${apiUser?.last_name || ''}`.trim() : null);

        const loggedUser: User = {
          name: apiName || cleanEmail.split('@')[0],
          email: apiUser?.email || cleanEmail,
          city: apiUser?.profile?.focus_city || 'Nairobi',
          role: apiUser?.profile?.agency_role || 'Urban Planner',
        };

        if (rememberMe) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(loggedUser));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(loggedUser));
        }
        onAuthenticated(loggedUser, data.token);
        return;
      }

      showShortToast(data?.error || data?.detail || data?.non_field_errors?.[0] || 'Invalid email or password.', 'error');
    } catch {
      showShortToast('Unable to connect to live authentication service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const cleanEmail = suEmail.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      showShortToast('Please enter a valid email address.', 'error');
      return;
    }

    if (!suRole) {
      showShortToast('Please select your role before completing registration.', 'error');
      return;
    }

    if (!isStrictPassword(suPass)) {
      showShortToast('Password format: minimum 8 characters.', 'error');
      return;
    }

    if (suPass !== suConfirm) {
      showShortToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    const newUser: User = {
      name: suName.trim() || 'Urban Planner',
      email: cleanEmail,
      city: 'Nairobi',
      role: suRole,
    };

    try {
      const res = await fetch(getApiUrl('/api/auth/register/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUser.name, email: cleanEmail, city: 'Nairobi', role: suRole, password: suPass }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data) {
        setSiUser(cleanEmail);
        setSiPass('');
        setSuName('');
        setSuEmail('');
        setSuPass('');
        setSuConfirm('');
        setView('signin');
        showShortToast('Registration successful! Saved to live database. Please sign in.', 'success');
        setLoading(false);
        return;
      }

      let backendErrorMsg = 'Registration failed on server.';
      if (data) {
        if (typeof data === 'string') backendErrorMsg = data;
        else if (data.error) backendErrorMsg = data.error;
        else if (data.email) {
          const emailErr = Array.isArray(data.email) ? data.email[0] : data.email;
          if (typeof emailErr === 'string' && emailErr.toLowerCase().includes('already exists')) {
            backendErrorMsg = 'This email address is already registered. Please sign in or use a different email.';
          } else {
            backendErrorMsg = `Email: ${emailErr}`;
          }
        }
        else if (data.password) backendErrorMsg = Array.isArray(data.password) ? `Password: ${data.password[0]}` : `Password: ${data.password}`;
        else if (data.detail) backendErrorMsg = data.detail;
      }
      showShortToast(backendErrorMsg, 'error');
    } catch {
      showShortToast('Unable to connect to live database service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const cleanEmail = fEmail.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      showShortToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setView('reset');
        showShortToast(`Verification code sent to ${cleanEmail}. Please check your inbox.`, 'success');
      } else {
        showShortToast(data?.error || 'No account found with this email address.', 'error');
      }
    } catch {
      showShortToast('Unable to connect to password reset service.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend 4-digit code
  const handleResendCode = async () => {
    setLoading(true);
    const cleanEmail = fEmail.trim().toLowerCase();
    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        showShortToast(`Code resent to ${cleanEmail}. Please check your inbox.`, 'success');
      } else {
        showShortToast(data?.error || 'Unable to resend code.', 'error');
      }
    } catch {
      showShortToast('Unable to resend code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!isStrictPassword(newPassword)) {
      showShortToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/reset-password/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetCode.trim(), new_password: newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        showShortToast('Password reset successfully! Please sign in with your new password.', 'success');
        setSiUser(fEmail.trim().toLowerCase());
        setSiPass(newPassword);
        setView('signin');
      } else {
        showShortToast(data?.error || 'Invalid or expired verification code.', 'error');
      }
    } catch {
      showShortToast('Unable to reset password on server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const AlertBanner = () => alert ? (
    <div className={`auth-alert auth-alert-${alert.type}`} style={{ width: '100%', boxSizing: 'border-box', marginBottom: 14 }}>
      <span>{alert.message}</span>
    </div>
  ) : null;

  return (
    <div className="auth-screen">
      <div className="auth-glow-orb-1" />
      <div className="auth-glow-orb-2" />
      
      {/* Auth Card Container */}
      <div className="auth-card">
        <div className="auth-form-side">
          <div className="brand-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-logo-container brand-logo-container-light"><UrbanEyeLogo compact /></div>
            <span className="brand-name brand-name-dark" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--garnet)' }}>Urban Eye</span>
          </div>

          <AlertBanner />

          {/* SIGN IN VIEW */}
          {view === 'signin' && (
            <div className="fade-in">
              <h2>Welcome</h2>
              <p className="auth-subtitle">
                Enter your registered credentials to access your urban planning workspace.
              </p>

              <form className="auth-form" onSubmit={handleSignIn} autoComplete="off">
                <div className="input-group">
                  <label htmlFor="si-user">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><EnvelopeIcon /></span>
                    <input id="si-user" type="email" autoComplete="off" placeholder="enter your email" value={siUser} onChange={e => setSiUser(e.target.value.toLowerCase())} required style={{ textTransform: 'lowercase' }} />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="si-pass">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><LockIcon /></span>
                    <input id="si-pass" type={showSiPass ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Enter password" value={siPass} onChange={e => setSiPass(e.target.value)} required style={{ paddingRight: 44 }} />
                    <button type="button" className="input-icon-right" onClick={() => setShowSiPass(!showSiPass)}>
                      {showSiPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="auth-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                  <label className="remember-me">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember me
                  </label>
                  <button type="button" className="forgot-link" onClick={() => { setView('forgot'); setAlert(null); }}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="auth-switch">
                Don't have an account? <button type="button" onClick={() => { setView('signup'); setAlert(null); }}>Sign Up Now</button>
              </div>
            </div>
          )}

          {/* SIGN UP VIEW */}
          {view === 'signup' && (
            <div className="fade-in">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => { setView('signin'); setAlert(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--crimson)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ← Back to Sign In
                </button>
              </div>

              <h2>Create an account</h2>
              <p className="auth-subtitle">
                Fill in your details below to register.
              </p>

              <form className="auth-form" onSubmit={handleSignUp} autoComplete="off">
                {/* Full Name */}
                <div className="input-group">
                  <label htmlFor="su-name">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><UserIcon /></span>
                    <input id="su-name" type="text" autoComplete="off" placeholder="e.g. Joy Nduta" value={suName} onChange={e => setSuName(e.target.value)} required />
                  </div>
                </div>

                {/* Email Address */}
                <div className="input-group">
                  <label htmlFor="su-email">Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><EnvelopeIcon /></span>
                    <input id="su-email" type="email" autoComplete="off" placeholder="planner@agency.go.ke" value={suEmail} onChange={e => setSuEmail(e.target.value.toLowerCase())} required style={{ textTransform: 'lowercase' }} />
                  </div>
                </div>

                {/* Role */}
                <div className="input-group">
                  <label htmlFor="su-role">Role</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><BriefcaseIcon /></span>
                    <select
                      id="su-role"
                      value={suRole}
                      onChange={e => setSuRole(e.target.value)}
                      required
                    >
                      <option value="Urban Planner">Urban Planner</option>
                      <option value="Law Enforcement">Law Enforcement</option>
                      <option value="Crime Analyst">Crime Analyst</option>
                      <option value="Researcher">Researcher</option>
                    </select>
                  </div>
                </div>

                {/* Password Input  */}
                <div className="input-group">
                  <label htmlFor="su-pass">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><LockIcon /></span>
                    <input id="su-pass" type={showSuPass ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Enter password" value={suPass} onChange={e => setSuPass(e.target.value)} required style={{ paddingRight: 44 }} />
                    <button type="button" className="input-icon-right" onClick={() => setShowSuPass(!showSuPass)}>
                      {showSuPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <small style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2, display: 'block' }}>
                    Minimum 8 characters.
                  </small>
                </div>

                {/* Confirm Password */}
                <div className="input-group">
                  <label htmlFor="su-confirm">Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><LockIcon /></span>
                    <input id="su-confirm" type={showSuPass ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Re-enter password" value={suConfirm} onChange={e => setSuConfirm(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Complete Registration'}
                </button>
              </form>

              <div className="auth-switch">
                Already have an account? <button type="button" onClick={() => { setView('signin'); setAlert(null); }}>Sign In Now</button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <div className="fade-in">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => { setView('signin'); setAlert(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--crimson)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ← Back to Sign In
                </button>
              </div>

              <h2>Reset Password</h2>
              <p className="auth-subtitle">
                Enter your registered email address to receive a 4-digit verification code.
              </p>

              <form className="auth-form" onSubmit={handleForgotPasswordSubmit} autoComplete="off">
                <div className="input-group">
                  <label htmlFor="f-email">Account Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><EnvelopeIcon /></span>
                    <input id="f-email" type="email" autoComplete="off" placeholder="name@agency.go.ke" value={fEmail} onChange={e => setFEmail(e.target.value.toLowerCase())} required style={{ textTransform: 'lowercase' }} />
                  </div>
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Sending Email...' : 'Send Password Reset Email'}
                </button>
              </form>

              <div className="auth-switch">
                Remembered your password? <button type="button" onClick={() => { setView('signin'); setAlert(null); }}>Back to Sign In</button>
              </div>
            </div>
          )}

          {/* RESET PASSWORD */}
          {view === 'reset' && (
            <div className="fade-in">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setAlert(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--crimson)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ← Back to Email Verification
                </button>
              </div>

              <h2>Enter 4-Digit Code</h2>
              <p className="auth-subtitle">
                4-Digit reset code sent to {fEmail}. Enter the code below along with your new password.
              </p>

              <form className="auth-form" onSubmit={handleResetSubmit} autoComplete="off">
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="r-code">4-Digit Code</label>
                    <button type="button" onClick={handleResendCode} style={{ background: 'none', border: 'none', color: 'var(--crimson)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      Resend Code
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><KeyIcon /></span>
                    <input id="r-code" type="text" maxLength={6} placeholder="e.g. 4829" value={resetCode} onChange={e => setResetCode(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="r-pass">New Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon-left"><LockIcon /></span>
                    <input id="r-pass" type="password" autoComplete="new-password" minLength={8} placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password & Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* BRAND SIDE */}
        <div className="auth-brand-side">
          <div className="brand-header">
            <div className="brand-logo-container"><UrbanEyeLogo /></div>
            <span className="brand-name">Urban Eye</span>
          </div>
          <div className="brand-content">
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 14 }}>Smart City Intelligence</h3>
            <p className="brand-desc" style={{ fontSize: '0.88rem', lineHeight: 1.45, marginTop: 10 }}>
              Integrated predictive GIS analytics, population growth insights, spatial crime forecasting, and incident maps supporting Kenya's key administrative regions.
            </p>
            <div className="city-pills" style={{ marginTop: 18 }}>
              <span className="city-pill">Nairobi Central Analytics</span>
              <span className="city-pill">Mombasa Port Corridor</span>
              <span className="city-pill">Eldoret Expansion</span>
            </div>
          </div>
          <div className="brand-footer" style={{ fontSize: '0.8rem' }}>
            <div>Official Data Acquisition Pipeline</div>
            <div style={{ opacity: 0.65, marginTop: 2 }}>KNBS Census &amp; National Crime Research center, NPS ,OSM and HDX </div>
          </div>
        </div>
      </div>
    </div>
  );
}
