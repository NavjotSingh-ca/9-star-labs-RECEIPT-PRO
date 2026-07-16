import { test, expect } from '@playwright/test';

test.describe('Global UI components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page renders with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors.filter((e) => !e.includes('favicon') && !e.includes('third-party') && !e.includes('placeholder') && !e.includes('supabase.co'))).toEqual([]);
  });

  test('top loader style element is injected', async ({ page }) => {
    await page.goto('/');
    // NextTopLoader injects a <style> element with nprogress CSS on mount.
    // The actual progress bar (#nprogress) is only created when navigation starts.
    await expect(page.locator('style:has-text("nprogress")')).toBeAttached({ timeout: 10000 });
  });
});

test.describe('Terms page', () => {
  test('renders all sections', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
    await expect(page.getByText(/acceptance/i)).toBeVisible();
    await expect(page.getByText(/limitation of liability/i)).toBeVisible();
    await expect(page.getByText(/quebec/i)).toBeVisible();
  });
});

test.describe('Privacy page', () => {
  test('renders all sections', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByText(/information we collect/i)).toBeVisible();
    await expect(page.getByText(/quebec law 25/i)).toBeVisible();
    await expect(page.getByText(/data retention/i)).toBeVisible();
  });
});

test.describe('Health endpoint', () => {
  test('returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });
});

test.describe('OpenAPI docs', () => {
  test('serves Swagger UI when Accept header is text/html', async ({ page }) => {
    await page.goto('/api/docs');
    await expect(page.locator('#swagger-ui')).toBeAttached();
  });

  test('returns JSON spec when Accept header is application/json', async ({ request }) => {
    const response = await request.get('/api/docs', {
      headers: { Accept: 'application/json' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('openapi');
    expect(body).toHaveProperty('paths');
  });
});
