import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Application loads", async ({ page }) => {
  const response = await page.goto("/#diary");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { name: "One moment at a time." })).toBeVisible();
});

test("No uncaught JavaScript errors", async ({ page }) => {
  const errors: string[] = [];

  page.on("pageerror", error => {
    errors.push(error.message);
  });

  await page.goto("/#diary");
  await expect(page.getByRole("heading", { name: "One moment at a time." })).toBeVisible();

  expect(errors).toEqual([]);
});

test("No horizontal overflow", async ({ page }) => {
  await page.goto("/#diary");
  await expect(page.getByRole("heading", { name: "One moment at a time." })).toBeVisible();

  await expect.poll(async () => {
    return page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth
    );
  }).toBe(true);
});

test("Accessibility audit", async ({ page }, testInfo) => {
  await page.goto("/#diary");
  await expect(page.getByRole("heading", { name: "One moment at a time." })).toBeVisible();

  await expect(page.getByRole("button", { name: "Save reading" })).toBeEnabled();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();

  await testInfo.attach("axe-violations", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
  expect(results.violations).toEqual([]);
});