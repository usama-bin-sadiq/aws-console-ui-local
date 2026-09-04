/**
 * Playwright Configuration — E2E + VRT tests for AWS Console Emulator.
 * Per PRD Appendix H (Testing Strategy) and Appendix F (VRT).
 * Reference: docs/prd-aws-management-console-v1.3.md §H.1–H.3
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'tests/reports/playwright' }]],
  use: {
    actionTimeout: 15000,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'localstack',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
    },
  ],
});
