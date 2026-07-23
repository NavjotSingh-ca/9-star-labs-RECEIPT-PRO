import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('landing page has no detectable WCAG violations', async ({ page }) => {
    await page.goto('/');
    // Wait for main content to render (landing page is public)
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('auth page form has no detectable violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    // Click the Sign In button on the landing page
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await signInButton.click();

    // The auth screen should render with a heading (Sign In / Welcome back)
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible({ timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('main content structure has accessible landmarks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    const results = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Manual Accessibility Checks', () => {
  test('focus indicators are visible on tab through landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // Tab to the first focusable element (should be skip link or Sign In)
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible({ timeout: 5000 });

    // Verify the focused element has a visible outline or focus ring
    const hasVisibleFocus = await focused.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const outline = style.outline !== 'none' && style.outline !== '0px';
      const boxShadow = style.boxShadow !== 'none' && style.boxShadow !== '0px 0px 0px 0px';
      const ring = style.getPropertyValue('--tw-ring-color') || '';
      return outline || boxShadow || ring.length > 0;
    });

    expect(hasVisibleFocus).toBe(true);
  });
});
