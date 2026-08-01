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
        const user: User = {
          name: raw.name || raw.username || raw.email || "User",
          email: raw.email || raw.username || "",
          city: raw.city || raw.profile?.focus_city || "Nairobi",
          role: raw.role || raw.profile?.agency_role || "Urban Planner",
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
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
