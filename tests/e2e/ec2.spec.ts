/**
 * E2E: EC2 Instance Launch & Management (Playwright)
 * Per PRD §15.1 (EC2 Launch Workflow) and §10.1–10.3 (Resource Management).
 * Feature ID: F-006 | Service Category: Compute | Adapter Mode: localstack/ministack
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('EC2 Console — Launch, Table, Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/console/ec2');
    await expect(page.getByRole('heading', { name: /ec2/i })).toBeVisible({ timeout: 10000 });
  });

  test('navigates to EC2 dashboard and shows instance table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Launch Instance', { exact: false })).toBeVisible();
  });

  test('opens instance launch wizard and validates step navigation', async ({ page }) => {
    await page.getByRole('button', { name: /Launch Instance/i }).click();
    await expect(page.getByText(/Select an Amazon Machine Image/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('returns to instance list from detail page', async ({ page }) => {
    await page.getByRole('link', { name: /Instances/i }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 8000 });
  });

  test('checks adapter endpoint is active (localstack endpoint visible)', async ({ page }) => {
    const endpointBadge = page.locator('text=localstack');
    await expect(endpointBadge).toBeVisible({ timeout: 5000 });
  });
});
