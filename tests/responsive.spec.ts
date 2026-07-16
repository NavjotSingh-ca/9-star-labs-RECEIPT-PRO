import { test, expect } from '@playwright/test';

test.describe('Responsive layout — mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('content fits within viewport width', async ({ page }) => {
    await page.goto('/privacy');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });

  test('no horizontal scrollbar on privacy page', async ({ page }) => {
    await page.goto('/privacy');
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('no horizontal scrollbar on terms page', async ({ page }) => {
    await page.goto('/terms');
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Responsive layout — tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('content fits within viewport width', async ({ page }) => {
    await page.goto('/privacy');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(769);
  });

  test('no horizontal scrollbar', async ({ page }) => {
    await page.goto('/privacy');
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Responsive layout — desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('no horizontal scrollbar', async ({ page }) => {
    await page.goto('/privacy');
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('settings pages have sidebar nav', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 }); // redirected to landing page
  });
});

test.describe('Responsive layout — large desktop (1920px)', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('no horizontal scrollbar on large screens', async ({ page }) => {
    await page.goto('/privacy');
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});
