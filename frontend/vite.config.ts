import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

// In Docker the API is reachable via the "backend" service; locally via localhost.
const API_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
});
