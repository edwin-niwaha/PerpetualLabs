import { test, expect } from "@playwright/test";

test("client portal is discoverable without exposing staff administration", async ({
  page,
}, info) => {
  await page.goto("/");
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: "Client portal" }),
    ).toBeVisible();
  } else {
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Client portal" }),
    ).toBeVisible();
  }
  await expect(
    page.locator(
      'header a[href="/account/content"], header a[href*="/admin/"]',
    ),
  ).toHaveCount(0);
});

test("client sign-in is reachable and excluded from indexing", async ({
  page,
}) => {
  const response = await page.goto("/sign-in");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create an account" }),
  ).toBeVisible();
  await page.goto("/account/content");
  await expect(page).toHaveURL(/\/sign-in$/);
});
