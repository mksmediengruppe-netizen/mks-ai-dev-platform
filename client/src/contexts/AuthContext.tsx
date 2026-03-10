/* ============================================================
   AuthContext — JWT-based auth with role support
   Roles: admin, operator, viewer
   ============================================================ */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "admin" | "operator" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// API base URL — points to chat-api
import { API_BASE } from "../lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("platform_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem("platform_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.detail || "Invalid credentials" };
      }

      const data = await res.json();
      const token = data.access_token;

      // Use user info from response body first, then try JWT decode
      let role: UserRole = (data.user?.role as UserRole) || "viewer";
      let name = data.user?.name || email.split("@")[0];
      let userId = String(data.user?.id || "user");

      try {
        // URL-safe base64 decode for JWT payload
        const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(b64));
        role = (payload.role as UserRole) || role;
        name = payload.name || payload.email?.split("@")[0] || name;
        userId = String(payload.sub || userId);
      } catch {
        // fallback to data.user values already set
      }

      const newUser: User = { id: userId, email, name, role, token };
      setUser(newUser);
      localStorage.setItem("platform_user", JSON.stringify(newUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: "Connection error. Check API availability." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("platform_user");
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      const hierarchy: Record<UserRole, number> = { admin: 3, operator: 2, viewer: 1 };
      return hierarchy[user.role] >= hierarchy[role];
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
