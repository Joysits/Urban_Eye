import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// API Backend Host Address
const API_HOST = "http://localhost:8000";

// Clean, standalone SVG Icons to avoid external npm icon packages dependency
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon-left">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon-left">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon-left">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon-left">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon-left">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const InfinityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="url(#ombreGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="glow-infinity">
    <defs>
      <linearGradient id="ombreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
    </defs>
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z" />
  </svg>
);

const MiniInfinityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5.04A7 7 0 0 1 19.35 12H12v3h10.2A10 10 0 1 0 3 12a10 10 0 0 0 9 9.94Z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Map Coordinates for Focus Cities in Kenya
interface CityConfig {
  coords: [number, number];
  zoom: number;
  label: string;
}

const CITY_COORDS: Record<string, CityConfig> = {
  Nairobi: { coords: [-1.286389, 36.817223], zoom: 12, label: "Nairobi: Live Incident & Heatmap Layer Active" },
  Mombasa: { coords: [-4.043477, 39.668206], zoom: 13, label: "Mombasa: Port Operations & Tourism Security Analytics Active" },
  Eldoret: { coords: [0.514277, 35.269780], zoom: 13, label: "Eldoret: Urban Expansion & Health Corridor Infrastructure Active" }
};

interface User {
  name: string;
  email: string;
  city: string;
  role: string;
}

