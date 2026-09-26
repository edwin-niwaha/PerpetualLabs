import { test, expect } from "@playwright/test";
test("database products, images, and motion controls work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".product-card h3")).toHaveText([
    "PendezaConnect",
    "JobellStores",
    "DuukaYo",
    "FinCore",
  ]);
  await expect(page.locator(".cosmos-galaxy")).toBeVisible();
  for (const image of await page
    .locator(".product-visual img, .cosmos-galaxy")
    .all()) {
    if (!(await image.getAttribute("class"))?.includes("cosmos-galaxy")) {
      await image.scrollIntoViewIfNeeded();
    }
    await expect(image).toHaveJSProperty("complete", true);
    expect(
      await image.evaluate(
        (element) => (element as HTMLImageElement).naturalWidth,
      ),
    ).toBeGreaterThan(0);
  }
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(page.locator(".cosmos-hero")).toHaveClass(/cosmos-paused/);
  expect(
    await page
      .locator(".planet-track")
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe("paused");
  await page.getByRole("button", { name: "Resume animation" }).click();
  expect(
    await page
      .locator(".planet-track")
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe("running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".planet-track")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeHidden();
  await page.locator('a[href="/projects/duukayo"]').first().click();
  await expect(page.getByText("In development · Not yet hosted")).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit project" })).toHaveCount(
    0,
  );
});
