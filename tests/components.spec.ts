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
    // Use page.evaluate to check since Playwright's CSS :has-text() may not
    // reliably match <style> elements across all rendering modes.
    await expect(async () => {
      const found = await page.evaluate(() => {
        const styles = document.querySelectorAll('style');
        return Array.from(styles).some(s => s.textContent?.includes('nprogress'));
      });
      expect(found).toBe(true);
    }).toPass({ timeout: 10000 });
  });
});

test.describe('Terms page', () => {
  test('renders all sections', async ({ page }) => {
    await page.goto('/terms', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible({ timeout: 15000 });
    // Use .first() for body text that appears in multiple sections
    await expect(page.getByText(/acceptance/i).first()).toBeVisible({ timeout: 10000 });
    // Use getByRole('heading',...) to avoid TOC link+heading strict mode conflict
    await expect(page.getByRole('heading', { name: /limitation of liability/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/quebec/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Privacy page', () => {
  test('renders all sections', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible({ timeout: 15000 });
    // Section headings only exist once — use getByRole to bypass TOC link conflict
    await expect(page.getByRole('heading', { name: /information we collect/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /quebec law 25/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /data retention/i })).toBeVisible({ timeout: 10000 });
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