export default function App() {
  // Auth Flow State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Inputs
  const [signInUser, setSignInUser] = useState<string>("");
  const [signInPassword, setSignInPassword] = useState<string>("");

  const [signUpName, setSignUpName] = useState<string>("");
  const [signUpEmail, setSignUpEmail] = useState<string>("");
  const [signUpCity, setSignUpCity] = useState<string>("Nairobi");
  const [signUpRole, setSignUpRole] = useState<string>("Urban Planner");
  const [signUpPassword, setSignUpPassword] = useState<string>("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>("");

  // UI state
  const [showSignInPass, setShowSignInPass] = useState<boolean>(false);
  const [showSignUpPass, setShowSignUpPass] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Map Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const activeMapInstance = useRef<L.Map | null>(null);

  // Auto clear alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Session verification on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_HOST}/api/auth/profile/`, {
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid session token.");
        }
        return res.json();
      })
      .then((data) => {
        const user: User = {
          name: data.name || data.username,
          email: data.email,
          city: data.profile?.focus_city || "Nairobi",
          role: data.profile?.agency_role || "Urban Planner"
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
      })
      .catch((err) => {
        console.error("Token verification error:", err);
        localStorage.removeItem("token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Leaflet map initialization
  useEffect(() => {
    if (!isAuthenticated || !mapRef.current) {
      if (activeMapInstance.current) {
        activeMapInstance.current.remove();
        activeMapInstance.current = null;
      }
      return;
    }

    const cityConfig = CITY_COORDS[currentUser?.city || "Nairobi"];

    // Safeguard duplication
    if (activeMapInstance.current) {
      activeMapInstance.current.remove();
    }

    const map = L.map(mapRef.current).setView(cityConfig.coords, cityConfig.zoom);
    activeMapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker(cityConfig.coords).addTo(map).bindPopup(`<b>${cityConfig.label}</b>`).openPopup();

    return () => {
      if (activeMapInstance.current) {
        activeMapInstance.current.remove();
        activeMapInstance.current = null;
      }
    };
  }, [isAuthenticated, currentUser?.city]);

  // Handle Authentication submit
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInUser || !signInPassword) {
      setAlert({ message: "Please fill in all credentials.", type: "error" });
      return;
    }

    setAlert(null);
    setIsLoading(true);

    fetch(`${API_HOST}/api/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: signInUser,
        password: signInPassword
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.detail || "Invalid credentials.");
        }
        return data;
      })
      .then((data) => {
        localStorage.setItem("token", data.token);
        const user: User = {
          name: data.user.name || data.user.username,
          email: data.user.email,
          city: data.user.profile?.focus_city || "Nairobi",
          role: data.user.profile?.agency_role || "Urban Planner"
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        setAlert({ message: `Successfully authenticated! Welcome back, ${user.name}.`, type: "success" });
      })
      .catch((err) => {
        setAlert({ message: err.message || "Failed to connect to authentication node.", type: "error" });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      setAlert({ message: "Please fill in all required fields.", type: "error" });
      return;
    }

    if (signUpPassword.length < 6) {
      setAlert({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setAlert({ message: "Passwords do not match.", type: "error" });
      return;
    }

    setAlert(null);
    setIsLoading(true);

    fetch(`${API_HOST}/api/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: signUpName,
        email: signUpEmail,
        city: signUpCity,
        role: signUpRole,
        password: signUpPassword
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          let errorDetail = "Registration failed.";
          if (typeof data === "object") {
            const keys = Object.keys(data);
            if (keys.length > 0) {
              const key = keys[0];
              const errVal = data[key];
              errorDetail = Array.isArray(errVal) ? `${key}: ${errVal[0]}` : `${key}: ${errVal}`;
            }
          }
          throw new Error(errorDetail);
        }
        return data;
      })
      .then((data) => {
        setAlert({ message: "Account created successfully! Please enter your password to sign in.", type: "success" });
        setSignInUser(signUpEmail);
        setAuthView("signin");

        // Clear sign up inputs
        setSignUpName("");
        setSignUpEmail("");
        setSignUpPassword("");
        setSignUpConfirmPassword("");
      })
      .catch((err) => {
        setAlert({ message: err.message || "Failed to register account with node.", type: "error" });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    
    // Clear client side state instantly
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSignInPassword("");

    if (token) {
      fetch(`${API_HOST}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      })
        .then(() => {
          setAlert({ message: "Successfully logged out.", type: "success" });
        })
        .catch((err) => {
          console.error("Logout request error:", err);
        });
    }
  };

  // Node loading overlay
  if (isLoading && !isAuthenticated) {
    return (
      <div className="auth-screen">
        <div className="auth-glow-orb-1" />
        <div className="auth-glow-orb-2" />
        <div style={{ zIndex: 10, textAlign: "center", color: "#e5eefb" }}>
          <div style={{ marginBottom: "20px" }}>
            <MiniInfinityIcon />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.15em" }}>ESTABLISHING SYSTEM CONNECTION...</h3>
          <div className="city-pills" style={{ justifyContent: "center", marginTop: "16px" }}>
            <span className="city-pill" style={{ opacity: 0.8 }}>Syncing Database Credentials</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Login/Signup interface
  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        {/* Glow decoration orbs */}
        <div className="auth-glow-orb-1" />
        <div className="auth-glow-orb-2" />

        <div className="auth-card">
          {/* Form container side */}
          <div className="auth-form-side">
            {/* Header (Visible on Mobile) */}
            <div className="brand-header" style={{ marginBottom: "28px", display: "flex" }}>
              <div className="brand-logo-container" style={{ background: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.25)" }}>
                <MiniInfinityIcon />
              </div>
              <span className="brand-name" style={{ color: "#0f172a" }}>UrbanEye</span>
            </div>

            {alert && (
              <div className={`auth-alert auth-alert-${alert.type}`}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {alert.type === "error" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{alert.message}</span>
              </div>
            )}

            {authView === "signin" ? (
              <div className="fade-in">
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">
                  Enter your credentials to access the urban planning & crime intelligence node.
                </p>

                <form className="auth-form" onSubmit={handleSignIn}>
                  <div className="input-group">
                    <label htmlFor="signin-email">Username or Email</label>
                    <div className="input-wrapper">
                      <UserIcon />
                      <input
                        id="signin-email"
                        type="text"
                        placeholder="admin or email address"
                        value={signInUser}
                        onChange={(e) => setSignInUser(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="signin-password">Password</label>
                    <div className="input-wrapper">
                      <LockIcon />
                      <input
                        id="signin-password"
                        type={showSignInPass ? "text" : "password"}
                        placeholder="Enter password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="input-icon-right"
                        onClick={() => setShowSignInPass(!showSignInPass)}
                        title={showSignInPass ? "Hide password" : "Show password"}
                      >
                        {showSignInPass ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-meta">
                    <label className="remember-me">
                      <input type="checkbox" defaultChecked />
                      Remember me
                    </label>
                    <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); setAlert({ message: "Default login available: admin / admin123", type: "success" }); }}>
                      Forgot password?
                    </a>
                  </div>

                  <button type="submit" className="btn-submit">
                    Sign In
                  </button>
                </form>

                <div className="auth-switch">
                  Don't have an account?{" "}
                  <button onClick={() => setAuthView("signup")}>Sign Up Now</button>
                </div>

                <div className="social-login">
                  <span className="social-title">Or continue with</span>
                  <div className="social-icons">
                    <button className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Sign in with Facebook">
                      <FacebookIcon />
                    </button>
                    <button className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Sign in with Twitter">
                      <TwitterIcon />
                    </button>
                    <button className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Sign in with Google">
                      <GoogleIcon />
                    </button>
                    <button className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Sign in with LinkedIn">
                      <LinkedinIcon />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fade-in">
                <h2>Create Account</h2>
                <p className="auth-subtitle">
                  Configure your dashboard role and focus region parameters.
                </p>

                <form className="auth-form" onSubmit={handleSignUp}>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="signup-name">Full Name</label>
                      <div className="input-wrapper">
                        <UserIcon />
                        <input
                          id="signup-name"
                          type="text"
                          placeholder="e.g. Joy Nduta"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="signup-email">Email Address</label>
                      <div className="input-wrapper">
                        <EnvelopeIcon />
                        <input
                          id="signup-email"
                          type="email"
                          placeholder="name@agency.go.ke"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="signup-city">Focus City</label>
                      <div className="input-wrapper">
                        <MapPinIcon />
                        <select
                          id="signup-city"
                          value={signUpCity}
                          onChange={(e) => setSignUpCity(e.target.value)}
                        >
                          <option value="Nairobi">Nairobi</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Eldoret">Eldoret</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="signup-role">Agency Role</label>
                      <div className="input-wrapper">
                        <BriefcaseIcon />
                        <select
                          id="signup-role"
                          value={signUpRole}
                          onChange={(e) => setSignUpRole(e.target.value)}
                        >
                          <option value="Urban Planner">Urban Planner</option>
                          <option value="Law Enforcement">Law Enforcement</option>
                          <option value="Researcher">Researcher</option>
                          <option value="Administrator">Administrator</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="signup-password">Password</label>
                      <div className="input-wrapper">
                        <LockIcon />
                        <input
                          id="signup-password"
                          type={showSignUpPass ? "text" : "password"}
                          placeholder="6+ characters"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="input-icon-right"
                          onClick={() => setShowSignUpPass(!showSignUpPass)}
                          title={showSignUpPass ? "Hide password" : "Show password"}
                        >
                          {showSignUpPass ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="signup-confirm">Confirm Password</label>
                      <div className="input-wrapper">
                        <LockIcon />
                        <input
                          id="signup-confirm"
                          type={showSignUpPass ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-submit">
                    Complete Registration
                  </button>
                </form>

                <div className="auth-switch">
                  Already have an account?{" "}
                  <button onClick={() => setAuthView("signin")}>Sign In Now</button>
                </div>
              </div>
            )}
          </div>

          {/* Blue-to-Lilac Ombre brand illustration side */}
          <div className="auth-brand-side">
            <div className="brand-header">
              <div className="brand-logo-container">
                <MiniInfinityIcon />
              </div>
              <span className="brand-name">UrbanEye</span>
            </div>

            <div className="brand-content">
              <div className="brand-content-logo">
                <InfinityIcon />
              </div>
              <h3>Smart City Intelligence</h3>
              <p className="brand-desc">
                Integrated predictive GIS analytics, population growth insights, and incident maps supporting Kenya's key administrative regions.
              </p>
              
              <div className="city-pills">
                <span className="city-pill">Nairobi Central Analytics</span>
                <span className="city-pill">Mombasa Port corridor</span>
                <span className="city-pill">Eldoret expansion</span>
              </div>
            </div>

            <div className="brand-footer">
              <div>Official Data Acquisition Pipeline</div>
              <div style={{ opacity: 0.65, marginTop: "4px" }}>KNBS Census & National Police Service Integrated</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard render once Authenticated
  return (
    <main className="app-shell fade-in">
      {/* Top Premium Navbar */}
      <nav className="dashboard-navbar">
        <div className="nav-brand">
          <div className="brand-logo-container" style={{ width: "38px", height: "38px", background: "rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.3)" }}>
            <MiniInfinityIcon />
          </div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>URBANEYE INTEL</h2>
        </div>
        <div className="nav-user">
          <span style={{ fontSize: "0.9rem", opacity: 0.85 }}>
            Welcome, <strong>{currentUser?.name}</strong>
          </span>
          <span className="user-badge">{currentUser?.city} / {currentUser?.role}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {alert && (
        <div className={`auth-alert auth-alert-success`} style={{ margin: "0 0 24px 0" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{alert.message}</span>
        </div>
      )}

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Smart Urban and Crime Intelligence System</p>
          <h1>City risk data, mapped and monitored.</h1>
          <p className="lede">
            Active region: <strong>{currentUser?.city}</strong>. Customized datasets loaded for your role as a{" "}
            <strong>{currentUser?.role}</strong>. Utilizing KNBS 2019 Census, GeoFabrik OSM, and NPS statistics.
          </p>
        </div>
        <div className="hero-panel">
          <div className="stat-card">
            <span>Primary Focus</span>
            <strong>{currentUser?.city === "Mombasa" ? "Port Operations & Tourism Corridor" : currentUser?.city === "Eldoret" ? "Agricultural & Expansion Nodes" : "Crime Heatmaps & Population Dynamics"}</strong>
          </div>
          <div className="stat-card">
            <span>Official Data Feeds</span>
            <strong>KNBS Census + Police Reports</strong>
          </div>
          <div className="stat-card">
            <span>Assigned Access Node</span>
            <strong>{currentUser?.role} Terminal</strong>
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="section-heading">
          <div>
            <h2>City intelligence map</h2>
            <p>Active overview centered on {currentUser?.city}, Kenya.</p>
          </div>
        </div>
        <div ref={mapRef} className="map-canvas" aria-label={`Interactive map of ${currentUser?.city}`} />
      </section>
    </main>
  );
}
