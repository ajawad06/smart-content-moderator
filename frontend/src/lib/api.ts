import axios from 'axios';

// All requests go through /api; Vite proxies to the backend in dev, nginx proxies in prod.
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface HealthResponse {
  status: string;
  uptime: number;
  db: string;
  provider: string;
  timestamp: string;
}
