/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "examples", "tests/integration"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
    },
    alias: {
      "@nakedapi/kimicoding": path.resolve(
        __dirname,
        "./packages/provider/kimicoding/src"
      ),
      "@nakedapi/kie": path.resolve(__dirname, "./packages/provider/kie/src"),
      "@nakedapi/xai": path.resolve(__dirname, "./packages/provider/xai/src"),
      "@nakedapi/openai": path.resolve(
        __dirname,
        "./packages/provider/openai/src"
      ),
      "@nakedapi/fal": path.resolve(__dirname, "./packages/provider/fal/src"),
    },
  },
});
