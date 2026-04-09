/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/integration/**/*.test.{ts,tsx}",
      "tests/functional/**/*.test.{ts,tsx}",
      "tests/unit/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist"],
    testTimeout: 30000,
    setupFiles: ["tests/integration-setup.ts"],
    alias: {
      "@nakedapi/kimicoding": path.resolve(
        __dirname,
        "../packages/provider/kimicoding/src"
      ),
      "@nakedapi/kie": path.resolve(__dirname, "../packages/provider/kie/src"),
      "@nakedapi/xai": path.resolve(__dirname, "../packages/provider/xai/src"),
      "@nakedapi/openai": path.resolve(
        __dirname,
        "../packages/provider/openai/src"
      ),
      "@nakedapi/fal": path.resolve(__dirname, "../packages/provider/fal/src"),
      "@nakedapi/fireworks": path.resolve(
        __dirname,
        "../packages/provider/fireworks/src"
      ),
      "@nakedapi/anthropic": path.resolve(
        __dirname,
        "../packages/provider/anthropic/src"
      ),
      "@nakedapi/alibaba": path.resolve(
        __dirname,
        "../packages/provider/alibaba/src"
      ),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["packages/provider/fireworks/src/**/*"],
      exclude: ["node_modules", "dist", "tests"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
