import { test, expect } from '@playwright/test';

test('temperature diary accepts unrestricted finite decimal readings', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Temperature in degrees Celsius');
  await expect(input).toHaveValue('');
  await page.getByRole('button', { name: 'Save reading' }).click();
  await expect(page.getByText('0 readings')).toBeVisible();
  for (const value of ['-12.345', '46.789', '0']) {
    await input.fill(value);
    await page.getByRole('button', { name: 'Save reading' }).click();
    await expect(input).toHaveValue('');
  }
  await page.reload();
  await expect(page.getByText('3 readings')).toBeVisible();
  await expect(page.getByText('-12.345°', { exact: true })).toBeVisible();
  await expect(page.getByText('46.789°', { exact: true })).toBeVisible();
  await expect(page.getByText('0.0°', { exact: true })).toBeVisible();
});
