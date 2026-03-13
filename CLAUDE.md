# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NakedAPI is a TypeScript monorepo of standalone AI provider packages (`@nakedapi/openai`, `@nakedapi/xai`, `@nakedapi/fal`, `@nakedapi/kimicoding`, `@nakedapi/kie`). Each package has zero external dependencies and is completely self-contained. Based on [TetherAI](https://github.com/nbursa/TetherAI).

## Commands

```bash
pnpm install                    # Install dependencies
pnpm run build                  # Build all packages
pnpm run build:kimicoding       # Build single package (also: build:kie, build:xai)
pnpm run lint                   # Lint (runs build first via prelint)
pnpm run lint:fix               # Auto-fix lint issues
pnpm run format                 # Format with Prettier
pnpm run test:run               # Run unit tests once
pnpm run test                   # Run unit tests in watch mode
pnpm run test:integration       # Run integration tests (Polly.js replay)
pnpm run test:integration:record  # Re-record integration test fixtures (needs API keys)
pnpm run harness                # Recording review UI at localhost:3475

# Run a single test file
pnpm run test:run tests/unit/providers/kimicoding.test.ts
```

## Architecture

### Monorepo Structure

- **pnpm workspaces** with `packages/provider/*` and `examples/*`
- Each provider builds with `tsc` + a `scripts/dist.mjs` post-build step
- Output: `dist/src/index.js` + `dist/src/index.d.ts` per package

### Provider Pattern

All providers follow the same factory function pattern — a function that takes an options object (containing `apiKey`, optional `baseURL`, `timeout`, `fetch`) and returns a provider object whose method paths mirror the upstream API endpoint paths (e.g., `provider.v1.chat.completions()` for `/v1/chat/completions`). Local helper methods like `getModels()`, `validateModel()`, `getMaxTokens()` stay flat on the provider root. Callable namespaces (via `Object.assign`) serve dual purposes — e.g., `v1.models(params)` is callable and also has child methods like `v1.models.pricing(params)`.

```
packages/provider/<name>/
  src/
    index.ts       # Public exports (types + factory)
    types.ts       # All type definitions + error class
    <name>.ts      # Factory function + core implementation
    sse.ts         # SSE stream parsing (kimicoding, kie)
    middleware.ts  # withRetry, withFallback (kimicoding)
```

**openai** — OpenAI chat completions and audio transcription (`provider.v1.chat.completions()`, `provider.v1.audio.transcriptions()`)
**xai** — xAI chat, search, images, and video (`provider.v1.chat.completions()`, `.search()`, `provider.v1.images.generations()`, `provider.v1.videos.generations()`)
**fal** — Fal platform model management (`provider.v1.models()`, `.pricing()`, `.usage()`, `.analytics()`, `.requests`)
**kimicoding** — Anthropic Messages API format (`provider.coding.v1.messages()`, `.stream()`), model `k2p5`, supports vision
**kie** — Media generation (video/image/audio), `provider.api.v1.jobs.createTask()`, sub-providers (veo, suno, chat)

### Testing

Two Vitest configs with separate test suites:

- **Unit tests** (`tests/vitest.config.ts`): `tests/unit/**/*.test.ts` — uses `tests/setup.ts` for mock data, excludes `tests/integration/`
- **Integration tests** (`tests/vitest.integration.ts`): `tests/integration/**/*.test.ts` — uses Polly.js (`tests/harness.ts`) for HTTP record/replay, 30s timeout

Both configs alias `@nakedapi/*` to source directories so tests run against source (not dist).

Integration tests use `setupPolly(recordingName)` / `teardownPolly(ctx)` from `tests/harness.ts`. Recordings stored as HAR files in `tests/recordings/`. Auth headers are auto-redacted before persisting.

### CI

GitHub Actions (`ci.yml`): install → build → verify artifacts → lint → test (unit only). Runs on push/PR to main.

## Code Conventions

- ES modules (`"type": "module"`) throughout
- Target ES2022, strict mode, `@typescript-eslint/no-explicit-any: "error"`
- Double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char width
- PascalCase for types/interfaces/errors, camelCase for functions
- Error classes: extend `Error`, include `status` field, named `<Provider>Error`
- Type guards: `is<Name>` pattern (e.g., `isAnthropicErrorBody`)
- Prefer `interface` over `type` for object shapes
- `Record<string, unknown>` for API request/response bodies

## Hooks

PostToolUse hook auto-formats `.ts`/`.tsx` files with Prettier after every Edit/Write (skips `.claude/` files).
