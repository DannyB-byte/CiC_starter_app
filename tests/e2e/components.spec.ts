import { test, expect } from '@playwright/test';

test('keyboard skip link reaches diary and form is usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Skip to diary' }).focus();
  await expect(page.getByRole('link', { name: 'Skip to diary' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#diary')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  await expect(page.getByRole('spinbutton', { name: 'Temperature in degrees Celsius' })).toBeVisible();
});

test('active diary navigation is visible and targets the main landmark', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('nav a[aria-current="page"]:visible');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', '#diary');
  await link.click();
  await expect(page).toHaveURL(/#diary$/);
  await expect(page.getByRole('main')).toBeVisible();
});

