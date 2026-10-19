import { defineConfig } from "vite-plus";
import path from "path";

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    globals: true,
    environment: "jsdom",
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/", ".next/", "public/"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/session-store.ts",
        "src/lib/rate-limiter.ts",
        "src/lib/db.ts",
        "src/lib/db/client.ts",
        "src/lib/api-client.ts",
        "src/lib/adapter-error-handler.ts",
        "src/lib/localstack-adapter/**/*.ts",
        "src/constants/navigation.ts",
        "src/constants/service-compatibility.ts",
        "src/constants/service-navigation.ts",
      ],
      exclude: ["node_modules/", ".next/", "src/app/**", "**/*.d.ts", "**/types/**"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
