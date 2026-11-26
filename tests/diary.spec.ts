import { expect, test } from '@playwright/test';

test('same-day readings survive reload and can be corrected and deleted offline', async ({ page, context }) => {
  await page.goto('/#diary');
  await expect(page.getByRole('heading', { name: 'One moment at a time.' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByRole('status')).toHaveText('Private and ready offline');
  await context.setOffline(true);

  await page.getByLabel('Temperature in degrees Celsius').fill('37.2');
  await page.getByLabel('Optional note').fill('Morning');
  await page.getByRole('button', { name: 'Save reading' }).click();
  await page.getByLabel('Temperature in degrees Celsius').fill('38.4');
  await page.getByLabel('Optional note').fill('Evening');
  await page.getByRole('button', { name: 'Save reading' }).click();

  await page.reload();
  await expect(page.getByText('2 readings')).toBeVisible();
  await expect(page.getByText('Morning')).toBeVisible();
  await expect(page.getByText('Evening')).toBeVisible();

  await page.getByRole('button', { name: 'Edit reading 37.2 degrees' }).click();
  await page.getByLabel('Temperature in degrees Celsius').fill('36.9');
  await page.getByLabel('Optional note').fill('Corrected morning reading');
  await page.getByRole('button', { name: 'Save correction' }).click();
  await page.getByRole('button', { name: 'Delete reading 38.4 degrees' }).click();

  await page.reload();
  await expect(page.getByText('1 reading')).toBeVisible();
  await expect(page.getByText('36.9°')).toBeVisible();
  await expect(page.getByText('Corrected morning reading')).toBeVisible();
  await expect(page.getByText('Morning', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Evening', { exact: true })).toHaveCount(0);
});
