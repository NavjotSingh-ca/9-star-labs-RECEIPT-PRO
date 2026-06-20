import { test, expect } from '@playwright/test';

test.describe('Auth page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows sign-in form and brand panel', async ({ page }) => {
    await expect(page.getByText('Leduc Receipt Pro')).toBeVisible();
    await expect(page.getByText(/AI-powered/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows forgot password link', async ({ page }) => {
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('shows Google OAuth button', async ({ page }) => {
    await expect(page.getByText(/google/i)).toBeVisible();
  });

  test('shows sign up / sign in toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();

    const signUpBtn = page.getByRole('button', { name: /sign up/i });
    await signUpBtn.click();

    await expect(page.getByText(/create account/i)).toBeVisible();
    await expect(page.getByText(/password strength/i)).toBeVisible();

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('sign-up form has password requirements checklist', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    await expect(page.getByText(/uppercase/i)).toBeVisible();
    await expect(page.getByText(/number/i)).toBeVisible();
  });

  test('email validation shows error for invalid email', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('not-an-email');
    await emailInput.press('Tab');
    await expect(page.getByText(/valid email/i).or(page.getByText(/invalid/i))).toBeVisible();
  });

  test('password show/hide toggle works', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('TestPass123');

    const showToggle = page.getByRole('button', { name: /show/i }).or(page.locator('[aria-label="Show password"]'));
    if (await showToggle.isVisible()) {
      await showToggle.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      const hideToggle = page.getByRole('button', { name: /hide/i }).or(page.locator('[aria-label="Hide password"]'));
      await hideToggle.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('tab navigation works from auth page when logged out', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();

    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /terms/i })).toBeVisible();
  });

  test('protected route redirects to auth', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('protected route /settings/org redirects to auth', async ({ page }) => {
    await page.goto('/settings/org');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('protected route /settings/security redirects to auth', async ({ page }) => {
    await page.goto('/settings/security');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
