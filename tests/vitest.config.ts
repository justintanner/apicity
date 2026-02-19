/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", "examples"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
    },
    alias: {
      "@bareapi/moonshot": path.resolve(
        __dirname,
        "./packages/provider/moonshot/src"
      ),
      "@bareapi/kie": path.resolve(__dirname, "./packages/provider/kie/src"),
    },
  },
});
