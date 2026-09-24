const { test, expect } = require('@playwright/test');
const fs = require('fs');

const OUT = 'screenshots';

test.beforeAll(() => fs.mkdirSync(OUT, { recursive: true }));

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
}

async function clickFirstMatching(page, patterns) {
  for (const pattern of patterns) {
    const candidates = [
      page.getByRole('button', { name: pattern }),
      page.getByRole('link', { name: pattern }),
      page.getByText(pattern),
    ];
    for (const locator of candidates) {
      const first = locator.first();
      if (await first.isVisible().catch(() => false)) {
        await first.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(900);
        return true;
      }
    }
  }
  return false;
}

test('capture landing screen', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await expect(page.locator('body')).toBeVisible();
  await page.screenshot({ path: `${OUT}/01-landing.png`, fullPage: true });
});

test('capture gameplay or start screen', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await clickFirstMatching(page, [/start/i, /play/i, /begin/i, /enter/i, /new game/i]);
  await page.screenshot({ path: `${OUT}/02-gameplay.png`, fullPage: true });
});

test('capture level or challenge screen', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await clickFirstMatching(page, [/start/i, /play/i, /begin/i, /enter/i, /new game/i]);
  await clickFirstMatching(page, [/level/i, /challenge/i, /math/i, /continue/i, /next/i]);
  await page.screenshot({ path: `${OUT}/03-level.png`, fullPage: true });
});
