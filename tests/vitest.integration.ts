/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.{ts,tsx}"],
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
    },
  },
});
