import { test, expect } from '@playwright/test';

test('empty diary visual baseline', async ({ page }) => {
  test.skip(process.env.CIC_VISUAL !== '1', 'Opt-in visual suite: use the same OS and browser versions as the approved baseline');
  await page.goto('/#diary');
  await expect(page.getByText('Private and ready offline', { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('empty-diary.png', { animations: 'disabled', caret: 'hide', fullPage: true, mask: [page.getByLabel('Reading date')] });
});
