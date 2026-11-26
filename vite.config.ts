import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [react(), { name: 'cic-offline-manifest', apply: 'build', closeBundle() {
    const files = readdirSync('dist', {recursive:true}).map(String).map(f=>f.replaceAll('\\','/')).filter(f=>/\.(html|js|css|svg|png|ico|webmanifest)$/.test(f) && f!=='sw.js').sort();
    const hash=createHash('sha256'); for(const f of files) hash.update(readFileSync(`dist/${f}`));
    const worker=readFileSync('dist/sw.js','utf8').replace('chemo-in-comfort-v4',`chemo-in-comfort-${hash.digest('hex').slice(0,16)}`).replace("['./', './index.html']",JSON.stringify(['./',...files.map(f=>`./${f}`)]));
    writeFileSync('dist/sw.js',worker);
  }}],

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