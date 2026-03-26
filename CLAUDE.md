# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NakedAPI is a TypeScript monorepo of standalone AI provider packages (`@nakedapi/openai`, `@nakedapi/xai`, `@nakedapi/fal`, `@nakedapi/kimicoding`, `@nakedapi/kie`). Each package has zero external dependencies and is completely self-contained. Based on [TetherAI](https://github.com/nbursa/TetherAI).

## Commands

```bash
pnpm install                    # Install dependencies
pnpm run build                  # Build all packages
pnpm run build:kimicoding       # Build single package (also: build:kie, build:xai, build:openai, build:fal)
pnpm run lint                   # Lint (runs build first via prelint)
pnpm run lint:fix               # Auto-fix lint issues
pnpm run format                 # Format with Prettier
pnpm run test:run               # Run unit tests once
pnpm run test                   # Run unit tests in watch mode
pnpm run test:integration       # Run integration tests (Polly.js replay)
pnpm run test:integration:record  # Re-record integration test fixtures (needs API keys)
pnpm run harness                # HAR viewer at localhost:3475 (all recordings)

# Standalone HAR viewer
npx tsx tests/harness-serve.ts path/to/file.har       # View specific HAR file(s)
npx tsx tests/harness-serve.ts tests/recordings/       # View a directory of recordings
npx tsx tests/harness-serve.ts --html out.html <paths> # Generate self-contained HTML
npx tsx tests/harness-serve.ts --git-approve <paths>   # Enable approve button (git add)

# Run a single test file
pnpm run test:run tests/unit/providers/kimicoding.test.ts
```

## Architecture

### Monorepo Structure

- **pnpm workspaces** with `packages/provider/*` and `examples/*`
- Each provider builds with `tsc` + a `scripts/dist.mjs` post-build step
- Output: `dist/src/index.js` + `dist/src/index.d.ts` per package

### Provider Pattern

All providers follow the same factory function pattern — a function that takes an options object (containing `apiKey`, optional `baseURL`, `timeout`, `fetch`) and returns a provider object whose method paths mirror the upstream API endpoint paths (e.g., `provider.v1.chat.completions()` for `/v1/chat/completions`). Callable namespaces (via `Object.assign`) serve dual purposes — e.g., `v1.models(params)` is callable and also has child methods like `v1.models.pricing(params)`. POST endpoints expose `.payloadSchema` (hardcoded schema object) and `.validatePayload(data)` for runtime validation.

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

**Integration test recording workflow — NEVER skip this when adding/modifying integration tests:**

1. Write the test file in `tests/integration/`.
2. Record fixtures for **only** the new/changed file:
   ```bash
   POLLY_MODE=record pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
   ```
   This sends real API requests (requires API keys in env) and writes HAR files to `tests/recordings/`.
3. Verify the test passes in replay mode:
   ```bash
   pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
   ```
4. Stop and tell the user recordings are ready for review.

**CRITICAL: Do NOT `git add`, stage, approve, or commit any files under `tests/recordings/`.** The user reviews recordings either in the harness UI (`pnpm run harness` → localhost:3475) for local development, or in the GitHub PR harness report for PR-based review. This is a human review gate — Claude must never bypass it.

### CI

GitHub Actions (`ci.yml`): Three jobs — build (install, compile, verify artifacts), test (lint, unit tests, integration replay), harness-report (PR-only, generates self-contained HTML viewer uploaded as artifact). Runs on push/PR to main.

## Code Conventions

- ES modules (`"type": "module"`) throughout
- Target ES2022, strict mode, `@typescript-eslint/no-explicit-any: "error"`
- Double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char width
- PascalCase for types/interfaces/errors, camelCase for functions
- Error classes: extend `Error`, include `status` field, named `<Provider>Error`
- Type guards: `is<Name>` pattern (e.g., `isAnthropicErrorBody`)
- Prefer `interface` over `type` for object shapes
- `Record<string, unknown>` for API request/response bodies

## Task Tracking

This project uses [beads](https://github.com/steveyegge/beads) (`bd`) for task tracking.
Hooks auto-inject `bd prime` at session start and before compaction.

Quick reference: `bd ready` (find work), `bd create "Title"` (new task), `bd close <id>` (complete), `bd sync` (sync with git).

## Development Workflow

When picking up a beads issue, follow these steps in order. Do NOT skip steps. Each gate must pass before proceeding.

### 1. Claim work

```bash
bd ready                                    # find unblocked issues
bd update <id> --status in_progress         # claim it
git checkout -b <id>/<short-description>    # e.g. nakedapi-5/xai-search
```

### 2. Implement

Code the feature/fix following the provider pattern. Reference the issue description for API docs and expected shape.

### 3. Format

```bash
pnpm run format
```

### 4. Lint — GATE

```bash
pnpm run lint
```

If lint fails, fix all errors and re-run until clean. Do not proceed with lint errors.

### 5. Unit tests — GATE

```bash
pnpm run test:run
```

If tests fail, fix and re-run until all pass. Do not proceed with failing tests.

### Automated Gates

Steps 3-5 are enforced by beads git hooks — no need to run manually:

- **Pre-commit**: Auto-formats staged code, then runs lint. Blocks commit on failure.
- **Pre-push**: Runs unit tests. Blocks push on failure.
- **CI**: GitHub Actions remains the final safety net.

### 6. Integration tests (if adding/changing endpoints)

Write the test file in `tests/integration/`, then:

```bash
# Record fixtures (needs API keys in env)
POLLY_MODE=record pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
# Verify replay works
pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
```

**STOP here.** Tell the user recordings are ready for review. Do NOT stage or commit files under `tests/recordings/` — the user reviews them either locally (`pnpm run harness`) or in the GitHub PR harness report.

### 7. Push + open PR

```bash
git add <source code + test files only, NOT recordings>
git commit -m "feat: <description>"
git push -u origin HEAD
gh pr create --title "<title>" --body "Resolves <id>"
```

The user will stage and commit approved recordings separately.

### 8. CI validates (automatic)

Three jobs run on the PR:

- **build** — compile + verify artifacts
- **test** — lint + unit tests + integration replay
- **harness-report** — generates self-contained HTML viewer of changed HAR recordings (uploaded as artifact)

### 9. Human reviews PR + harness report in GitHub

### 10. After merge

```bash
git checkout main && git pull
bd close <id>
bd sync
```
