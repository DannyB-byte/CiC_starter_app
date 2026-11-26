import { test, expect } from '@playwright/test';

test('production blocks scripted network access and displays demo notice', async ({ page, baseURL }) => {
  test.skip(!baseURL?.includes(':4173'), 'Production CSP is applied only to built assets.');
  await page.goto('/');
  await expect(page.getByText('Demonstration only — use fictional data. Not for clinical use.')).toBeVisible();
  const blocked = await page.evaluate(async () => {
    try { await fetch(new URL('manifest.webmanifest?security-probe=1', location.href)); return false; }
    catch { return true; }
  });
  expect(blocked).toBe(true);
});
