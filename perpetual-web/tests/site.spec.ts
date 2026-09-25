import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("public navigation, responsive layout, and accessibility", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Big ideas",
  );
  await expect(
    page.getByRole("link", { name: "Let’s build something" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
    scale: "css",
    animations: "disabled",
  });
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "About", exact: true })
      .click();
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "About", exact: true })
      .click();
  }
  await expect(page).toHaveURL("/about");
  for (const path of ["/services", "/projects", "/blog", "/contact"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/not-a-page");
  await expect(
    page.getByRole("heading", { name: "A little off course." }),
  ).toBeVisible();
});
test("real registration, login, refresh, profile update, and logout", async ({
  page,
  context,
}, testInfo) => {
  const suffix = Date.now().toString();
  const username = `web_${testInfo.project.name}_${suffix}`;
  const password = "Orbit-Lab!96-Green-Field";
  await page.goto("/account");
  await expect(page).toHaveURL("/sign-in");
  await page.goto("/register");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Email address").fill(`${username}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("different");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/sign-in\?created=1/);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/account");
  const session = await context.cookies();
  expect(session.find((c) => c.name === "pl_refresh")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "pl_refresh",
  );
  await context.clearCookies({ name: "pl_access" });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(username);
  await page.getByLabel("First name").fill("Browser");
  await page.getByLabel("Last name").fill("Test");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Your profile has been updated.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("First name")).toHaveValue("Browser");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");
  expect((await context.cookies()).some((c) => c.name.startsWith("pl_"))).toBe(
    false,
  );
  await page.goto("/account");
  await expect(page).toHaveURL("/sign-in");
});
test("contact validation and real submission", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Browser test");
  await page.getByLabel("Email address").fill("browser@example.test");
  await page.getByLabel("What do you have in mind?").fill("Short");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText("Tell us a little more (at least 10 characters)."),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("Browser test");
  await page.getByLabel("Email address").fill("browser@example.test");
  await page
    .getByLabel("What do you have in mind?")
    .fill("Automated local test: I would like to discuss a website project.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re on our radar." }),
  ).toBeVisible();
});
