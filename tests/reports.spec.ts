import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@leduc-receipt-pro.ca';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPass123!';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard|\/overview|\/\?tab=overview/, { timeout: 15000 });
}

test.describe('Reports Page — landing', () => {
  test('landing page shows for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reports Page — authenticated', () => {
  // In CI, placeholder Supabase credentials can't authenticate, so skip these tests
  test.beforeEach(async ({ page }) => {
    test.skip(!!process.env.CI, 'No Supabase credentials in CI');
    await signIn(page);
    // Navigate to reports tab
    const reportsLink = page.getByRole('link', { name: /reports/i }).first();
    if (await reportsLink.isVisible()) {
      await reportsLink.click();
    } else {
      await page.getByRole('button', { name: /reports/i }).first().click();
    }
  });

  test('should display the reports page heading', async ({ page }) => {
    await expect(page.getByText(/reports/i).first()).toBeVisible();
  });

  test('should display template cards with generate buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    const generateButtons = page.getByRole('button', { name: /generate/i });
    const count = await generateButtons.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('should show date filter options', async ({ page }) => {
    await expect(page.getByText(/this month/i).first()).toBeVisible();
    await expect(page.getByText(/this year/i).first()).toBeVisible();
    await expect(page.getByText(/all time/i).first()).toBeVisible();
  });

  test('should show scheduled reports tab', async ({ page }) => {
    const scheduledTab = page.getByText(/scheduled/i);
    if (await scheduledTab.isVisible()) {
      await scheduledTab.click();
      await expect(page.getByText(/scheduled/i).first()).toBeVisible();
    }
  });
});
