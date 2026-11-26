import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('dashboard navigation preserves diary and supports browser history', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your day, your pace.' })).toBeVisible();
  await page.getByRole('link', { name: 'Open temperature diary' }).click();
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  await page.getByLabel('Temperature in degrees Celsius').fill('37.2');
  await page.getByRole('button', { name: 'Save reading' }).click();
  await expect(page.getByText('1 reading', { exact: true })).toBeVisible();
  await page.locator('nav:visible').getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText('1 reading recorded today.')).toBeVisible();
  await page.goBack();
  await expect(page.getByText('1 reading', { exact: true })).toBeVisible();
});
test('dashboard accessibility and responsive layout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your day, your pace.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
});
