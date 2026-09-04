/**
 * VRT Playwright Config — Visual Regression Testing for AWS Console.
 * Per PRD Appendix F (§F.3 VRT Process) and Appendix H (§H.1–H.3).
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/vrt',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'tests/reports/vrt' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10000,
    screenshot: 'only-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  expect: {
    timeout: 5000,
  },
  projects: [
    {
      name: 'vrt-baseline',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
