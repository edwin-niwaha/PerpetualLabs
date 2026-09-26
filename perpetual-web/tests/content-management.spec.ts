import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { pythonFixture } from "./helpers/python";

test("staff manage portraits entirely within the website", async ({
  page,
  context,
}, info) => {
  const username = `e2e-content-${randomUUID().slice(0, 12)}`;
  const data = JSON.parse(
    pythonFixture("scripts/e2e-admin.py", [
      "create",
      username,
      `Test-${randomUUID()}!`,
    ]),
  );
  try {
    await context.addCookies([
      {
        name: "pl_access",
        value: data.access,
        url: "http://localhost:3000",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/account/content?tab=team");
    await expect(
      page.getByRole("heading", { name: "People of Perpetual" }),
    ).toBeVisible();
    await expect(page.locator('a[href*="/admin/"]')).toHaveCount(0);
    await page.getByText("+ Add new item", { exact: true }).click();
    const create = page
      .locator("details")
      .filter({ has: page.getByText("+ Add new item", { exact: true }) });
    await create.getByLabel("Full name", { exact: true }).fill(username);
    const picture = {
      name: "portrait.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAALElEQVR4nGNkYPjPQC5gIlsnw6hmkgET6VoQYFQziYCJVA3IYFQziYCiAAMAIJ4BJwS5UI4AAAAASUVORK5CYII=",
        "base64",
      ),
    };
    await create.getByLabel("Portrait", { exact: true }).setInputFiles(picture);
    await create.getByRole("button", { name: "Create item" }).click();
    await expect(create.getByRole("status")).toContainText("Content created");
    const record = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: username }) });
    await record.locator("summary").click();
    await expect(record.getByAltText("Current image")).toBeVisible();
    await expect
      .poll(() =>
        record
          .getByAltText("Current image")
          .evaluate((el) => (el as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await record.getByLabel("Portrait", { exact: true }).setInputFiles(picture);
    await record.getByRole("button", { name: "Save changes" }).click();
    await expect(record.getByRole("status")).toContainText("Changes saved");
    await page.screenshot({
      path: `test-results/team-management-${info.project.name}.png`,
      fullPage: true,
    });
    await record.getByLabel("Remove current picture").check();
    await record.getByRole("button", { name: "Save changes" }).click();
    await expect(record.getByAltText("Current image")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/about");
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    await page.goto("/account/content?tab=team");
    await record.locator("summary").click();
    await record
      .getByRole("button", { name: "Delete item", exact: true })
      .click();
    await record.getByRole("button", { name: "Confirm deletion" }).click();
    await expect(record).toHaveCount(0);
    for (const tab of ["services", "testimonials", "products", "visuals"]) {
      await page.goto(`/account/content?tab=${tab}`);
      await expect(
        page.getByText("Content could not be loaded", { exact: false }),
      ).toHaveCount(0);
      await expect(page.locator('a[href*="/admin/"]')).toHaveCount(0);
    }
  } finally {
    pythonFixture("scripts/e2e-admin.py", ["cleanup", username]);
  }
});
