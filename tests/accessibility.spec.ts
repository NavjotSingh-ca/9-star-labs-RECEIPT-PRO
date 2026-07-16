import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the full page loader to disappear
    await page.waitForSelector('[role="status"][aria-label="Loading application"]', { state: 'hidden', timeout: 10000 });
  });

  test('should not have any detectable accessibility issues on landing page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('auth page accessibility', async ({ page }) => {
    // Click Sign In to show auth screen (landing page shows first when not authenticated)
    await page.getByRole('button', { name: /sign in/i }).click();
    // Check if AuthScreen is visible - mode is signin by default, so "Welcome back"
    const authHeading = page.getByRole('heading', { name: /welcome back/i });
    await expect(authHeading).toBeVisible({ timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .include('form')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('main content structure is accessible', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('main') // Top-level main landmark in layout.tsx
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Manual Accessibility Checks', () => {
  test('focus indicators and skip link are visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    
    // The skip link should be the first focused element
    const focused = page.locator(':focus');
    const text = await focused.textContent();
    expect(text?.toLowerCase()).toContain('skip to main content');
    
    const outline = await focused.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outline !== 'none' && style.outline !== '0px';
    });
    expect(outline).toBe(true);
  });
});
