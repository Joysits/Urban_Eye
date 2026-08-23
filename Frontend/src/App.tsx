import React, { useState, useEffect } from "react";
import AuthScreen from "./components/auth/AuthScreen";
import Dashboard from "./components/dashboard/Dashboard";
import type { User } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Restore session on mount (check sessionStorage first, then localStorage if Remember Me was checked)
  useEffect(() => {
    const sessionUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    const sessionToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (sessionUser && sessionToken) {
      try {
        const raw = JSON.parse(sessionUser);
        const emailKey = (raw.email || raw.username || "").toLowerCase();
        
        let storedName = raw.name;
        let storedRole = raw.role || raw.profile?.agency_role;
        let storedCity = raw.city || raw.profile?.focus_city;

        // Fallback to registered profiles map if name is missing or generic
        if (!storedName || storedName === "User" || storedName === emailKey.split('@')[0]) {
          try {
            const registeredProfiles = JSON.parse(localStorage.getItem('registered_user_profiles') || '{}');
            const dbMap = JSON.parse(localStorage.getItem('registered_user_db_map') || '{}');
            const profileRecord = registeredProfiles[emailKey] || dbMap[emailKey]?.user;
            if (profileRecord?.name) storedName = profileRecord.name;
            if (profileRecord?.role) storedRole = profileRecord.role;
            if (profileRecord?.city) storedCity = profileRecord.city;
          } catch (_) {}
        }

        const user: User = {
          name: storedName || raw.username || emailKey || "User",
          email: emailKey,
          city: storedCity || "Nairobi",
          role: storedRole || "Urban Planner",
        };
        setCurrentUser(user);
        setIsAuthenticated(true);

        // Fetch latest profile from backend if session token exists
        if (sessionToken && sessionToken !== 'local_db_token') {
          fetch('/api/auth/profile/', {
            headers: { Authorization: `Token ${sessionToken}` }
          })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              const updatedName = (data.first_name || data.last_name) ? `${data.first_name || ''} ${data.last_name || ''}`.trim() : data.name || data.username || user.name;
              const updatedUser: User = {
                name: updatedName || user.name,
                email: data.email || user.email,
                city: data.profile?.focus_city || user.city,
                role: data.profile?.agency_role || user.role,
              };
              setCurrentUser(updatedUser);
              if (sessionStorage.getItem("user")) sessionStorage.setItem("user", JSON.stringify(updatedUser));
              if (localStorage.getItem("user")) localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          })
          .catch(() => {});
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAuthenticated = (user: User, _token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token && token !== 'local_db_token') {
      try {
        await fetch("/api/auth/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        });
      } catch (_) {}
    }
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <Dashboard currentUser={currentUser!} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
}
