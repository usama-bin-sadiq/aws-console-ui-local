import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
      include: ["src/lib/localstack-adapter/**/*.ts"],
      exclude: ["node_modules", "tests", "**/*.test.*", "**/*.spec.*"],
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
