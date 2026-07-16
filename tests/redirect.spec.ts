import { test, expect } from '@playwright/test';

test.describe('Protected routes redirect to auth', () => {
  test('redirects unauthenticated user from protected route', async ({ page }) => {
    await page.goto('/settings/billing');
    // Should redirect to landing page
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });
});
