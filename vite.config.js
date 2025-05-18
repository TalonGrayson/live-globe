import { defineConfig } from 'vite';
import path from 'path';

// This file is no longer used in the Remix version of the application
// It is kept only for reference

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app')
    }
  }
}); 