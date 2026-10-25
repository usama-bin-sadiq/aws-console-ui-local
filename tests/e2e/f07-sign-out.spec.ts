import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('F07 Sign out', () => {
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

  test('F07-H1 happy path: sign out redirects to login', async ({ page }) => {
    await page.goto('/ec2');
    await page.getByRole('button', { name: /account|root|admin/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });
});
