import React, { useState, useEffect } from "react";
import AuthScreen from "./components/auth/AuthScreen";
import Dashboard from "./components/dashboard/Dashboard";
import type { User } from "./types";

// Global 401 handler — auto logout if token expires
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url = typeof args[0] === "string" ? args[0] : "";
    // Only force logout on API calls, not auth endpoints
    if (url.includes("/api/") && !url.includes("/api/auth/")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
  }
  return response;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Restore session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      const raw = JSON.parse(savedUser);
      // Normalize old session format that may lack name/city/role
      const user: User = {
        name: raw.name || raw.username || raw.email || "User",
        email: raw.email || raw.username || "",
        city: raw.city || raw.profile?.focus_city || "Nairobi",
        role: raw.role || raw.profile?.agency_role || "Urban Planner",
      };
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticated = (user: User, _token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch("/api/auth/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        });
      } catch (_) {}
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <Dashboard currentUser={currentUser!} onLogout={handleLogout} />;
}
