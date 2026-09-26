import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { pythonFixture } from "./helpers/python";

// Isolated OAuth boundary fixture. It never substitutes Google on the real app server.
// The API suite separately verifies real RSA signatures, issuer, audience and nonce.
test("Google redirect exchanges a browser-bound code for private portal cookies", async ({
  browser,
}) => {
  test.skip(
    process.env.RUN_SOCIAL_FIXTURE !== "1",
    "Explicit isolated OAuth fixture run only",
  );
  test.setTimeout(240000);
  const username = `e2e-journal-${randomUUID().slice(0, 10)}`;
  const tokens = JSON.parse(
    pythonFixture("scripts/e2e-journal.py", [
      "create",
      username,
      `Test-${randomUUID()}!`,
    ]),
  );
  const state = "s".repeat(43);
  let challenge = "",
    consumed = false;
  let wrongEnvironment = false;
  let next: ChildProcess | undefined;
  let server: Server | undefined;
  const origin = "http://localhost:3105";
  try {
    server = createServer(async (req, res) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString();
        res.setHeader("Content-Type", "application/json");
        if (req.url === "/api/auth/social/google/")
          res.end(
            JSON.stringify({
              enabled: true,
              redirect_uri: `${origin}/auth/google/callback`,
            }),
          );
        else if (req.url === "/api/auth/social/google/start/") {
          challenge = JSON.parse(body).challenge;
          res.end(
            JSON.stringify({
              url: `https://accounts.google.com/o/oauth2/v2/auth?state=${state}&redirect_uri=${encodeURIComponent(wrongEnvironment ? "https://perpetuallabs.tech/auth/google/callback" : `${origin}/auth/google/callback`)}`,
            }),
          );
        } else if (req.url === "/api/auth/social/google/complete/") {
          const input = JSON.parse(body);
          if (
            consumed ||
            input.state !== state ||
            input.code !== "test-provider-code" ||
            createHash("sha256").update(input.verifier).digest("hex") !==
              challenge
          ) {
            res.statusCode = 400;
            res.end(JSON.stringify({ detail: "Invalid flow" }));
          } else {
            consumed = true;
            res.end(JSON.stringify({ ...tokens, is_staff: true }));
          }
        } else {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (req.headers.authorization)
            headers.Authorization = req.headers.authorization;
          const upstream = await fetch(`http://127.0.0.1:8000${req.url}`, {
            method: req.method,
            headers,
            body: body || undefined,
          });
          res.statusCode = upstream.status;
          res.end(await upstream.text());
        }
      } catch {
        res.statusCode = 500;
        res.end("{}");
      }
    });
    await new Promise<void>((resolve) =>
      server!.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing fixture address");
    next = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "dev", "--port", "3105"],
      {
        env: {
          ...process.env,
          API_BASE_URL: `http://127.0.0.1:${address.port}`,
          NEXT_PUBLIC_SITE_URL: origin,
          NEXT_DIST_DIR: ".next-social-e2e",
        },
        stdio: "ignore",
        windowsHide: true,
      },
    );
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(`${origin}/sign-in`)).status;
          } catch {
            return 0;
          }
        },
        { timeout: 150000, intervals: [1000, 2000] },
      )
      .toBe(200);
    const context = await browser.newContext();
    try {
      await context.route("https://accounts.google.com/**", (route) =>
        route.abort(),
      );
      const page = await context.newPage();
      await page.goto(`${origin}/sign-in`);
      await expect(
        page.getByRole("link", { name: "Continue with Google" }),
      ).toHaveAttribute("href", "/auth/google/start");
      const start = await context.request.get(`${origin}/auth/google/start`, {
        maxRedirects: 0,
      });
      expect(start.status()).toBe(307);
      expect(new URL(start.headers().location).origin).toBe(
        "https://accounts.google.com",
      );
      await page.goto(
        `${origin}/auth/google/callback?state=${state}&code=test-provider-code`,
      );
      await expect(page).toHaveURL(`${origin}/account/content`, {
        timeout: 60000,
      });
      const cookies = await context.cookies();
      for (const name of ["pl_access", "pl_refresh"]) {
        const cookie = cookies.find((c) => c.name === name);
        expect(cookie?.httpOnly).toBe(true);
        expect(cookie?.sameSite).toBe("Lax");
      }
      expect(cookies.some((c) => c.name === "pl_google_verifier")).toBe(false);
      expect(await page.evaluate(() => document.cookie)).not.toContain(
        "pl_access",
      );
      expect(consumed).toBe(true);
      wrongEnvironment = true;
      const mismatch = await context.request.get(
        `${origin}/auth/google/start`,
        { maxRedirects: 0 },
      );
      expect(mismatch.headers().location).toBe(
        `${origin}/sign-in?social_error=unavailable`,
      );
      wrongEnvironment = false;
      await context.clearCookies();
      await page.goto(
        `${origin}/auth/google/callback?state=${state}&code=test-provider-code`,
      );
      await expect(page).toHaveURL(/social_error=failed/);
      expect(
        (await context.cookies()).some((c) => c.name === "pl_access"),
      ).toBe(false);
    } finally {
      await context.close();
    }
  } finally {
    if (next?.pid) {
      if (process.platform === "win32") {
        try {
          execFileSync("taskkill", ["/PID", String(next.pid), "/T", "/F"], {
            stdio: "ignore",
          });
        } catch {}
      } else next.kill();
    }
    server?.closeAllConnections();
    server?.close();
    pythonFixture("scripts/e2e-journal.py", ["cleanup", username]);
  }
});
