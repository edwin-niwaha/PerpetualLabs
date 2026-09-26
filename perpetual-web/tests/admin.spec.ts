import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { pythonFixture } from "./helpers/python";
const fixture = (args: string[]) => pythonFixture("scripts/e2e-admin.py", args);

test("galaxy sign-in is accessible, responsive and supports motion controls", async ({
  page,
}, info) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Welcome back.",
  );
  await expect(page.locator(".galaxy-auth .cosmos-galaxy")).toBeVisible();
  await expect(page.locator(".cosmos-galaxy")).toHaveJSProperty(
    "complete",
    true,
  );
  expect(
    await page
      .locator(".cosmos-galaxy")
      .evaluate((el) => (el as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(page.locator(".galaxy-auth")).toHaveClass(/cosmos-paused/);
  await page.getByRole("button", { name: "Resume animation" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `test-results/sign-in-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".planet-track")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("content dashboard requires a session", async ({ page }) => {
  await page.goto("/account/content");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("staff can sign in, create, publish and unpublish content", async ({
  page,
}, info) => {
  const username = `e2e-content-${randomUUID().slice(0, 12)}`;
  const password = `Test-${randomUUID()}!`;
  fixture(["create", username, password]);
  try {
    await page.goto("/sign-in");
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/account\/content$/);
    await expect(page.getByLabel("Contact email")).toHaveValue(
      "hello.perpetuallabs@gmail.com",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Administrator workspace",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/content-settings-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("link", { name: "FAQs", exact: true }).click();
    await page.getByText("+ Add a question", { exact: true }).click();
    const create = page
      .locator("details")
      .filter({ has: page.getByText("+ Add a question", { exact: true }) });
    await create
      .getByLabel("Question", { exact: true })
      .fill(`${username} question`);
    await create
      .getByLabel("Answer", { exact: true })
      .fill("A temporary answer to verify publishing.");
    await create.getByLabel("Published on the website").check();
    await create.getByRole("button", { name: "Create item" }).click();
    await expect(create.getByRole("status")).toContainText("Content created");
    await page.goto("/");
    await expect(
      page.getByText(`${username} question`, { exact: true }),
    ).toBeVisible();
    await page.goto("/account/content?tab=faqs");
    const record = page.locator("details").filter({
      has: page.locator("summary", { hasText: `${username} question` }),
    });
    await record.locator("summary").click();
    await record.getByLabel("Published on the website").uncheck();
    await record.getByRole("button", { name: "Save changes" }).click();
    await expect(record.getByRole("status")).toContainText("Changes saved");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: `test-results/content-admin-${info.project.name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("/");
    await expect(
      page.getByText(`${username} question`, { exact: true }),
    ).toHaveCount(0);
  } finally {
    fixture(["cleanup", username]);
  }
});
