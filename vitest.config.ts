import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    execArgv: Number(process.versions.node.split(".")[0]) >= 24
      ? ["--no-experimental-webstorage"] : [],
    globals: true,
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "src/**/*.{test,spec}.{ts,tsx,js,jsx}"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"]
    }
  }
});