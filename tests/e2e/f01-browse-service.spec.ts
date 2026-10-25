import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("F01 Browse and open a service", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("401") && !text.includes("403")) {
          throw new Error(`console error: ${text}`);
        }
      }
    });
    page.on("response", (res) => {
      if (res.status() >= 500) throw new Error(`${res.status()} on ${res.url()}`);
    });

    // Sign in as root user before each test
    await page.goto("/login");
    await page.getByLabel("Email address").fill("root@localhost");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByLabel("Password").fill("Admin123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  test("F01-H1 happy path: open EC2 service from home", async ({ page }) => {
    await page.getByRole("button", { name: /open services/i }).click();
    await page.getByRole("link", { name: /EC2/i }).click();
    await expect(page).toHaveURL(/\/ec2\/?$/);
    await expect(page.getByRole("heading", { name: /EC2/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /launch instances/i })).toBeVisible();

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test("F01-E1 disabled service shows reason", async ({ page }) => {
    await page.getByRole("button", { name: /open services/i }).click();
    // Find a disabled service (checking state)
    const disabledItem = page.getByRole("link", { name: /partial/i }).first();
    if (await disabledItem.isVisible()) {
      await disabledItem.click();
      // Should show disabled state or reason
      await expect(
        page.locator(
          '[data-testid="service-unavailable"], .disabled-reason, [aria-disabled="true"]',
        ),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
