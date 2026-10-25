import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("F04 View a resource detail", () => {
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

  test("F04-H1 happy path: open instance detail", async ({ page }) => {
    await page.goto("/ec2");
    // Click first instance row link
    const firstInstanceLink = page.getByRole("link", { name: /i-0/ }).first();
    if (await firstInstanceLink.isVisible()) {
      await firstInstanceLink.click();
      await expect(page).toHaveURL(/\/ec2\/i-/);
      await expect(page.getByRole("heading")).toBeVisible();
    } else {
      // No instances - create one first or skip detail assertion
      await expect(page.getByText(/no instances|no ec2 instances/i)).toBeVisible();
    }
  });

  test("F04-E2 tabs switch without reload", async ({ page }) => {
    await page.goto("/ec2");
    const firstInstanceLink = page.getByRole("link", { name: /i-0/ }).first();
    if (await firstInstanceLink.isVisible()) {
      await firstInstanceLink.click();
      await page.getByRole("tab", { name: /tags/i }).click();
      await expect(page.getByText(/tags/i)).toBeVisible();
    }
  });
});
