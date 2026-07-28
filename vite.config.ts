import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/storyweaver/',
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
      // Browser calls /storyweaver/api/*; shim still listens on /api/*
      '/storyweaver/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/storyweaver/, '')
      }
    }
  }
});
