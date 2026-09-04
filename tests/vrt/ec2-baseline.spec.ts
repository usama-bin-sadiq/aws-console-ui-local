/**
 * VRT Baseline Tests — Key Page Screenshots
 * Per PRD Appendix F (§F.3) and user request: EC2 table, S3 bucket, Lambda wizard, IAM user.
 * Screenshots saved to tests/vrt/baselines/ (reference images).
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('VRT — AWS Console Key Page Baselines', () => {
  test('EC2 table page screenshot (baseline)', async ({ page }) => {
    await page.goto('/console/ec2');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'tests/vrt/baselines/ec2-table-baseline.png', fullPage: false, animations: 'disabled' });
  });

  test('S3 bucket page screenshot (baseline)', async ({ page }) => {
    await page.goto('/console/s3');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'tests/vrt/baselines/s3-bucket-baseline.png', fullPage: false, animations: 'disabled' });
  });

  test('Lambda wizard screenshot (baseline)', async ({ page }) => {
    await page.goto('/console/lambda');
    await page.getByRole('button', { name: /Create function/i }).click();
    await expect(page.getByText(/function name/i, { exact: false })).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'tests/vrt/baselines/lambda-wizard-baseline.png', fullPage: false, animations: 'disabled' });
  });

  test('IAM user page screenshot (baseline)', async ({ page }) => {
    await page.goto('/console/iam');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'tests/vrt/baselines/iam-user-baseline.png', fullPage: false, animations: 'disabled' });
  });
});
