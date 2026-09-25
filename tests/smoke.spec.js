import { test, expect } from '@playwright/test';

test('Forest Radio document loads', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);

  await expect(page.locator('html')).toBeAttached();
  await expect(page.locator('body')).toBeAttached();
});

test('Forest Radio renders page content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.waitForTimeout(1000);

  const body = page.locator('body');
  await expect(body).toBeAttached();

  const size = await body.evaluate((el) => ({
    width: el.scrollWidth,
    height: el.scrollHeight
  }));

  expect(size.width).toBeGreaterThan(0);
  expect(size.height).toBeGreaterThan(0);
});
