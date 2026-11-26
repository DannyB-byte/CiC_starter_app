import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/e2e/**/*.spec.ts", "**/diary.spec.ts"],
  workers: 2,
  retries: 0,
  timeout: 30000,
  outputDir: "test-results/artifacts",

  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }]
  ],

  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },

  webServer: {
    command: "npm run dev:app",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  },

  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 13"] }
    },
    {
      name: "small-mobile",
      use: {
        ...devices["iPhone SE"],
        viewport: { width: 320, height: 568 }
      }
    },
    {
      name: "tablet",
      use: { ...devices["iPad Mini"] }
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "desktop-firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "desktop-safari",
      use: { ...devices["Desktop Safari"] }
    }
  ]
});