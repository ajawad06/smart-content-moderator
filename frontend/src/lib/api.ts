import axios from 'axios';

const TOKEN_KEY = 'acm_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// All requests go through /api; Vite proxies to the backend in dev, nginx proxies in prod.
export const api = axios.create({ baseURL: '/api' });

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the token so the app falls back to the login screen.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an axios error. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; details?: unknown } | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  db: string;
  provider: string;
  timestamp: string;
}
