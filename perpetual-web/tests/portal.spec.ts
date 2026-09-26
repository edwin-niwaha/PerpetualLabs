import { test, expect } from "@playwright/test";
import { pythonFixture } from "./helpers/python";

let account: { username: string; password: string };
test.beforeAll(() => {
  account = JSON.parse(pythonFixture("scripts/e2e-portal.py", ["create"]));
});
test.afterAll(() => {
  if (account)
    pythonFixture("scripts/e2e-portal.py", ["cleanup", account.username]);
});

test("clients can sign in, read notifications, and inspect their email history", async ({
  page,
}, info) => {
  await page.goto("/sign-in");
  await page.getByLabel("Username", { exact: true }).fill(account.username);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your private project update" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mark unread", exact: true }),
  ).toBeVisible();
  await page
    .locator("summary")
    .filter({ hasText: "Portal test email" })
    .click();
  await expect(
    page.getByText("A private email copy.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Needs attention", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Services & what’s next" }),
  ).toBeVisible();
  await expect(
    page.getByText("Coming soon", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Manage website content" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/client-portal-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in$/);
});
