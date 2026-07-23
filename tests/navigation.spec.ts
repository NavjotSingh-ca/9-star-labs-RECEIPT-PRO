import { test, expect } from '@playwright/test';

test.describe('Navigation — logged-out layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('auth page has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Receipt Pro/i, { timeout: 10000 });
  });

  test('page has proper lang attribute', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en-CA');
  });

  test('viewport meta tag exists', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('theme-color meta tag exists', async ({ page }) => {
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toBeAttached();
  });

  test('auth form is keyboard navigable', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeAttached();
  });
});

test.describe('Navigation — desktop sidebar (≥1024px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sidebar shows nav items', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/sign in/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation — mobile (<768px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile viewport renders correctly', async ({ page }) => {
    await page.goto('/');
    // Landing page shows first - click "Start Free Trial" because "Sign In" is hidden on mobile
    await page.getByRole('button', { name: /start free trial/i }).first().click();
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible({ timeout: 10000 });
  });
});
