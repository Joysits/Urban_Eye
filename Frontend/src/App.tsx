import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// API Backend Host Address
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE_URL) return normalizedPath;
  if (API_BASE_URL.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

const readJsonResponse = async (response: Response): Promise<any> => {
  const responseText = await response.text();
  if (!responseText.trim()) return null;
  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    throw new Error(responseText);
  }
};

const readStoredUser = (): User | null => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
};

const formatTimestamp = (isoValue?: string): string => {
  if (!isoValue) return "Just now";
  const parsedDate = new Date(isoValue);
  if (Number.isNaN(parsedDate.getTime())) return "Just now";
  return parsedDate.toLocaleString();
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

const UrbanEyeLogo = ({ compact = false }: { compact?: boolean }) => (
  <div className={`urbaneye-logo ${compact ? "urbaneye-logo-compact" : "urbaneye-logo-full"}`}>
    <svg xmlns="http://www.w3.org/2000/svg" width={compact ? 38 : 84} height={compact ? 38 : 84} viewBox="0 0 84 84" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="68" height="68" rx="2" stroke="currentColor" strokeWidth="2.2" />
      <path d="M28 24V49.5C28 57.5 34.5 64 42.5 64C50.5 64 57 57.5 57 49.5V24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 24H40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M44 24H57" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    {!compact && (
      <div className="urbaneye-logo-wordmark">
        <span>URBAN</span>
        <span>EYE</span>
      </div>
    )}
  </div>
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

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v11h14V10" /><path d="M9 21v-6h6v6" />
  </svg>
);
const AnalysisIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" />
  </svg>
);
const PlanningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /><circle cx="18" cy="17" r="2" />
  </svg>
);
const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h6" />
  </svg>
);

// ─── City Coordinates ─────────────────────────────────────────────────────────

interface CityConfig { coords: [number, number]; zoom: number; label: string; }
const CITY_COORDS: Record<string, CityConfig> = {
  Nairobi: { coords: [-1.286389, 36.817223], zoom: 12, label: "Nairobi: Live Incident & Heatmap Layer Active" },
  Mombasa: { coords: [-4.043477, 39.668206], zoom: 13, label: "Mombasa: Port Operations & Tourism Security Analytics Active" },
  Eldoret: { coords: [0.514277, 35.269780], zoom: 13, label: "Eldoret: Urban Expansion & Health Corridor Infrastructure Active" }
};

// ─── Type Interfaces ──────────────────────────────────────────────────────────

interface User { name: string; email: string; city: string; role: string; }

interface Incident {
  id: number; zone: string; category: string; severity: string;
  status: string; latitude: number; longitude: number;
  description: string; reported_at: string;
}

interface DashboardOverview {
  city: string; risk_score: number; active_alerts: number;
  growth_pressure: string; priority_zones: number;
  top_priorities: string[]; updated_at: string;
  recent_incidents: Incident[];
  incident_markers: Array<{ id: number; title: string; severity: string; status: string; latitude: number; longitude: number; }>;
}

interface DashboardAnalysis {
  city: string; risk_score: number; active_alerts: number;
  growth_pressure: string; priority_zones: number;
  risk_distribution: { labels: string[]; values: number[]; };
  recent_incidents: Incident[];
}

interface PlanningProject {
  id: number; city: string; title: string; summary: string;
  stage: "Discovery" | "Consultation" | "Budgeting" | "Execution";
  priority: "Low" | "Medium" | "High"; is_active: boolean;
}

interface GeneratedReport {
  id: number; city: string; title: string; focus: "safety" | "planning" | "analytics";
  summary: string; created_at: string; generated_by_name: string;
}

// ── AI Prediction Interfaces ──
interface PopulationPrediction {
  city: string;
  current_population: number;
  projected_population: number;
  growth_rate_pct: number;
  housing_gap: number;
  infrastructure_pressure: string;
  year_range: string;
  density_trend: Array<{ year: number; population: number; }>;
}

interface CrimePrediction {
  city: string;
  risk_index: number;
  predicted_hotspot_zone: string;
  top_category: string;
  forecast_30_day: string;
  confidence_pct: number;
  category_breakdown: Array<{ category: string; count: number; pct: number; }>;
  trend: string;
}

interface ImpactPrediction {
  city: string;
  impact_score: number;
  risk_reduction_pct: number;
  roi_estimate: string;
  projects_analyzed: number;
  execution_readiness: string;
  highlights: string[];
}

type DashboardPage = "home" | "analysis" | "planning" | "reports";
type AuthView = "signin" | "signup" | "forgot";

