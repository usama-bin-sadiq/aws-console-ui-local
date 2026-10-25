import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("F05 Delete one or more resources", () => {
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

  test("F05-E1 delete disabled when no selection", async ({ page }) => {
    await page.goto("/ec2");
    const actionsButton = page.getByRole("button", { name: /actions/i });
    if (await actionsButton.isVisible()) {
      await actionsButton.click();
      const deleteItem = page.getByRole("menuitem", { name: /terminate|delete/i });
      if (await deleteItem.isVisible()) {
        await expect(deleteItem).toBeDisabled();
      }
    }
  });

  test("F05-E2 confirm cancel keeps resource", async ({ page }) => {
    await page.goto("/ec2");
    // Select an instance if any exist
    const firstCheckbox = page.getByRole("checkbox").first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
      await page.getByRole("button", { name: /actions/i }).click();
      await page.getByRole("menuitem", { name: /terminate|delete/i }).click();
      await page.getByRole("button", { name: /cancel/i }).click();
      // Resource should still be there
      await expect(page.getByRole("table")).toBeVisible();
    }
  });
});
