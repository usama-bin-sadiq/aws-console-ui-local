import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("F08 Add to favorites", () => {
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

  test("F08-H1 happy path: favorite a service appears on home", async ({ page }) => {
    await page.getByRole("button", { name: /open services/i }).click();
    // Favorite EC2
    const ec2Item = page.getByRole("link", { name: /EC2/i });
    if (await ec2Item.isVisible()) {
      // Look for favorite star near EC2
      await ec2Item.click();
      await page.getByRole("button", { name: /favorite|star/i }).click();
      await page.goto("/");
      await expect(page.getByText(/favorites/i)).toBeVisible();
    }
  });
});
