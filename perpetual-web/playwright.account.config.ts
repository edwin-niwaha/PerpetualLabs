import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import base from "./playwright.config";

const executable =
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python";
const python =
  process.env.PLAYWRIGHT_PYTHON ||
  [".venv", ".venv-web"]
    .map((name) => resolve("../perpetual-api", name, executable))
    .find(existsSync);
if (!python)
  throw new Error(
    "Create the API virtual environment or set PLAYWRIGHT_PYTHON.",
  );
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "**/account-management.spec.ts",
  timeout: 180000,
  use: { ...base.use, baseURL: "http://localhost:3002" },
  outputDir: "test-results-account",
  webServer: [
    {
      command: `"${python}" scripts/e2e-account.py init && "${python}" scripts/e2e-account.py serve`,
      url: "http://127.0.0.1:8002/health/",
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --port 3002",
      url: "http://localhost:3002/sign-in",
      timeout: 180000,
      reuseExistingServer: !process.env.CI,
      env: {
        API_BASE_URL: "http://127.0.0.1:8002",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3002",
        NEXT_DIST_DIR: ".next-account-e2e",
      },
    },
  ],
});
