import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run start", env: { DISABLE_RATE_LIMIT: "true", PAYMENTS_ENABLED: "true", PAYSTACK_SECRET_KEY: "sk_test_mock", PAYSTACK_BASE_URL: "http://127.0.0.1:4010", AI_ASSISTANT_ENABLED: "true", ANTHROPIC_API_KEY: "test-ai-key", ANTHROPIC_BASE_URL: "http://127.0.0.1:4010" }, url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
