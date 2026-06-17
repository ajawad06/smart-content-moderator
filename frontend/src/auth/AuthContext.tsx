import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore } from '../lib/api';
import type { AuthResponse, User } from '../lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On boot, if we have a token, restore the session via /auth/me.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(path: string, email: string, password: string) {
    const res = await api.post<AuthResponse>(path, { email, password });
    tokenStore.set(res.data.token);
    setUser(res.data.user);
  }

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: (email, password) => authenticate('/auth/login', email, password),
      register: (email, password) => authenticate('/auth/register', email, password),
      logout: () => {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
