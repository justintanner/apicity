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
    fileParallelism: 12,
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
      "@apicity/zaicoding/zod": path.resolve(
        __dirname,
        "../packages/provider/zaicoding/src/zod"
      ),
      "@apicity/zaicoding": path.resolve(
        __dirname,
        "../packages/provider/zaicoding/src"
      ),
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
      "@apicity/binance/zod": path.resolve(
        __dirname,
        "../packages/provider/binance/src/zod"
      ),
      "@apicity/binance": path.resolve(
        __dirname,
        "../packages/provider/binance/src"
      ),
      "@apicity/dropbox/zod": path.resolve(
        __dirname,
        "../packages/provider/dropbox/src/zod"
      ),
      "@apicity/dropbox": path.resolve(
        __dirname,
        "../packages/provider/dropbox/src"
      ),
      "@apicity/openligadb/zod": path.resolve(
        __dirname,
        "../packages/provider/openligadb/src/zod"
      ),
      "@apicity/openligadb": path.resolve(
        __dirname,
        "../packages/provider/openligadb/src"
      ),
      "@apicity/openf1/zod": path.resolve(
        __dirname,
        "../packages/provider/openf1/src/zod"
      ),
      "@apicity/openf1": path.resolve(
        __dirname,
        "../packages/provider/openf1/src"
      ),
      "@apicity/s3/zod": path.resolve(
        __dirname,
        "../packages/provider/s3/src/zod"
      ),
      "@apicity/s3": path.resolve(__dirname, "../packages/provider/s3/src"),
      "@apicity/b2/zod": path.resolve(
        __dirname,
        "../packages/provider/b2/src/zod"
      ),
      "@apicity/b2": path.resolve(__dirname, "../packages/provider/b2/src"),
      "@apicity/google/zod": path.resolve(
        __dirname,
        "../packages/provider/google/src/zod"
      ),
      "@apicity/google": path.resolve(
        __dirname,
        "../packages/provider/google/src"
      ),
      "@apicity/free-media-upload/zod": path.resolve(
        __dirname,
        "../packages/provider/free-media-upload/src/zod"
      ),
      "@apicity/free-media-upload": path.resolve(
        __dirname,
        "../packages/provider/free-media-upload/src"
      ),
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
      "@apicity/meta/zod": path.resolve(
        __dirname,
        "../packages/provider/meta/src/zod"
      ),
      "@apicity/meta": path.resolve(__dirname, "../packages/provider/meta/src"),
      "@apicity/polymarket/zod": path.resolve(
        __dirname,
        "../packages/provider/polymarket/src/zod"
      ),
      "@apicity/polymarket": path.resolve(
        __dirname,
        "../packages/provider/polymarket/src"
      ),
      "@apicity/cost": path.resolve(__dirname, "../packages/provider/cost/src"),
      "@apicity/youtube/zod": path.resolve(
        __dirname,
        "../packages/provider/youtube/src/zod"
      ),
      "@apicity/youtube": path.resolve(
        __dirname,
        "../packages/provider/youtube/src"
      ),
      "@apicity/telegram/zod": path.resolve(
        __dirname,
        "../packages/provider/telegram/src/zod"
      ),
      "@apicity/telegram": path.resolve(
        __dirname,
        "../packages/provider/telegram/src"
      ),
      "@apicity/thesportsdb/zod": path.resolve(
        __dirname,
        "../packages/provider/thesportsdb/src/zod"
      ),
      "@apicity/thesportsdb": path.resolve(
        __dirname,
        "../packages/provider/thesportsdb/src"
      ),
      "@apicity/dolthub/zod": path.resolve(
        __dirname,
        "../packages/provider/dolthub/src/zod"
      ),
      "@apicity/dolthub": path.resolve(
        __dirname,
        "../packages/provider/dolthub/src"
      ),
      "@apicity/simplefunctions/zod": path.resolve(
        __dirname,
        "../packages/provider/simplefunctions/src/zod"
      ),
      "@apicity/simplefunctions": path.resolve(
        __dirname,
        "../packages/provider/simplefunctions/src"
      ),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Scope the shared coverage gate to branch changes so stale provider
      // baselines do not block unrelated implementation work.
      include: ["packages/provider/*/src/**/*"],
      changed: process.env.APICITY_COVERAGE_BASE ?? "origin/main",
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
