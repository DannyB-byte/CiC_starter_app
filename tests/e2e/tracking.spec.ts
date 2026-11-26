import { test, expect } from '@playwright/test';
test('food record persists and supports editing and deletion', async ({page})=>{
 await page.goto('/#tracking');
 await page.getByLabel('Meal description').fill('Toast');
 await page.getByRole('button',{name:'Save entry'}).click();
 await expect(page.getByText('Meal description: Toast')).toBeVisible();
 await page.reload();
 await expect(page.getByText('Meal description: Toast')).toBeVisible();
 await page.getByRole('button',{name:'Edit entry'}).click();
 await page.getByLabel('Meal description').fill('Soup');
 await page.getByRole('button',{name:'Save entry'}).click();
 await expect(page.getByText('Meal description: Soup')).toBeVisible();
 await page.getByRole('button',{name:'Delete entry'}).click();
 await page.getByRole('button',{name:'Confirm deletion'}).click();
 await expect(page.getByText('Meal description: Soup')).toHaveCount(0);
});
