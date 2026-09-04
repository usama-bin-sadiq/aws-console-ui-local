/**
 * E2E: VPC — Create, Subnets, Route Tables, Security Groups (Playwright)
 * Per PRD §15.4 (VPC Creation Workflow) and F-006 (Networking).
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('VPC Console — Network Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/console/vpc');
    await expect(page.getByRole('heading', { name: /vpc/i })).toBeVisible({ timeout: 10000 });
  });

  test('lists VPC resources in table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('opens VPC creation wizard', async ({ page }) => {
    await page.getByRole('button', { name: /Create VPC/i }).click();
    await expect(page.getByText(/cidr/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('confirms adapter endpoint indicator', async ({ page }) => {
    await expect(page.locator('text=localstack')).toBeVisible({ timeout: 5000 });
  });
});
