import { test, expect } from "@playwright/test";
import { apiUrl } from "../src/lib/api-url";

test("API paths cannot redirect credentials to another origin", () => {
  const base = "https://api.example.com";
  expect(apiUrl("/api/auth/profile/", base).href).toBe(
    base + "/api/auth/profile/",
  );
  for (const path of [
    "https://attacker.example/api/",
    "//attacker.example/api/",
    "/api/../../admin/",
    "/api/\\attacker.example",
  ]) {
    expect(() => apiUrl(path, base)).toThrow();
  }
  for (const origin of [
    "https://user:pass@api.example.com",
    "file:///tmp/",
    "https://api.example.com/path",
  ]) {
    expect(() => apiUrl("/api/auth/profile/", origin)).toThrow();
  }
});

test("pages use unique CSP nonces and reject injected scripts", async ({
  page,
}) => {
  const first = await page.goto("/sign-in");
  const csp = first?.headers()["content-security-policy"] || "";
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).toContain("frame-ancestors 'none'");
  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
  expect(nonce).toBeTruthy();
  const nonces = await page
    .locator("script[nonce]")
    .evaluateAll((scripts) =>
      scripts.map((script) => (script as HTMLScriptElement).nonce),
    );
  expect(nonces.length).toBeGreaterThan(0);
  expect(nonces.every((value) => value === nonce)).toBe(true);
  // Inject markup into the HTML response, as an HTML injection would. Code
  // executed through page.evaluate already has trusted script execution rights.
  await page.route("**/sign-in", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "</head>",
      "<script>document.documentElement.dataset.injected = 'yes'</script></head>",
    );
    await route.fulfill({ response, body });
  });
  const second = await page.reload();
  expect(await page.locator("html").getAttribute("data-injected")).toBeNull();
  expect(second?.headers()["content-security-policy"]).not.toContain(
    `'nonce-${nonce}'`,
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

test("web rejects missing and foreign mutation origins", async ({
  request,
}) => {
  const attempts: Record<string, string>[] = [
    {},
    {
      origin: "https://attacker.example",
      "x-forwarded-host": "attacker.example",
    },
  ];
  for (const headers of attempts) {
    const response = await request.post("/sign-in", {
      headers,
      form: { username: "test" },
    });
    expect(response.status()).toBe(403);
  }
});

test("same-origin sign-in still reaches its server action", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page
    .getByLabel("Username", { exact: true })
    .fill("security-check-nonexistent-user");
  await page
    .getByLabel("Password", { exact: true })
    .fill("invalid-security-check-password");
  const response = page.waitForResponse(
    (value) =>
      value.request().method() === "POST" && value.url().endsWith("/sign-in"),
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  expect((await response).status()).toBe(200);
  // Invalid credentials or an unavailable test API must produce a controlled error.
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});
