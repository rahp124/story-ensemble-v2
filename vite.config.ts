import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  preview: {
    port: 5173
  },
  server: {
    proxy: {
      // Forward /api/* to the local API shim (scripts/dev-server.mjs on port 3000), started by npm run dev
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
