import { test, expect } from '@playwright/test';

test('legacy diary migrates once and retains original storage', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'chemo-in-comfort.readings.v1';
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify([{id:'legacy-1',date:'2026-01-01',recordedAt:'2026-01-01T12:00:00.000Z',temperature:37.123,note:'Legacy observation'}]));
  });
  await page.goto('/#diary');
  await expect(page.getByText('Legacy observation')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Legacy observation')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('chemo-in-comfort.readings.v1'))).toContain('legacy-1');
});
