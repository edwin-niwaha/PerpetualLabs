import { test, expect } from "@playwright/test";
import { chooseContent, referenceContent } from "../src/lib/company-content";

test("API collections override reference content and failures stay honest", () => {
  const records = [
    {
      id: 991,
      title: "Live service",
      slug: "live-service",
      description: "From Django",
      icon: "",
    },
  ];
  expect(chooseContent("services", records).items).toEqual(records);
  expect(chooseContent("services", []).source).toBe("reference");
  expect(chooseContent("projects", null).items).toEqual(
    referenceContent.projects,
  );
  expect(chooseContent("blog", null)).toEqual({
    items: [],
    unavailable: true,
    source: "unavailable",
  });
  expect(chooseContent("blog", [])).toEqual({
    items: [],
    unavailable: false,
    source: "api",
  });
});

test("company pages provide usable content and contact routes", async ({
  page,
}) => {
  await page.goto("/services");
  await expect(page.locator(".service-card")).toHaveCount(7);
  await page.locator('a[href="/services/cloud-services"]').first().click();
  await expect(page.locator(".detail-capabilities")).toContainText(
    "Cloud migration",
  );
  await page.goto("/projects");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await page.locator('a[href="/projects/pureshopper"]').first().click();
  await expect(page.locator(".detail-capabilities")).toContainText(
    "Order management",
  );
  await page.goto("/about");
  await expect(page.locator(".team-card")).toHaveCount(5);
  await expect(page.locator(".team-card").first()).toContainText(
    "Edwin Niwaha",
  );
  await page.goto("/contact");
  await expect(page.locator(".contact-methods a").first()).toHaveAttribute(
    "href",
    "tel:+256703163074",
  );
  await expect(
    page.locator('.contact-methods a[href="mailto:perpetual.ict@gmail.com"]'),
  ).toBeVisible();
  await expect(page.locator(".whatsapp-link")).toHaveAttribute(
    "href",
    "https://wa.me/256703163074",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/");
  const question = page.locator(".faq-list summary").first();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".faq-list details").first()).toHaveAttribute(
    "open",
    "",
  );
});
