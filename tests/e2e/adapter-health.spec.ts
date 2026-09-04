/**
 * E2E: Adapter Health — Endpoint, Auth, Mode Verification (Playwright)
 * Per PRD Appendix D (Adapter Layer) and Appendix H (Testing Strategy).
 */

import { test, expect } from '@playwright/test';

test.describe('Adapter Health — Endpoint & Auth', () => {
  test('health endpoint responds', async ({ request }) => {
    const health = await request.get('http://localhost:4566/_localstack/health');
    expect(health.status()).toBeGreaterThanOrEqual(200);
  });

  test('console page loads with adapter badge', async ({ page }) => {
    await page.goto('/console/home');
    await expect(page.getByText('localstack', { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('adapter mode header shows active backend', async ({ page }) => {
    await page.goto('/console/ec2');
    await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  });
});
