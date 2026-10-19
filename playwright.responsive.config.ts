import { defineConfig, devices } from "@playwright/test";
import responsiveConfig from "./playwright.config";

export default defineConfig({
  ...responsiveConfig,
  projects: [
    {
      name: "responsive-320px",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 640 } },
    },
    {
      name: "responsive-768px",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "responsive-1024px",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
    {
      name: "responsive-400-zoom",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
