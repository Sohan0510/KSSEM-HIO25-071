import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);
const LS_KEY = "ks.auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 new state

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.token && parsed.id && parsed.role) {
          parsed.role = String(parsed.role).toLowerCase();
          setUser(parsed);
        } else {
          localStorage.removeItem(LS_KEY);
        }
      }
    } catch (e) {
      console.error("Auth load error", e);
      localStorage.removeItem(LS_KEY);
    } finally {
      setLoading(false); // 👈 only now auth is ready
    }
  }, []);

  const login = (payload) => {
    if (!payload?.token || !payload?.id || !payload?.role) {
      console.error("Auth: Invalid login payload", payload);
      return;
    }
    const normalized = {
      ...payload,
      role: payload.role.toLowerCase(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(normalized));
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function getToken() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY))?.token || "";
  } catch {
    return "";
  }
}
