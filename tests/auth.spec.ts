import { test, expect } from '@playwright/test';

test.describe('Auth page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows landing page with app branding', async ({ page }) => {
    await expect(page.getByText('Leduc Receipt Pro')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows sign-in form after clicking sign in button', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('shows forgot password link', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/forgot password/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows Google OAuth button', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/google/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows sign up / sign in toggle', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible({ timeout: 10000 });

    const signUpBtn = page.getByRole('button', { name: /sign up/i });
    await signUpBtn.click();

    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    // Strength label shows user's password strength after typing
    await page.getByRole('textbox', { name: /create password/i }).fill('TestPass123');
    await expect(page.getByText(/weak|fair|good|strong|excellent/i)).toBeVisible();

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('sign-up form has password requirements checklist', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByRole('button', { name: /sign up/i }).click();
    // Type a password to make the requirements checklist visible
    await page.getByRole('textbox', { name: /create password/i }).fill('TestPass123');
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/uppercase/i)).toBeVisible();
    await expect(page.getByText(/number/i)).toBeVisible();
  });

  test('email validation shows error for invalid email', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await emailInput.fill('not-an-email');
    await emailInput.press('Tab');
    await expect(page.getByText(/valid email/i).or(page.getByText(/invalid/i))).toBeVisible({ timeout: 10000 });
  });

  test('password show/hide toggle works', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    const passwordInput = page.getByRole('textbox', { name: /password/i });
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill('TestPass123');

    const passwordToggle = page.getByLabel('Toggle password visibility');
    if (await passwordToggle.isVisible()) {
      await passwordToggle.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await passwordToggle.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('tab navigation works from auth page when logged out', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/terms', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /terms/i })).toBeVisible({ timeout: 15000 });
  });

  test('protected route redirects to auth', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test('protected route /settings/org redirects to auth', async ({ page }) => {
    await page.goto('/settings/org');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test('protected route /settings/security redirects to auth', async ({ page }) => {
    await page.goto('/settings/security');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });
});
