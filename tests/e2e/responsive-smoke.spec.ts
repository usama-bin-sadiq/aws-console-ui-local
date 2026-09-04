import { expect, test } from '@playwright/test';

const routes = ['/', '/ec2', '/s3', '/lambda', '/iam', '/vpc'];

for (const route of routes) {
    test(`${route} has no document overflow`, async ({ page }) => {
        await page.route('**/api/**', async (request) => {
            const url = new URL(request.url());
            if (url.pathname === '/api/health') {
                await request.fulfill({
                    contentType: 'application/json',
                    body: JSON.stringify({ status: 'healthy', provider: 'localstack', services: {} }),
                });
                return;
            }
            await request.fulfill({ contentType: 'application/json', body: JSON.stringify({}) });
        });

        const pageErrors: string[] = [];
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main, [role="main"]').first()).toBeVisible();

        const overflow = await page.evaluate(() => ({
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
        }));
        expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
        expect(pageErrors).toEqual([]);
    });
}
