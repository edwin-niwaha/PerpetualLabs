import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { pythonFixture } from "./helpers/python";

test("readers can search, paginate, read and share journal entries", async ({
  page,
}, info) => {
  const username = `e2e-journal-${randomUUID().slice(0, 10)}`;
  const data = JSON.parse(
    pythonFixture("scripts/e2e-journal.py", [
      "create",
      username,
      `Test-${randomUUID()}!`,
    ]),
  );
  try {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Ideas in progress.",
    );
    await page.getByRole("button", { name: data.topic, exact: true }).click();
    await expect(page.locator(".journal-card")).toHaveCount(6);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await expect(page.locator(".journal-card")).toHaveCount(1);
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("#entries-heading")).toBeFocused();
    await page.reload();
    await expect(page.locator(".journal-card")).toHaveCount(1);
    await page.getByLabel("Sort entries").selectOption("oldest");
    await expect(page.locator(".journal-card")).toHaveCount(6);
    await expect(page).not.toHaveURL(/page=2/);
    await page.getByLabel("Search journal").fill("Small improvements");
    await expect(page.locator(".journal-card")).toHaveCount(1);
    await expect(page).toHaveURL(/q=Small/);
    await page.reload();
    await expect(page.getByLabel("Search journal")).toHaveValue(
      "Small improvements",
    );
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    await expect(page.getByLabel("Search journal")).toBeFocused();
    await expect(page.locator(".journal-card")).toHaveCount(6);
    await page.getByLabel("Search journal").fill("missing phrase 123");
    await expect(
      page.getByRole("heading", { name: "No entries found" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
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
    await page.screenshot({
      path: `test-results/journal-${info.project.name}.png`,
      fullPage: true,
    });
    await page.getByLabel("Search journal").fill("Small improvements");
    await page.locator(".journal-card h3 a").click();
    await expect(
      page.getByRole("heading", { name: "A little progress" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => Reflect.get(window, "journalInjected")),
    ).toBeUndefined();
    await expect(page.locator(".journal-prose script")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/journal-reader-${info.project.name}.png`,
      fullPage: true,
    });
  } finally {
    pythonFixture("scripts/e2e-journal.py", ["cleanup", username]);
  }
});

test("staff can write, preview, publish and unpublish a daily entry", async ({
  page,
  context,
}, info) => {
  const username = `e2e-journal-${randomUUID().slice(0, 10)}`;
  const password = `Test-${randomUUID()}!`;
  pythonFixture("scripts/e2e-journal.py", ["create", username, password]);
  try {
    await page.goto("/sign-in");
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/account\/content$/);
    await page.getByRole("link", { name: "Journal & daily posts" }).click();
    await page.getByRole("link", { name: "+ Write an entry" }).click();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator("#journal-title")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator("#journal-title")).toBeFocused();
    const title = `Daily note ${username}`;
    await page.getByLabel("Entry title", { exact: true }).fill(title);
    await page
      .getByLabel("Short introduction")
      .fill("A short daily reflection.");
    await page
      .getByLabel("Entry content")
      .fill("## Today’s lesson\n\nA useful **idea** to share.");
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Today’s lesson" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    await expect(page).toHaveURL(/edit=\d+/);
    const savedUrl = page.url();
    await expect(page.getByLabel("Entry title", { exact: true })).toHaveValue(
      title,
    );
    await page
      .getByRole("button", { name: "Publish entry", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Entry published");
    expect(page.url()).toBe(savedUrl);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    await page.getByRole("link", { name: "Return to your entries" }).click();
    await page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .click();
    await page.screenshot({
      path: `test-results/journal-editor-${info.project.name}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Publish entry", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Entry published");
    const publicPage = await context.newPage();
    await publicPage.goto("/blog");
    await publicPage.getByLabel("Search journal").fill(title);
    await expect(publicPage.locator(".journal-card")).toHaveCount(1);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    await publicPage.reload();
    await publicPage.getByLabel("Search journal").fill(title);
    await expect(
      publicPage.getByRole("heading", { name: "No entries found" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    pythonFixture("scripts/e2e-journal.py", ["cleanup", username]);
  }
});

test("Google cancellation and callbacks without browser binding fail safely", async ({
  page,
  context,
}) => {
  await page.goto("/auth/google/callback?error=access_denied");
  await expect(page).toHaveURL(/social_error=cancelled/);
  await expect(page.locator(".social-login [role=alert]")).toContainText(
    "cancelled",
  );
  await page.goto(`/auth/google/callback?code=fake&state=${"a".repeat(43)}`);
  await expect(page).toHaveURL(/social_error=failed/);
  expect(
    (await context.cookies()).filter(
      (c) => c.name === "pl_access" || c.name === "pl_refresh",
    ),
  ).toHaveLength(0);
});

test("editor validates covers and recovers from upload errors and timeouts", async ({
  page,
  context,
  baseURL,
}) => {
  const username = `e2e-journal-${randomUUID().slice(0, 10)}`;
  const tokens = JSON.parse(
    pythonFixture("scripts/e2e-journal.py", [
      "create",
      username,
      `Test-${randomUUID()}!`,
    ]),
  );
  try {
    await context.addCookies([
      { name: "pl_access", value: tokens.access, url: baseURL! },
      { name: "pl_refresh", value: tokens.refresh, url: baseURL! },
    ]);
    await page.goto("/account/journal?edit=new");
    await page
      .getByLabel("Entry title", { exact: true })
      .fill("A recoverable entry");
    await page.getByLabel("Short introduction").fill("Keep this introduction.");
    await page
      .getByLabel("Entry content")
      .fill("Keep this writing even if saving fails.");
    await page.locator('[name="cover_image"]').setInputFiles({
      name: "invalid.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator("#journal-cover_image-error")).toContainText(
      "JPEG, PNG or WebP",
    );
    await page.getByRole("button", { name: "Clear selected file" }).click();
    await page.route("**/api/journal", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "The cover could not be uploaded.",
          errors: { cover_image: ["Try a smaller image."] },
        }),
      }),
    );
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator("#journal-cover_image-error")).toContainText(
      "Try a smaller image",
    );
    await expect(page.getByLabel("Entry title", { exact: true })).toHaveValue(
      "A recoverable entry",
    );
    await page.unroute("**/api/journal");
    await page.clock.install();
    await page.route("**/api/journal", () => {});
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Saving draft");
    await page.clock.fastForward(45001);
    await expect(
      page.locator(".journal-composer").getByRole("alert"),
    ).toContainText("save could not be confirmed");
    await expect(
      page.getByRole("button", { name: "Save draft", exact: true }),
    ).toBeEnabled();
    await expect(page.getByLabel("Entry content")).toHaveValue(
      "Keep this writing even if saving fails.",
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include(".journal-composer")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  } finally {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    pythonFixture("scripts/e2e-journal.py", ["cleanup", username]);
  }
});

test("journal save requires a same-origin authenticated staff session", async ({
  request,
  baseURL,
}) => {
  const response = await request.post("/api/journal", {
    headers: { Origin: new URL(baseURL!).origin },
    multipart: { title: "Private", intent: "draft" },
  });
  expect(response.status()).toBe(401);
  const crossOrigin = await request.post("/api/journal", {
    headers: { Origin: "https://other.example" },
    multipart: { title: "Private", intent: "draft" },
  });
  expect(crossOrigin.status()).toBe(403);
});
