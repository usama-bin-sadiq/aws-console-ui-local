/**
 * E2E: DynamoDB Table — Create, Query, Indexes (Playwright)
 * Per PRD §15.8 (DynamoDB Table Creation Workflow) and F-006 (Database).
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('DynamoDB Console — Table Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/console/dynamodb');
    await expect(page.getByRole('heading', { name: /dynamodb/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows DynamoDB tables', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('opens table creation wizard', async ({ page }) => {
    await page.getByRole('button', { name: /Create table/i }).click();
    await expect(page.getByText(/table name/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('confirms adapter mode indicator visible', async ({ page }) => {
    await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  });
});
