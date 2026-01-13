import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiPost } from "./api";

type AuthState = {
  isAuthenticated: boolean;
  email: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem("email"));

  const isAuthenticated = !!token;

  const login = async (email: string, password: string) => {
    const resp = await apiPost<{ token: string; email: string }>("/api/auth/login", { email, password });
    localStorage.setItem("token", resp.token);
    localStorage.setItem("email", resp.email);
    setToken(resp.token);
    setEmail(resp.email);
  };

  const register = async (email: string, password: string) => {
    const resp = await apiPost<{ token: string; email: string }>("/api/auth/register", { email, password });
    localStorage.setItem("token", resp.token);
    localStorage.setItem("email", resp.email);
    setToken(resp.token);
    setEmail(resp.email);
  };

  const logout = () => {
    // Wylogowanie = koniec sesji, NIE kasujemy postępu w DB.
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
    setEmail(null);
  };

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated, email, token, login, register, logout }),
    [isAuthenticated, email, token]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
