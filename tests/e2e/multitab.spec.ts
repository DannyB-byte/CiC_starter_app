import { test, expect } from '@playwright/test';
test('concurrent tabs retain both readings and reject stale edits', async ({ page, context }) => {
  await page.goto('/#diary');
  const other = await context.newPage();
  await other.goto('/#diary');
  for (const [tab, value] of [[page, '37.2'], [other, '38.4']] as const) {
    await tab.getByLabel('Temperature in degrees Celsius').fill(value);
  }
  await Promise.all([page, other].map(tab => tab.getByRole('button', { name: 'Save reading' }).click()));
  for (const tab of [page, other]) await expect(tab.getByText('2 readings')).toBeVisible();
  for (const tab of [page, other]) await tab.getByRole('button', { name: 'Edit reading 37.2 degrees' }).click();
  await page.getByLabel('Optional note').fill('first correction');
  await page.getByRole('button', { name: 'Save correction' }).click();
  await expect(other.getByText('first correction')).toBeVisible();
  await other.getByLabel('Optional note').fill('stale correction');
  await other.getByRole('button', { name: 'Save correction' }).click();
  await expect(other.getByRole('alert')).toContainText('changed in another window');
  await other.reload();
  await expect(other.getByText('first correction')).toBeVisible();
  await expect(other.getByText('2 readings')).toBeVisible();
});
