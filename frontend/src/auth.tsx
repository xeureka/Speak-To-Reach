import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from './api';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

type AuthContext = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
};

const AuthCtx = createContext<AuthContext>({} as AuthContext);

const TOKEN_KEY = 'speak-to-reach-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Unauthorized'); return r.json() as Promise<User>; })
      .then(setUser)
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({ message: 'Login failed' })); throw new Error(err.message); }
    const data = await res.json() as { token: string; user: User };
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
