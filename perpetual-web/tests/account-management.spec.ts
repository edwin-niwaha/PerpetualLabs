import { test, expect, type Page } from "@playwright/test";
import { pythonFixture } from "./helpers/python";

test.describe("client account management", () => {
  let account: { username: string; password: string };
  test.beforeEach(() => {
    account = JSON.parse(pythonFixture("scripts/e2e-account.py", ["create"]));
  });
  test.afterEach(() => {
    if (account)
      pythonFixture("scripts/e2e-account.py", ["cleanup", account.username]);
  });
  async function login(page: Page, password = account.password) {
    await page.goto("/sign-in");
    await page.getByLabel("Username", { exact: true }).fill(account.username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
  }
  function resetLink() {
    const credentials = JSON.parse(
      pythonFixture("scripts/e2e-account.py", ["token", account.username]),
    );
    return "/reset-password#" + new URLSearchParams(credentials);
  }
  async function newPassword(
    page: Page,
    password: string,
    confirmation = password,
  ) {
    await page.getByLabel("New password", { exact: true }).fill(password);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(confirmation);
  }

  test("forgot password is linked and gives a generic confirmation", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel("Username", { exact: true }).fill(account.username);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText(
      "If an eligible account exists",
    );
    await page
      .getByLabel("Username", { exact: true })
      .fill("missing-" + account.username);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText(
      "If an eligible account exists",
    );
  });

  test("profile edits and picture upload, replacement, removal persist", async ({
    page,
  }, info) => {
    await login(page);
    await page.getByLabel("First name").fill("Client");
    await page.getByLabel("Date of birth").fill("1993-04-05");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Your profile has been updated",
    );
    await page.reload();
    await expect(page.getByLabel("First name")).toHaveValue("Client");
    await expect(page.getByLabel("Date of birth")).toHaveValue("1993-04-05");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGNkYPjPgA0wYRUdtBIAy0MBD1YkjLoAAAAASUVORK5CYII=",
      "base64",
    );
    await page.getByLabel("Profile picture", { exact: true }).setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByRole("button", { name: "Upload picture" }).click();
    await expect(
      page.getByText("Your profile picture has been updated.", { exact: true }),
    ).toBeVisible();
    const avatar = page.locator("aside img");
    await expect(avatar).toBeVisible();
    const original = await avatar.getAttribute("src");
    await expect
      .poll(() =>
        avatar.evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.getByLabel("Profile picture", { exact: true }).setInputFiles({
      name: "replacement.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByRole("button", { name: "Change picture" }).click();
    await expect(avatar).not.toHaveAttribute("src", original!);
    await page.screenshot({
      path: info.outputPath("profile.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Remove picture" }).click();
    await expect(
      page.getByText("Your profile picture has been removed.", { exact: true }),
    ).toBeVisible();
    await expect(avatar).toHaveCount(0);
    await page.reload();
    await expect(avatar).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("picture rejects oversized and invalid image content", async ({
    page,
  }) => {
    await login(page);
    const input = page.getByLabel("Profile picture", { exact: true });
    await input.setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
    });
    await expect(
      page.getByText("Choose an image no larger than 4 MB.", { exact: true }),
    ).toBeVisible();
    await input.setInputFiles({
      name: "bad.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
    await page.getByRole("button", { name: "Upload picture" }).click();
    await expect(page.locator("#picture-error")).not.toBeEmpty();
    await expect(page.locator("aside img")).toHaveCount(0);
  });

  test("password change validates fields, signs out and accepts the new password", async ({
    page,
    context,
  }) => {
    await login(page);
    await page
      .getByRole("link", { name: "Change password", exact: true })
      .click();
    await page
      .getByLabel("Current password", { exact: true })
      .fill("incorrect");
    await newPassword(page, "Changed-Secure-Phrase!853");
    await page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await expect(
      page.getByText("Current password is incorrect.", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Current password", { exact: true })
      .fill(account.password);
    await newPassword(page, "Changed-Secure-Phrase!853", "different");
    await page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await expect(
      page.getByText("Passwords do not match.", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Current password", { exact: true })
      .fill(account.password);
    await newPassword(page, "Changed-Secure-Phrase!853");
    await page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await expect(page).toHaveURL(/\/sign-in\?password_changed=1$/);
    expect(
      (await context.cookies()).filter((cookie) =>
        cookie.name.startsWith("pl_"),
      ),
    ).toHaveLength(0);
    await login(page, "Changed-Secure-Phrase!853");
  });

  test("reset handles incomplete and invalid links and prevents reuse", async ({
    page,
  }) => {
    await page.goto("/reset-password");
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "incomplete",
    );
    await page.goto("/reset-password#uid=bad&token=invalid");
    await page.reload();
    await newPassword(page, "Reset-Secure-Phrase!964");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "invalid or has expired",
    );
    const link = resetLink();
    await page.goto("/sign-in");
    await page.goto(link);
    await expect(page).toHaveURL(/\/reset-password$/);
    await newPassword(page, "Reset-Secure-Phrase!964");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await expect(page).toHaveURL(/\/sign-in\?password_changed=1$/);
    await page.goto(link);
    await newPassword(page, "Different-Secure-Phrase!975");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "invalid or has expired",
    );
    await login(page, "Reset-Secure-Phrase!964");
  });

  test("anonymous account pages redirect to sign in", async ({ page }) => {
    for (const path of ["/account", "/account/change-password"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in$/);
    }
  });
});
