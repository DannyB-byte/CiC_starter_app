import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,

  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:4173',
  },

  outputDir: 'test-results/production/artifacts',

  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report/production',
      open: 'never',
    }],
    ['json', {
      outputFile: 'test-results/production/results.json',
    }],
  ],

  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 60000,
  },
});