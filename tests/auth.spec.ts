import { test, expect } from '@playwright/test';

test.describe('Auth page', () => {
  test('shows sign-in form and brand panel', async ({ page }) => {
    await page.goto('/');

    // Brand panel
    await expect(page.getByText('Leduc Receipt Pro')).toBeVisible();
    await expect(page.getByText(/AI-powered/)).toBeVisible();

    // Sign-in form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows forgot password link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('shows Google OAuth button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/google/i)).toBeVisible();
  });

  test('shows sign up toggle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });
});
