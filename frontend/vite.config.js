import process from 'node:process';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `vite preview` serves the production build with the same security headers as vercel.json, so the
// CSP is exercised locally before deploy. The local API origin (VITE_API_URL, usually plain
// http://localhost) is added to connect-src for preview only.
const vercelHeaders = () => {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
  const entries = config.headers?.[0]?.headers || [];
  return Object.fromEntries(entries.map(({ key, value }) => [key, value]));
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:3000';
  const apiOrigin = new URL(apiUrl).origin;

  const previewHeaders = vercelHeaders();
  if (previewHeaders['Content-Security-Policy']) {
    previewHeaders['Content-Security-Policy'] = previewHeaders['Content-Security-Policy'].replace(
      "connect-src 'self' https:",
      `connect-src 'self' https: ${apiOrigin}`
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}'],
    },
    preview: {
      headers: previewHeaders,
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Note: Monaco is deliberately NOT a manual chunk. Rolldown hoists shared helpers into
              // the first manual chunk that needs them, which made every page preload the 2.8 MB
              // editor. Left alone, Monaco lands in the lazy workspace chunk.
              if (id.includes('react/') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
                return 'vendor-redux';
              }
              if (id.includes('lucide-react') || id.includes('axios')) {
                return 'vendor-ui';
              }
            }
          }
        }
      }
    }
  };
});
