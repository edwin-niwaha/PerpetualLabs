import { test, expect } from "@playwright/test";
import { pythonFixture } from "./helpers/python";
function fixture(action: string) {
  pythonFixture("scripts/e2e-content.py", [action]);
}
test.beforeAll(() => fixture("seed"));
test.afterAll(() => fixture("cleanup"));
test("published API records render on lists and detail pages", async ({
  page,
}) => {
  for (const [section, title, detail] of [
    [
      "services",
      "Integration test service",
      "Service details from the real local Django API.",
    ],
    ["projects", "Integration test project", "Project detail from Django."],
    ["blog", "Integration test article", "Article content from Django."],
  ]) {
    await page.goto("/" + section);
    await page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .click();
    await expect(page).toHaveURL(`/${section}/e2e-integration-fixture`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".prose")).toContainText(detail);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(await page.evaluate(() => "injected" in window)).toBe(false);
  await page.goto("/blog/unpublished-or-missing");
  await expect(
    page.getByRole("heading", { name: "A little off course." }),
  ).toBeVisible();
});
