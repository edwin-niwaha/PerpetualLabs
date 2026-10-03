import { test, expect } from "@playwright/test";

for (const width of [320, 375, 390, 768, 1440]) {
  test(`shared navigation overlays content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const main = page.locator("#main");
    const toggle = page.getByRole("button", { name: /^(Open|Close) menu$/ });
    if (width > 900) {
      await expect(toggle).toBeHidden();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeVisible();
      return;
    }
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeEnabled();
    const before = await main.boundingBox();
    await toggle.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect((await main.boundingBox())?.y).toBe(before?.y);
    const topLink = menu.getByRole("link", { name: "About", exact: true });
    await page.keyboard.press("Tab");
    await expect(topLink).toBeFocused();
    expect(
      await topLink.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(rect.x + 5, rect.y + 5));
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toHaveCount(0);
    await toggle.click();
    await page.locator("#main").click({ position: { x: 5, y: 500 } });
    await expect(menu).toHaveCount(0);
    await toggle.click();
    await menu.getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(menu).toHaveCount(0);
    await toggle.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(menu).toHaveCount(0);
    await page.setViewportSize({ width, height: 900 });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
}
import { randomUUID } from "node:crypto";
import { pythonFixture } from "./helpers/python";

async function assertNoOverflow(page: import("@playwright/test").Page) {
  await expect(page.locator("h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    )
    .toBeLessThanOrEqual(1);
}
for (const width of [320, 375, 390, 768, 1440]) {
  test(`public pages fit the viewport at ${width}px`, async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width, height: 900 });
    const routes = new Set([
      "/",
      "/about",
      "/services",
      "/projects",
      "/blog",
      "/contact",
      "/sign-in",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/not-a-page",
    ]);
    for (const catalogue of ["/services", "/projects", "/blog"]) {
      await page.goto(catalogue, { waitUntil: "domcontentloaded" });
      await assertNoOverflow(page);
      for (const href of await page
        .locator("main a[href]")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")!),
        )) {
        if (/^\/(services|projects|blog)\/[\w-]+$/.test(href)) routes.add(href);
      }
    }
    for (const path of routes) {
      await test.step(path, async () => {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await assertNoOverflow(page);
        if (width <= 768) {
          for (const shell of await page.locator("main .shell").all()) {
            if (
              await shell.evaluate(
                (element) => !!element.parentElement?.closest(".shell"),
              )
            )
              continue;
            expect((await shell.boundingBox())?.width).toBeLessThanOrEqual(
              width,
            );
          }
        }
      });
    }
  });
}

test.describe("protected responsive pages", () => {
  const username = `e2e-content-${randomUUID().slice(0, 12)}`;
  let access: string;
  test.beforeAll(() => {
    access = JSON.parse(
      pythonFixture("scripts/e2e-admin.py", [
        "create",
        username,
        `Test-${randomUUID()}!`,
      ]),
    ).access;
  });
  test.afterAll(() => {
    if (access) pythonFixture("scripts/e2e-admin.py", ["cleanup", username]);
  });
  for (const width of [320, 375, 390, 768, 1440]) {
    test(`account and editing pages fit at ${width}px`, async ({
      page,
      context,
      baseURL,
    }) => {
      test.setTimeout(300000);
      await context.addCookies([
        {
          name: "pl_access",
          value: access,
          url: baseURL!,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await page.setViewportSize({ width, height: 900 });
      const routes = [
        "/account",
        "/account/change-password",
        "/account/journal",
        "/account/journal?edit=new",
      ];
      await page.goto("/account/content", { waitUntil: "domcontentloaded" });
      routes.push(
        ...(await page
          .getByRole("navigation", { name: "Content categories" })
          .locator("a")
          .evaluateAll((links) =>
            links
              .map((link) => link.getAttribute("href")!)
              .filter((href) => href.startsWith("/account/content")),
          )),
      );
      for (const path of [...new Set(routes)]) {
        await test.step(path, async () => {
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await expect(page).not.toHaveURL(/\/sign-in/);
          await assertNoOverflow(page);
          for (const record of await page.locator("main details").all()) {
            await record.evaluate((el) => {
              (el as HTMLDetailsElement).open = true;
            });
          }
          await assertNoOverflow(page);
        });
      }
    });
  }
});
