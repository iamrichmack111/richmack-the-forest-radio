import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.beforeEach(async ({ page }) => {
  fs.mkdirSync('screenshots', { recursive: true });

  await page.goto('/', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  await expect(page.locator('body')).toBeAttached();
  await page.waitForTimeout(1200);
});

test('capture home', async ({ page }) => {
  await page.screenshot({
    path: 'screenshots/01-home.png',
    fullPage: true
  });
});

test('capture interactive state', async ({ page }) => {
  const candidates = page.locator('button, a, [role="button"]');
  const count = await candidates.count();

  for (let i = 0; i < Math.min(count, 8); i++) {
    try {
      if (await candidates.nth(i).isVisible()) {
        await candidates.nth(i).click({ timeout: 800 });
        await page.waitForTimeout(500);
        break;
      }
    } catch {}
  }

  await page.screenshot({
    path: 'screenshots/02-interactive.png',
    fullPage: true
  });
});

test('capture radio state', async ({ page }) => {
  await page.keyboard.press('Tab').catch(() => {});
  await page.waitForTimeout(300);

  await page.screenshot({
    path: 'screenshots/03-radio-state.png',
    fullPage: true
  });
});
