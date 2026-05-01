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
      "@apicity/kimicoding/zod": path.resolve(
        __dirname,
        "../packages/provider/kimicoding/src/zod"
      ),
      "@apicity/kimicoding": path.resolve(
        __dirname,
        "../packages/provider/kimicoding/src"
      ),
      "@apicity/kie/zod": path.resolve(
        __dirname,
        "../packages/provider/kie/src/zod"
      ),
      "@apicity/kie": path.resolve(__dirname, "../packages/provider/kie/src"),
      "@apicity/xai/zod": path.resolve(
        __dirname,
        "../packages/provider/xai/src/zod"
      ),
      "@apicity/xai": path.resolve(__dirname, "../packages/provider/xai/src"),
      "@apicity/openai/zod": path.resolve(
        __dirname,
        "../packages/provider/openai/src/zod"
      ),
      "@apicity/openai": path.resolve(
        __dirname,
        "../packages/provider/openai/src"
      ),
      "@apicity/fal/zod": path.resolve(
        __dirname,
        "../packages/provider/fal/src/zod"
      ),
      "@apicity/fal": path.resolve(__dirname, "../packages/provider/fal/src"),
      "@apicity/fireworks/zod": path.resolve(
        __dirname,
        "../packages/provider/fireworks/src/zod"
      ),
      "@apicity/fireworks": path.resolve(
        __dirname,
        "../packages/provider/fireworks/src"
      ),
      "@apicity/anthropic/zod": path.resolve(
        __dirname,
        "../packages/provider/anthropic/src/zod"
      ),
      "@apicity/anthropic": path.resolve(
        __dirname,
        "../packages/provider/anthropic/src"
      ),
      "@apicity/alibaba/zod": path.resolve(
        __dirname,
        "../packages/provider/alibaba/src/zod"
      ),
      "@apicity/alibaba": path.resolve(
        __dirname,
        "../packages/provider/alibaba/src"
      ),
      "@apicity/free/zod": path.resolve(
        __dirname,
        "../packages/provider/free/src/zod"
      ),
      "@apicity/free": path.resolve(__dirname, "../packages/provider/free/src"),
      "@apicity/elevenlabs/zod": path.resolve(
        __dirname,
        "../packages/provider/elevenlabs/src/zod"
      ),
      "@apicity/elevenlabs": path.resolve(
        __dirname,
        "../packages/provider/elevenlabs/src"
      ),
      "@apicity/x/zod": path.resolve(
        __dirname,
        "../packages/provider/x/src/zod"
      ),
      "@apicity/x": path.resolve(__dirname, "../packages/provider/x/src"),
      "@apicity/cost": path.resolve(__dirname, "../packages/provider/cost/src"),
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
