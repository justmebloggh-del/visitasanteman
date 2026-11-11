import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  globalSetup: "./tests/e2e/global-cleanup.ts",
  globalTeardown: "./tests/e2e/global-cleanup.ts",
  // Every test starts with cookie consent already given (rejected), so the consent banner does not sit over the page; consent.spec.ts starts clean.
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure",
    storageState: { origins: [], cookies: [{ name: "vasa_consent", value: encodeURIComponent(JSON.stringify({ v: 1, ts: Date.now(), functional: false, analytics: false, advertising: false })), domain: "localhost", path: "/", expires: Math.floor(Date.now() / 1000) + 86400 * 300, httpOnly: false, secure: false, sameSite: "Lax" }] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run start", env: { DISABLE_RATE_LIMIT: "true", PAYMENTS_ENABLED: "true", PAYSTACK_SECRET_KEY: "sk_test_mock", PAYSTACK_BASE_URL: "http://127.0.0.1:4010", AI_ASSISTANT_ENABLED: "true", ANTHROPIC_API_KEY: "test-ai-key", ANTHROPIC_BASE_URL: "http://127.0.0.1:4010", RESEND_API_KEY: "re_test_mock", EMAIL_FROM: "VisitAsanteman <test@example.com>", RESEND_BASE_URL: "http://127.0.0.1:4011" }, url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