// ─── Impact Score Ring Component ──────────────────────────────────────────────
const ImpactRing = ({ score }: { score: number }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="ring-container">
      <svg className="ring-svg" width="72" height="72" viewBox="0 0 72 72">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C1D24" />
            <stop offset="50%" stopColor="#A63A3A" />
            <stop offset="100%" stopColor="#C96B6B" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="36" cy="36" r={radius} />
        <circle
          className="ring-fill"
          cx="36" cy="36" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label">{score}</div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(localStorage.getItem("token")));
  const [authView, setAuthView] = useState<AuthView>("signin");
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
  const [dashboardPage, setDashboardPage] = useState<DashboardPage>("home");

  // Form inputs
  const [signInUser, setSignInUser] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpCity, setSignUpCity] = useState("Nairobi");
  const [signUpRole, setSignUpRole] = useState("Urban Planner");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  // UI state
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Dashboard data
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [dashboardAnalysis, setDashboardAnalysis] = useState<DashboardAnalysis | null>(null);
  const [planningProjects, setPlanningProjects] = useState<PlanningProject[]>([]);
  const [planningStageCounts, setPlanningStageCounts] = useState<Record<string, number>>({});
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [reportTitle, setReportTitle] = useState("Urban Eye monthly brief");
  const [reportFocus, setReportFocus] = useState<"safety" | "planning" | "analytics">("safety");

  // AI Prediction state
  const [populationPrediction, setPopulationPrediction] = useState<PopulationPrediction | null>(null);
  const [crimePrediction, setCrimePrediction] = useState<CrimePrediction | null>(null);
  const [impactPrediction, setImpactPrediction] = useState<ImpactPrediction | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Map refs
  const analysisMapRef = useRef<HTMLDivElement | null>(null);
  const planningMapRef = useRef<HTMLDivElement | null>(null);
  const activeMapInstance = useRef<L.Map | null>(null);
  const activeMapContainer = useRef<string | null>(null);

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
      setIsAuthenticated(false);
      setCurrentUser(readStoredUser());
      return;
    }
    fetch(apiUrl("/api/auth/profile/"), {
      headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Invalid session token.");
        return readJsonResponse(res);
      })
      .then((data) => {
        if (!data) throw new Error("Empty profile response.");
        const user: User = {
          name: data.name || data.username,
          email: data.email,
          city: data.profile?.focus_city || "Nairobi",
          role: data.profile?.agency_role || "Urban Planner"
        };
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);
        setIsAuthenticated(false);
      });
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.city) {
      setDashboardOverview(null); setDashboardAnalysis(null);
      setPlanningProjects([]); setPlanningStageCounts({});
      setGeneratedReports([]); return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    const cityQuery = encodeURIComponent(currentUser.city);
    setIsDashboardLoading(true);

    Promise.all([
      fetch(apiUrl(`/api/dashboard/overview/?city=${cityQuery}`), {
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" }
      }).then(async (res) => {
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data?.error || "Failed to load overview.");
        return data;
      }),
      fetch(apiUrl(`/api/dashboard/analysis/?city=${cityQuery}`), {
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" }
      }).then(async (res) => {
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data?.error || "Failed to load analysis.");
        return data;
      }),
      fetch(apiUrl(`/api/dashboard/planning/?city=${cityQuery}`), {
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" }
      }).then(async (res) => {
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data?.error || "Failed to load planning.");
        return data;
      }),
      fetch(apiUrl(`/api/dashboard/reports/?city=${cityQuery}`), {
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" }
      }).then(async (res) => {
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data?.error || "Failed to load reports.");
        return data;
      }),
    ])
      .then(([overviewData, analysisData, planningData, reportData]) => {
        setDashboardOverview(overviewData as DashboardOverview);
        setDashboardAnalysis(analysisData as DashboardAnalysis);
        setPlanningProjects((planningData?.projects || []) as PlanningProject[]);
        setPlanningStageCounts((planningData?.stage_counts || {}) as Record<string, number>);
        setGeneratedReports((reportData?.reports || []) as GeneratedReport[]);
      })
      .catch((err) => setAlert({ message: err.message || "Unable to sync dashboard.", type: "error" }))
      .finally(() => setIsDashboardLoading(false));
  }, [isAuthenticated, currentUser?.city]);

  // Fetch AI predictions
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.city) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const cityQuery = encodeURIComponent(currentUser.city);
    setIsPredictionLoading(true);

    const headers = { "Authorization": `Token ${token}`, "Content-Type": "application/json" };

    Promise.all([
      fetch(apiUrl(`/api/predict/population/?city=${cityQuery}`), { headers })
        .then(async (res) => { const d = await readJsonResponse(res); return res.ok ? d : null; }),
      fetch(apiUrl(`/api/predict/crime/?city=${cityQuery}`), { headers })
        .then(async (res) => { const d = await readJsonResponse(res); return res.ok ? d : null; }),
      fetch(apiUrl(`/api/predict/impact/?city=${cityQuery}`), { headers })
        .then(async (res) => { const d = await readJsonResponse(res); return res.ok ? d : null; }),
    ])
      .then(([popData, crimeData, impactData]) => {
        if (popData)    setPopulationPrediction(popData as PopulationPrediction);
        if (crimeData)  setCrimePrediction(crimeData as CrimePrediction);
        if (impactData) setImpactPrediction(impactData as ImpactPrediction);
      })
      .catch(() => {})
      .finally(() => setIsPredictionLoading(false));
  }, [isAuthenticated, currentUser?.city]);

  // Map initialization
  useEffect(() => {
    if (!isAuthenticated) {
      if (activeMapInstance.current) { activeMapInstance.current.remove(); activeMapInstance.current = null; activeMapContainer.current = null; }
      return;
    }

    // Only attach maps when on Analysis or Planning pages
    if (dashboardPage !== "analysis" && dashboardPage !== "planning") {
      // if leaving map pages, keep the instance but don't attach to home
      return;
    }
    const target = dashboardPage === "analysis" ? analysisMapRef.current : planningMapRef.current;
    if (!target) return;

    const cityConfig = CITY_COORDS[currentUser?.city || "Nairobi"];

    // If map already exists on same container, just update view/markers
    if (activeMapInstance.current && activeMapContainer.current === target.id) {
      activeMapInstance.current.setView(cityConfig.coords, cityConfig.zoom);
    } else {
      // Remove existing map if switching containers
      if (activeMapInstance.current) {
        try { activeMapInstance.current.remove(); } catch { /* ignore */ }
        activeMapInstance.current = null; activeMapContainer.current = null;
      }

      const map = L.map(target).setView(cityConfig.coords, cityConfig.zoom);
      activeMapInstance.current = map;
      activeMapContainer.current = target.id || null;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    }

    // Add markers (clear previous layer if any)
    try {
      const markers = dashboardOverview?.incident_markers ?? [];
      // remove existing marker layers by clearing all layers except tile layers
      activeMapInstance.current!.eachLayer((layer) => {
        // keep TileLayer instances
        if ((layer as any)._url) return;
        try { activeMapInstance.current!.removeLayer(layer); } catch {}
      });

      if ((dashboardOverview?.incident_markers ?? []).length > 0) {
        (dashboardOverview?.incident_markers || []).forEach((marker) => {
          L.marker([marker.latitude, marker.longitude]).addTo(activeMapInstance.current!)
            .bindPopup(`<b>${marker.title}</b><br/>Severity: ${marker.severity}<br/>Status: ${marker.status}`);
        });
      } else {
        L.marker(cityConfig.coords).addTo(activeMapInstance.current!).bindPopup(`<b>${cityConfig.label}</b>`).openPopup();
      }
    } catch (e) { /* ignore map layering errors while switching */ }

    // do not remove map on cleanup unless unauthenticating
    return () => {};
  }, [isAuthenticated, currentUser?.city, dashboardOverview, dashboardPage]);

  // ─── Auth Handlers ────────────────────────────────────────────────────────────

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const loginIdentifier = signInUser.trim();
    if (!loginIdentifier || !signInPassword) { setAlert({ message: "Please fill in all credentials.", type: "error" }); return; }
    setAlert(null); setIsLoading(true);
    (async () => {
      const payload = JSON.stringify({ username: loginIdentifier, password: signInPassword });
      const headers = { "Content-Type": "application/json" };

      // Try a few sensible URL variants in case the configured base/path differs.
      const attempts: string[] = [];
      if (API_BASE_URL) {
        attempts.push(apiUrl('/api/auth/login/'));
        attempts.push(apiUrl('/auth/login/'));
        attempts.push(`${API_BASE_URL.replace(/\/api$/, '')}/auth/login/`);
      } else {
        attempts.push('/api/auth/login/', '/auth/login/');
      }

      let lastErr: any = null;
      const tried: string[] = [];
      for (const url of attempts) {
        try {
          tried.push(url);
          console.debug('Attempting login POST to', url);
          const res = await fetch(url, { method: 'POST', headers, body: payload, mode: 'cors' });
          const data = await readJsonResponse(res);
          if (!res.ok) throw new Error(data?.error || data?.detail || res.statusText || 'Login failed');

          if (!data) throw new Error('Empty login response.');
          localStorage.setItem('token', data.token);
          const user: User = {
            name: data.user?.name || data.user?.username || 'User',
            email: data.user?.email || '',
            city: data.user?.profile?.focus_city || 'Nairobi',
            role: data.user?.profile?.agency_role || 'Urban Planner'
          };
          localStorage.setItem('user', JSON.stringify(user));
          setCurrentUser(user); setIsAuthenticated(true);
          setAlert({ message: `Welcome back, ${user.name}!`, type: 'success' });
          lastErr = null;
          break; // success
        } catch (err: any) {
          lastErr = err;
          // continue to next attempt
        }
      }

      if (lastErr) {
        console.error('Login failed. Attempts:', tried, lastErr);
        const first = tried[0] || attempts[0] || '/api/auth/login/';
        const msgBase = (lastErr && lastErr.message) ? lastErr.message : 'Failed to connect to the API.';
        const msg = `${msgBase} Tried: ${first} ${tried.length>1?`(+${tried.length-1} more)` : ''}. Ensure the backend is running at the configured VITE_API_BASE_URL and CORS allows requests from this origin.`;
        setAlert({ message: msg, type: 'error' });
      }
      setIsLoading(false);
    })();
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) { setAlert({ message: "Please fill in all required fields.", type: "error" }); return; }
    if (signUpPassword.length < 6) { setAlert({ message: "Password must be at least 6 characters.", type: "error" }); return; }
    if (signUpPassword !== signUpConfirmPassword) { setAlert({ message: "Passwords do not match.", type: "error" }); return; }
    setAlert(null); setIsLoading(true);

    fetch(apiUrl("/api/auth/register/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: signUpName, email: signUpEmail, city: signUpCity, role: signUpRole, password: signUpPassword })
    })
      .then(async (res) => {
        const data = await readJsonResponse(res);
        if (!res.ok) {
          let errorDetail = "Registration failed.";
          if (data && typeof data === "object") {
            const keys = Object.keys(data);
            if (keys.length > 0) { const key = keys[0]; const errVal = data[key]; errorDetail = Array.isArray(errVal) ? `${key}: ${errVal[0]}` : `${key}: ${errVal}`; }
          }
          throw new Error(errorDetail);
        }
        return data;
      })
      .then((data) => {
        if (!data) throw new Error("Empty registration response.");
        const user: User = {
          name: data.user.name || data.user.username, email: data.user.email,
          city: data.user.profile?.focus_city || "Nairobi", role: data.user.profile?.agency_role || "Urban Planner"
        };
        localStorage.setItem("token", data.token); localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user); setIsAuthenticated(true); setDashboardPage("home");
        setAlert({ message: `Account created! Welcome, ${user.name}.`, type: "success" });
        setSignUpName(""); setSignUpEmail(""); setSignUpPassword(""); setSignUpConfirmPassword("");
      })
      .catch((err) => setAlert({ message: err.message || "Failed to register.", type: "error" }))
      .finally(() => setIsLoading(false));
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email || !forgotPassword || !forgotConfirmPassword) { setAlert({ message: "Please complete all reset fields.", type: "error" }); return; }
    if (forgotPassword.length < 6) { setAlert({ message: "Password must be at least 6 characters.", type: "error" }); return; }
    if (forgotPassword !== forgotConfirmPassword) { setAlert({ message: "Passwords do not match.", type: "error" }); return; }
    setAlert(null); setIsLoading(true);

    fetch(apiUrl("/api/auth/password-reset/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: forgotPassword, confirm_password: forgotConfirmPassword })
    })
      .then(async (res) => { const data = await readJsonResponse(res); if (!res.ok) throw new Error(data?.error || "Password reset failed."); return data; })
      .then((data) => {
        if (!data) throw new Error("Empty reset response.");
        const user: User = {
          name: data.user.name || data.user.username, email: data.user.email,
          city: data.user.profile?.focus_city || "Nairobi", role: data.user.profile?.agency_role || "Urban Planner"
        };
        localStorage.setItem("token", data.token); localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user); setIsAuthenticated(true); setDashboardPage("home"); setAuthView("signin");
        setAlert({ message: "Password reset successful. You are now signed in.", type: "success" });
      })
      .catch((err) => setAlert({ message: err.message || "Unable to reset password.", type: "error" }))
      .finally(() => setIsLoading(false));
  };

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setIsAuthenticated(false); setCurrentUser(null); setSignInPassword("");
    setPopulationPrediction(null); setCrimePrediction(null); setImpactPrediction(null);
    if (token) {
      fetch(apiUrl("/api/auth/logout/"), {
        method: "POST",
        headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" }
      }).then(() => setAlert({ message: "Successfully logged out.", type: "success" })).catch(() => {});
    }
  };

  const handleGenerateReport = () => {
    const token = localStorage.getItem("token");
    if (!token) { setAlert({ message: "Session expired. Please sign in again.", type: "error" }); return; }
    const title = reportTitle.trim();
    if (!title) { setAlert({ message: "Please provide a report title.", type: "error" }); return; }
    setIsLoading(true);

    fetch(apiUrl(`/api/dashboard/reports/?city=${encodeURIComponent(currentUser?.city || "Nairobi")}`), {
      method: "POST",
      headers: { "Authorization": `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title, focus: reportFocus })
    })
      .then(async (res) => { const data = await readJsonResponse(res); if (!res.ok) throw new Error(data?.error || "Failed to generate report."); return data; })
      .then((data) => {
        const nextReport = data?.report as GeneratedReport | undefined;
        if (!nextReport) throw new Error("Report generated but payload was empty.");
        setGeneratedReports((prev) => [nextReport, ...prev]);
        setAlert({ message: "Report generated successfully.", type: "success" });
      })
      .catch((err) => setAlert({ message: err.message || "Failed to generate report.", type: "error" }))
      .finally(() => setIsLoading(false));
  };

  // ─── Navigation ───────────────────────────────────────────────────────────────

  const dashboardNavItems: Array<{ id: DashboardPage; label: string; icon: JSX.Element }> = [
    { id: "home",     label: "Home",                icon: <HomeIcon /> },
    { id: "analysis", label: "Area Analysis",       icon: <AnalysisIcon /> },
    { id: "planning", label: "Development Planning", icon: <PlanningIcon /> },
    { id: "reports",  label: "Report Generator",    icon: <ReportIcon /> },
  ];

  // ─── AI Prediction Cards ──────────────────────────────────────────────────────

  const renderAIPredictionCards = () => {
    if (isPredictionLoading) {
      return (
        <div className="ai-predictions-row">
          {[0,1,2].map((i) => (
            <div key={i} className="ai-prediction-card ai-card-population">
              <div className="ai-skeleton tall" style={{ marginBottom: 16 }} />
              <div className="ai-skeleton" />
              <div className="ai-skeleton short" />
            </div>
          ))}
        </div>
      );
    }

    // Replace numeric AI preview cards with CTAs to real workflows
    return (
      <div className="ai-predictions-row">
        <div className="ai-prediction-card ai-card-cta">
          <div className="ai-card-header">
            <div>
              <p className="ai-card-title">Explore Area Analysis</p>
              <p className="ai-card-subtitle">Select or draw a zone to view crime, population, and landuse layers.</p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn-submit" onClick={() => setDashboardPage("analysis")}>Open Area Analysis</button>
          </div>
        </div>

        <div className="ai-prediction-card ai-card-cta">
          <div className="ai-card-header">
            <div>
              <p className="ai-card-title">Development Planning</p>
              <p className="ai-card-subtitle">Sketch proposals, run impact simulations, and save draft plans.</p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn-submit" onClick={() => setDashboardPage("planning")}>Open Planning Tools</button>
          </div>
        </div>

        <div className="ai-prediction-card ai-card-cta">
          <div className="ai-card-header">
            <div>
              <p className="ai-card-title">Reports & Export</p>
              <p className="ai-card-subtitle">Export current map view and selected data to the Report Generator.</p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn-submit" onClick={() => setDashboardPage("reports")}>Go to Report Generator</button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Dashboard Page Renderer ──────────────────────────────────────────────────

  const renderDashboardPage = () => {

    // ── Analysis Page ──
    if (dashboardPage === "analysis") {
      const analysis = dashboardAnalysis;
      const maxDistribution = Math.max(...(analysis?.risk_distribution.values || [1]));

      return (
        <section className="dashboard-page fade-in" style={{ gap: 20 }}>
          <div className="dashboard-grid-2">
            <div className="dashboard-panel">
              <p className="eyebrow">Area Analysis</p>
              <h2 style={{ color: "var(--blush)" }}>Investigative View</h2>
              <p className="dashboard-copy">Draw a polygon, drop a pin, or select a predefined zone to inspect crime, population and land-use layers.</p>

              <div className="map-tools" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-submit" onClick={() => setAlert({ message: 'Draw polygon tool (stub)', type: 'success' })}>Draw polygon</button>
                  <button className="btn-submit" onClick={() => setAlert({ message: 'Drop pin tool (stub)', type: 'success' })}>Drop pin / radius</button>
                  <select onChange={(e) => setAlert({ message: `Predefined zone: ${e.target.value}`, type: 'success' })}>
                    <option value="">Pick predefined zone</option>
                    <option value="ward-1">Ward 1</option>
                    <option value="ward-2">Ward 2</option>
                  </select>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ marginRight: 12 }}><input type="checkbox" defaultChecked /> Crime heatmap</label>
                  <label style={{ marginRight: 12 }}><input type="checkbox" defaultChecked /> Population density</label>
                  <label style={{ marginRight: 12 }}><input type="checkbox" /> Infrastructure</label>
                  <label style={{ marginRight: 12 }}><input type="checkbox" /> Land use</label>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn-submit" onClick={() => setAlert({ message: 'Enter comparison mode (stub)', type: 'success' })}>Enter Comparison Mode</button>
                  <button className="btn-submit" onClick={() => setAlert({ message: 'Export to Report (stub)', type: 'success' })}>Export to Report</button>
                </div>
              </div>

              <div className="analysis-summary" style={{ marginTop: 20, opacity: 0.9 }}>
                <h4 style={{ margin: '6px 0' }}>Summary</h4>
                <p className="dashboard-copy" style={{ marginTop: 6 }}>Select an area to see a concise summary here (incidents, population, notes).</p>
                <div style={{ marginTop: 10 }}>
                  <small style={{ color: 'var(--text-muted)' }}>No selection yet.</small>
                </div>
              </div>
            </div>

            <div className="dashboard-panel">
              <h3>Map View</h3>
              <div ref={analysisMapRef} id="analysis-map" className="map-canvas" style={{ height: 420, borderRadius: 12, marginTop: 8 }}>
                <div style={{ padding: 24, color: '#6e4b4f' }}>Interactive map placeholder — use the tools to draw or select an area.</div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ── Planning Page ──
    if (dashboardPage === "planning") {
      const stageOrder: Array<PlanningProject["stage"]> = ["Discovery","Consultation","Budgeting","Execution"];
      return (
        <section className="dashboard-page dashboard-grid-2 fade-in">
          <div className="dashboard-panel">
            <p className="eyebrow">Development Planning</p>
            <h2 style={{ color: "var(--blush)" }}>Design & Simulation</h2>
            <p className="dashboard-copy">Draw proposed infrastructure or place a building footprint and run an impact simulation.</p>

            <div className="planning-tools" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-submit" onClick={() => setAlert({ message: 'Draw road (stub)', type: 'success' })}>Draw road</button>
                <button className="btn-submit" onClick={() => setAlert({ message: 'Place building (stub)', type: 'success' })}>Place building</button>
                <select onChange={(e) => setAlert({ message: `Project type: ${e.target.value}`, type: 'success' })}>
                  <option value="">Select project type</option>
                  <option value="road">Road</option>
                  <option value="hospital">Hospital</option>
                  <option value="school">School</option>
                  <option value="residential">Residential</option>
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <button className="btn-submit" onClick={() => setAlert({ message: 'Run impact prediction (stub)', type: 'success' })}>Run impact prediction</button>
                <button className="btn-submit" onClick={() => setAlert({ message: 'Save draft plan (stub)', type: 'success' })} style={{ marginLeft: 8 }}>Save as draft</button>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Status:</label>
                <select style={{ marginLeft: 8 }} onChange={(e) => setAlert({ message: `Status: ${e.target.value}`, type: 'success' })}>
                  <option value="draft">Draft</option>
                  <option value="review">Under review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Timeline / Phasing (notes):</label>
                <textarea placeholder="Describe phases or timeline" style={{ width: '100%', minHeight: 80, marginTop: 8 }} />
              </div>
            </div>
          </div>

          <div className="dashboard-panel">
            <h3 style={{ color: 'var(--blush)' }}>Planning Map</h3>
            <div ref={planningMapRef} id="planning-map" className="map-canvas" style={{ height: 520, borderRadius: 12, marginTop: 8 }}>
              <div style={{ padding: 24, color: '#6e4b4f' }}>Interactive planning map placeholder — draw proposals to run simulations.</div>
            </div>
          </div>
        </section>
      );
    }

    // ── Reports Page ──
    if (dashboardPage === "reports") {
      const latestReport = generatedReports[0];
      return (
        <section className="dashboard-page dashboard-grid-2 fade-in">
          <div className="dashboard-panel">
            <p className="eyebrow">Report Generator</p>
            <h2 style={{ color: "var(--blush)" }}>Generate a City Brief</h2>
            <div className="report-form">
              <label>
                Report title
                <input type="text" placeholder="Urban Eye monthly brief" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
              </label>
              <label>
                Report focus
                <select value={reportFocus} onChange={(e) => setReportFocus(e.target.value as "safety" | "planning" | "analytics")}>
                  <option value="safety">Safety overview</option>
                  <option value="planning">Planning summary</option>
                  <option value="analytics">Analytics extract</option>
                </select>
              </label>
              <button className="btn-submit" type="button" onClick={handleGenerateReport} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
          <div className="dashboard-panel report-preview">
            <h3>Preview</h3>
            <p><strong>City:</strong> {currentUser?.city}</p>
            <p><strong>Role:</strong> {currentUser?.role}</p>
            {populationPrediction && (
              <p><strong>Population projection:</strong> {(populationPrediction.projected_population / 1_000_000).toFixed(1)}M by {populationPrediction.year_range}</p>
            )}
            {crimePrediction && (
              <p><strong>Crime risk index:</strong> {crimePrediction.risk_index}/100 — {crimePrediction.forecast_30_day}</p>
            )}
            <p>{latestReport?.summary || "Generate a report to preview AI-style city intelligence output."}</p>
            <p><strong>Generated:</strong> {latestReport ? formatTimestamp(latestReport.created_at) : "Not yet generated"}</p>
            <p><strong>Recent reports:</strong> {generatedReports.length}</p>
          </div>
        </section>
      );
    }

    // ── Home Page ──
    return (
      <section className="dashboard-home fade-in">
        <div className="dashboard-panel dashboard-hero-banner">
          <div>
            <p className="eyebrow">Home Dashboard</p>
            <h1 className="dashboard-title" style={{ color: "var(--blush)", fontSize: "clamp(1.8rem,3vw,2.8rem)" }}>City Intelligence at a Glance.</h1>
            <p className="dashboard-copy">Monitor live risk signals, planning priorities, AI forecasts, and reporting workflows from one workspace.</p>
          </div>
        </div>

        {/* AI Prediction Cards Row */}
        {renderAIPredictionCards()}

      </section>
    );
  };

  // ─── Auth Render ──────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <div className="auth-glow-orb-1" />
        <div className="auth-glow-orb-2" />

        <div className="auth-card">
          {/* Form side */}
          <div className="auth-form-side">
            <div className="brand-header" style={{ marginBottom: 28 }}>
              <div className="brand-logo-container brand-logo-container-light">
                <UrbanEyeLogo compact />
              </div>
              <span className="brand-name brand-name-dark">Urban Eye</span>
            </div>

            {alert && (
              <div className={`auth-alert auth-alert-${alert.type}`}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {alert.type === "error"
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
                <span>{alert.message}</span>
              </div>
            )}

            {authView === "signin" ? (
              <div className="fade-in">
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Enter your credentials to access the urban planning & crime intelligence node.</p>
                <form className="auth-form" onSubmit={handleSignIn}>
                  <div className="input-group">
                    <label htmlFor="signin-email">Username or Email</label>
                    <div className="input-wrapper">
                      <UserIcon />
                      <input id="signin-email" type="text" placeholder="admin or email address" value={signInUser} onChange={(e) => setSignInUser(e.target.value)} autoComplete="username" required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="signin-password">Password</label>
                    <div className="input-wrapper">
                      <LockIcon />
                      <input id="signin-password" type={showSignInPass ? "text" : "password"} placeholder="Enter password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} autoComplete="current-password" required />
                      <button type="button" className="input-icon-right" onClick={() => setShowSignInPass(!showSignInPass)} title={showSignInPass ? "Hide" : "Show"}>
                        {showSignInPass ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="auth-meta">
                    <label className="remember-me"><input type="checkbox" defaultChecked /> Remember me</label>
                    <button type="button" className="forgot-link" onClick={() => setAuthView("forgot")}>Forgot password?</button>
                  </div>
                  <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</button>
                </form>
                <div className="auth-switch">Don't have an account?{" "}<button onClick={() => setAuthView("signup")}>Sign Up Now</button></div>
                <div className="social-login">
                  <span className="social-title">Or continue with</span>
                  <div className="social-icons">
                    <button type="button" className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Facebook"><FacebookIcon /></button>
                    <button type="button" className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Twitter"><TwitterIcon /></button>
                    <button type="button" className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="Google"><GoogleIcon /></button>
                    <button type="button" className="social-btn" onClick={() => setAlert({ message: "Social login simulated.", type: "success" })} aria-label="LinkedIn"><LinkedinIcon /></button>
                  </div>
                </div>
              </div>
            ) : authView === "signup" ? (
              <div className="fade-in">
                <h2>Create Account</h2>
                <p className="auth-subtitle">Configure your dashboard role and focus region parameters.</p>
                <form className="auth-form" onSubmit={handleSignUp}>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="signup-name">Full Name</label>
                      <div className="input-wrapper"><UserIcon /><input id="signup-name" type="text" placeholder="e.g. Joy Nduta" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required /></div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="signup-email">Email Address</label>
                      <div className="input-wrapper"><EnvelopeIcon /><input id="signup-email" type="email" placeholder="name@agency.go.ke" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required /></div>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                      <label htmlFor="signup-role">Agency Role</label>
                      <div className="input-wrapper"><BriefcaseIcon /><select id="signup-role" value={signUpRole} onChange={(e) => setSignUpRole(e.target.value)}>
                        <option value="Urban Planner">Urban Planner</option><option value="Law Enforcement">Law Enforcement</option>
                        <option value="Researcher">Researcher</option><option value="Administrator">Administrator</option>
                      </select></div>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="signup-password">Password</label>
                      <div className="input-wrapper"><LockIcon />
                        <input id="signup-password" type={showSignUpPass ? "text" : "password"} placeholder="6+ characters" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />
                        <button type="button" className="input-icon-right" onClick={() => setShowSignUpPass(!showSignUpPass)} title={showSignUpPass ? "Hide" : "Show"}>{showSignUpPass ? <EyeOffIcon /> : <EyeIcon />}</button>
                      </div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="signup-confirm">Confirm Password</label>
                      <div className="input-wrapper"><LockIcon /><input id="signup-confirm" type={showSignUpPass ? "text" : "password"} placeholder="Re-enter password" value={signUpConfirmPassword} onChange={(e) => setSignUpConfirmPassword(e.target.value)} required /></div>
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading ? "Creating account..." : "Complete Registration"}</button>
                </form>
                <div className="auth-switch">Already have an account?{" "}<button type="button" onClick={() => setAuthView("signin")}>Sign In Now</button></div>
              </div>
            ) : (
              <div className="fade-in">
                <h2>Reset Password</h2>
                <p className="auth-subtitle">Confirm your account email and choose a new password.</p>
                <form className="auth-form" onSubmit={handleForgotPassword}>
                  <div className="input-group">
                    <label htmlFor="forgot-email">Email Address</label>
                    <div className="input-wrapper"><EnvelopeIcon /><input id="forgot-email" type="email" placeholder="your email address" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label htmlFor="forgot-password">New Password</label>
                      <div className="input-wrapper"><LockIcon /><input id="forgot-password" type={showSignUpPass ? "text" : "password"} placeholder="New password" value={forgotPassword} onChange={(e) => setForgotPassword(e.target.value)} required /></div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="forgot-confirm">Confirm New Password</label>
                      <div className="input-wrapper"><LockIcon /><input id="forgot-confirm" type={showSignUpPass ? "text" : "password"} placeholder="Confirm new password" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} required /></div>
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={isLoading}>{isLoading ? "Resetting..." : "Reset Password"}</button>
                </form>
                <div className="auth-switch">Remembered your password?{" "}<button type="button" onClick={() => setAuthView("signin")}>Back to Sign In</button></div>
              </div>
            )}
          </div>

          {/* Brand/Gradient side */}
          <div className="auth-brand-side">
            <div className="brand-header">
              <div className="brand-logo-container"><UrbanEyeLogo compact /></div>
              <span className="brand-name">Urban Eye</span>
            </div>
            <div className="brand-content">
              <div className="brand-content-logo"><UrbanEyeLogo /></div>
              <h3>Smart City Intelligence</h3>
              <p className="brand-desc">
                Integrated predictive GIS analytics, population growth insights, AI crime forecasting, and incident maps supporting Kenya's key administrative regions.
              </p>
              <div className="city-pills">
                <span className="city-pill">Nairobi Central Analytics</span>
                <span className="city-pill">Mombasa Port Corridor</span>
                <span className="city-pill">Eldoret Expansion</span>
              </div>
            </div>
            <div className="brand-footer">
              <div>Official Data Acquisition Pipeline</div>
              <div style={{ opacity: 0.65, marginTop: 4 }}>KNBS Census & National Police Service Integrated</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard Render ─────────────────────────────────────────────────────────

  return (
    <main className="dashboard-shell fade-in">
      <aside className="dashboard-sidebar">
        <div className="brand-header dashboard-sidebar-brand">
          <div className="brand-logo-container brand-logo-container-light"><UrbanEyeLogo compact /></div>
          <div>
            <h2 className="dashboard-brand-title">URBAN EYE</h2>
            <p>Smart planning workspace</p>
          </div>
        </div>

        <div className="dashboard-user-card">
          <span>Signed in as</span>
          <strong>{currentUser?.name}</strong>
          <small>{currentUser?.city} / {currentUser?.role}</small>
        </div>

        <nav className="dashboard-nav">
          {dashboardNavItems.map((item) => (
            <button
              key={item.id}
              className={`dashboard-nav-item ${dashboardPage === item.id ? "active" : ""}`}
              onClick={() => setDashboardPage(item.id)}
              type="button"
            >
              <span className="dashboard-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="btn-logout dashboard-logout" onClick={handleLogout}>Logout</button>
      </aside>

      <section className="dashboard-main">
        <nav className="dashboard-navbar">
          <div className="nav-brand">
            <span className="dashboard-page-label">
              {dashboardNavItems.find((item) => item.id === dashboardPage)?.label}
            </span>
          </div>
          <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select value={currentUser?.city || 'Nairobi'} style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', outline: 'none' }} onChange={(e) => {
                const newCity = e.target.value;
                const updated = { ...(currentUser || { name: '', email: '', city: newCity, role: '' }), city: newCity };
                localStorage.setItem('user', JSON.stringify(updated));
                setCurrentUser(updated);
              }}>
                {Object.keys(CITY_COORDS).map((c) => <option style={{ color: 'black' }} key={c} value={c}>{c}</option>)}
              </select>
            <span className="user-badge">{currentUser?.role}</span>
          </div>
        </nav>

        {alert && (
          <div className={`auth-alert auth-alert-${alert.type}`} style={{ margin: "0 0 20px 0" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{alert.message}</span>
          </div>
        )}

        {renderDashboardPage()}
      </section>
    </main>
  );
}
