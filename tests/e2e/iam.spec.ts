/**
 * E2E: IAM User — Create, Permissions, Access Keys (Playwright)
 * Per PRD §15.5 (IAM User Creation Workflow) and F-012 (IAM Console).
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('IAM Console — User & Policy Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/console/iam');
    await expect(page.getByRole('heading', { name: /iam/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows IAM users table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('opens user creation wizard', async ({ page }) => {
    await page.getByRole('button', { name: /Create user/i }).click();
    await expect(page.getByText(/user name/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('verifies adapter endpoint indicator', async ({ page }) => {
    await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  });
});
