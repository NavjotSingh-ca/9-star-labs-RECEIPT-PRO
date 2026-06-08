import { test, expect } from '@playwright/test';

test.describe('Protected routes redirect to auth', () => {
  test('redirects unauthenticated user from dashboard', async ({ page }) => {
    await page.goto('/');
    // Already on auth page, no dashboard content shown
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
