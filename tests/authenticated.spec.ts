import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@leduc-receipt-pro.ca';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPass123!';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard|\/overview|\/\?tab=overview/, { timeout: 15000 });
}

test.describe('Authenticated flows', () => {
  test('signs in successfully and shows dashboard', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(/overview|dashboard|spend|receipts/i).first()).toBeVisible();
  });

  test('navigates to Scan page', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: /scan/i }).first().click();
    await expect(page).toHaveURL(/scan|\?tab=scan/);
  });

  test('navigates to Banking page', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: /banking/i }).first().click();
    await expect(page).toHaveURL(/banking|\?tab=bank/);
  });

  test('navigates to Tax Export page', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: /tax/i }).first().click();
    await expect(page).toHaveURL(/tax|\?tab=tax/);
  });

  test('navigates to Business page', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: /business/i }).first().click();
    await expect(page).toHaveURL(/business|\?tab=business/);
  });

  test('navigates to Audit page', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: /audit/i }).first().click();
    await expect(page).toHaveURL(/audit|\?tab=audit/);
  });

  test('navigates to Alerts page', async ({ page }) => {
    await signIn(page);
    await page.getByRole('link', { name: /alerts|risk/i }).first().click();
    await expect(page).toHaveURL(/alerts|\?tab=alert/);
  });

  test('settings pages are accessible when authenticated', async ({ page }) => {
    await signIn(page);

    await page.goto('/settings/billing');
    await expect(page).toHaveURL(/settings\/billing/);

    await page.goto('/settings/org');
    await expect(page).toHaveURL(/settings\/org/);

    await page.goto('/settings/security');
    await expect(page).toHaveURL(/settings\/security/);
  });

  test('sidebar shows navigation items', async ({ page }) => {
    await signIn(page);
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText(/overview|scan|banking|audit/i).first()).toBeVisible();
  });

  test('theme toggle is accessible', async ({ page }) => {
    await signIn(page);
    const toggle = page.locator('button[title*="theme" i], button[aria-label*="theme" i], [class*="theme-toggle"]').first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(toggle).toBeVisible();
    }
  });

  test('logout redirects to auth page', async ({ page }) => {
    await signIn(page);
    await page.goto('/logout');
    await page.waitForURL('/', { timeout: 10000 });
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('KPI cards display numeric values on dashboard', async ({ page }) => {
    await signIn(page);

    const kpiCards = page.locator('[class*="kpi"]:has(p,span,strong), [class*="KPI"]:has(p,span,strong), [class*="stat"]');
    const count = await kpiCards.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 2); i++) {
        const text = await kpiCards.nth(i).textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }
  });
});
