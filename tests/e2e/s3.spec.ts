/**
 * E2E: S3 Bucket — Create, List, Permissions (Playwright)
 * Per PRD §15.2 (S3 Bucket Creation Workflow) and F-006 (Storage).
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('S3 Console — Bucket Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/console/s3');
    await expect(page.getByRole('heading', { name: /s3/i })).toBeVisible({ timeout: 10000 });
  });

  test('lists S3 buckets in table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('opens bucket creation wizard', async ({ page }) => {
    await page.getByRole('button', { name: /Create bucket/i }).click();
    await expect(page.getByText(/bucket name/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('verifies adapter endpoint indicator', async ({ page }) => {
    await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  });
});
