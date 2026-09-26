import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/account-management.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  expect: { timeout: Number(process.env.PLAYWRIGHT_EXPECT_TIMEOUT || 35000) },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
