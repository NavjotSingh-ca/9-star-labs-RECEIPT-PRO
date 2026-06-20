import { test, expect } from '@playwright/test';

test.describe('Protected routes redirect to auth', () => {
  test('redirects unauthenticated user from protected route', async ({ page }) => {
    await page.goto('/settings/billing');
    // Should redirect to auth page
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
