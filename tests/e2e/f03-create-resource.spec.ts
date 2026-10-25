import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('F03 List resources, then create one', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('401') && !text.includes('403')) {
          throw new Error(`console error: ${text}`);
        }
      }
    });
    page.on('response', (res) => {
      if (res.status() >= 500) throw new Error(`${res.status()} on ${res.url()}`);
    });

    // Sign in as root user before each test
    await page.goto('/login');
    await page.getByLabel('Email address').fill('root@localhost');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByLabel('Password').fill('Admin123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  test('F03-H1 happy path: create EC2 instance', async ({ page }) => {
    await page.goto('/ec2');
    await page.getByRole('button', { name: /launch instances/i }).click();
    // Fill wizard fields
    await page.getByLabel(/name/i).fill('test-instance-1');
    await page.getByRole('button', { name: /launch instances/i }).click();
    await expect(page.getByRole('heading', { name: /EC2/i })).toBeVisible();
    // Table should show the new instance (or empty state cleared)
    await expect(page.locator('table')).toBeVisible();

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('F03-E1 empty required field shows inline error', async ({ page }) => {
    await page.goto('/ec2');
    await page.getByRole('button', { name: /launch instances/i }).click();
    await page.getByRole('button', { name: /launch instances/i }).click();
    // Should show validation error
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('F03-E5 mobile width usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ec2');
    await page.getByRole('button', { name: /launch instances/i }).click();
    await expect(page.getByRole('button', { name: /launch instances/i })).toBeVisible();
  });
});
