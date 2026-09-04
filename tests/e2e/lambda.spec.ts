/**
 * E2E: Lambda Function — Create, Update, Monitor (Playwright)
 * Per PRD §15.3 (Lambda Function Creation Workflow) and F-006 (Compute).
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Lambda Console — Function Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/console/lambda');
    await expect(page.getByRole('heading', { name: /lambda/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows Lambda functions table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('opens function creation wizard', async ({ page }) => {
    await page.getByRole('button', { name: /Create function/i }).click();
    await expect(page.getByText(/function name/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('checks adapter mode header indicator', async ({ page }) => {
    await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  });
});
