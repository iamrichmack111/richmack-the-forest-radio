const { test, expect } = require('@playwright/test');

test('Richmack The Forest Radio loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
});
