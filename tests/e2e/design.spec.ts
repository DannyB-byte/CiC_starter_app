import { test, expect } from '@playwright/test';

test('brand images load without external fonts', async ({ page }) => {
  const externalFonts: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'font' && new URL(request.url()).origin !== new URL(page.url()).origin) externalFonts.push(request.url());
  });
  await page.goto('/#diary');
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  const logos = page.locator('img[src^="/brand/"]:visible');
  expect(await logos.count()).toBeGreaterThan(0);
  for (const logo of await logos.all()) {
    await expect.poll(() => logo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  await page.evaluate(() => document.fonts.ready);
  expect(externalFonts).toEqual([]);
});

test('primary actions have 44px touch targets', async ({ page }) => {
  await page.goto('/#diary');
  const save = page.getByRole('button', { name: 'Save reading' });
  await expect(save).toBeEnabled();
  await page.getByLabel('Temperature in degrees Celsius').fill('37.2');
  await save.click();
  const targets = [save, page.locator('nav a[aria-current="page"]:visible'), page.getByRole('button', { name: 'Edit reading 37.2 degrees' }), page.getByRole('button', { name: 'Delete reading 37.2 degrees' })];
  for (const target of targets) {
    await expect(target).toBeVisible();
    const bounds = await target.boundingBox();
    expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test('reduced motion preference suppresses transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#diary');
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const duration = await page.getByRole('button', { name: 'Save reading' }).evaluate(el => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
});

test('natural Tab reaches skip link with visible focus', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit platform tab preferences require physical-device verification');
  await page.goto('/#diary');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  const bounds = await skip.boundingBox();
  expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect(await skip.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
});

test('responsive width sweep', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome', 'Width sweep uses one desktop engine; other profiles retain their smoke checks');
  await page.goto('/#diary');
  await expect(page.getByRole('button', { name: 'Save reading' })).toBeEnabled();
  for (const width of [320, 375, 390, 600, 768, 899, 900, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `Overflow at ${width}px` }).toBe(true);
    await expect(page.locator('nav a[aria-current="page"]:visible')).toHaveCount(1);
  }
});
