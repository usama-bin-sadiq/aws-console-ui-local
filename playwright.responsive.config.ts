import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
    testDir: 'tests/e2e',
    testMatch: /responsive-smoke\.spec\.ts/,
    fullyParallel: true,
    reporter: [['list']],
    use: {
        baseURL,
        actionTimeout: 15000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'responsive-375', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
        { name: 'responsive-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 900 } } },
        { name: 'responsive-1024', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 900 } } },
        { name: 'responsive-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: 'responsive-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    ],
});
