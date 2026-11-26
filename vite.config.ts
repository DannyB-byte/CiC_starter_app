import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/CiC_starter_app/' : '/',
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    watch: {
      ignored: [
        '**/playwright-report/**',
        '**/test-results/**',
        '**/coverage/**',
        '**/.qa-backups/**',
        '**/dist/**',
      ],
    },
  },
});