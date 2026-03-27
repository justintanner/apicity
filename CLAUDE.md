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
pnpm run test:run               # Run all tests once (Polly.js replay)
pnpm run test                   # Run tests in watch mode
pnpm run test:integration:record  # Re-record test fixtures (needs API keys)
pnpm run harness                # HAR viewer at localhost:3475 (all recordings)

# Standalone HAR viewer
npx tsx tests/harness-serve.ts path/to/file.har       # View specific HAR file(s)
npx tsx tests/harness-serve.ts tests/recordings/       # View a directory of recordings
npx tsx tests/harness-serve.ts --html out.html <paths> # Generate self-contained HTML
npx tsx tests/harness-serve.ts --git-approve <paths>   # Enable approve button (git add)

# Run a single test file
pnpm run test:run tests/integration/openai-chat.test.ts
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
**xai** — xAI chat, images, video, collections, and search (`provider.v1.chat.completions()`, `provider.v1.images.generations()`, `provider.v1.videos.generations()`, `provider.v1.collections.*`, `provider.v1.documents.search()`)
**fal** — Fal platform model management (`provider.v1.models()`, `.pricing()`, `.usage()`, `.analytics()`, `.requests`)
**kimicoding** — Anthropic Messages API format (`provider.coding.v1.messages()`, `.stream()`), model `k2p5`, supports vision
**kie** — Media generation (video/image/audio), `provider.api.v1.jobs.createTask()`, sub-providers (veo, suno, chat)

### Testing

All tests use Polly.js HTTP record/replay (no mocks):

- **Config**: `tests/vitest.integration.ts` — includes `tests/integration/**/*.test.ts`, 30s timeout
- **Setup**: `tests/integration-setup.ts` — aliases `@nakedapi/*` to source directories so tests run against source (not dist)

Tests use `setupPolly(recordingName)` / `teardownPolly(ctx)` from `tests/harness.ts`. Recordings stored as HAR files in `tests/recordings/`. Auth headers are auto-redacted before persisting.

**Integration test recording workflow — NEVER skip this when adding/modifying integration tests:**

1. Write the test file in `tests/integration/`.
2. Record fixtures for **only** the new/changed file:

   ```bash
   # With 1Password (recommended — secrets never touch disk):
   pnpm run test:integration:record -- tests/integration/<file>.test.ts

   # With plain env vars (manual):
   POLLY_MODE=record OPENAI_API_KEY=sk-... pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
   ```

   This sends real API requests and writes HAR files to `tests/recordings/`.

3. Verify the test passes in replay mode:
   ```bash
   pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
   ```

Recordings are committed alongside source code and included in PRs. The CI harness-report job posts a summary of changed recordings as a PR comment for visibility.

**Secrets management (1Password):**

API keys are stored in 1Password and referenced via `op://` URIs in `.env.tpl` (committed to repo). The `test:integration:record` script uses `op run` to resolve these at runtime.

- **Local dev:** `op` authenticates via the 1Password desktop app (biometric).
- **Gastown agents / CI:** Set `OP_SERVICE_ACCOUNT_TOKEN` in the environment. Create a service account with read-only access to the NakedAPI vault. `op run` auto-detects the token — no interactive auth needed.

### CI

GitHub Actions (`ci.yml`): Three jobs — build (install, compile, verify artifacts), test (lint, integration tests via Polly.js replay), harness-report (PR-only, posts Markdown summary of changed recordings as a PR comment + uploads interactive HTML viewer as artifact). Runs on push/PR to main.

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

Quick reference: `bd ready` (find work), `bd create "Title"` (new task), `bd close <id>` (complete).

### Adding a New Endpoint

When assigned an endpoint task (e.g., "Add openai POST /v1/embeddings"):

1. **Research** — Fetch the upstream API docs for the endpoint. Study an existing
   endpoint in the same provider for patterns (types, schema, factory wiring, tests).
2. **Types** — Add request/response interfaces to `types.ts` (PascalCase).
   Update the provider interface. Export from `index.ts`.
3. **Schema** — Add PayloadSchema to `schemas.ts`. Add validatePayload via
   Object.assign on the endpoint function.
4. **Factory** — Wire the endpoint into the factory function in `<provider>.ts`.
   Use Object.assign for callable namespaces.
5. **Integration test** — Write `tests/integration/<provider>-<slug>.test.ts`
   using setupPolly/teardownPolly. Record fixtures, verify replay.
6. **Commit and PR** — One endpoint per PR.

## Development Workflow

When picking up a beads issue, follow these steps in order. Format and lint gates are enforced automatically by git hooks (pre-commit: format + lint).

### 1. Claim work

```bash
bd ready                                    # find unblocked issues
bd update <id> --claim                      # claim it
git checkout -b <id>/<short-description>    # e.g. nakedapi-5/xai-search
```

### 2. Implement

Code the feature/fix following the provider pattern. Add types, factory method, and integration test. One endpoint per PR.

### 3. Record integration test fixtures

```bash
# Record fixtures (needs API keys in env)
POLLY_MODE=record pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
# Verify replay works
pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
```

### 4. Push + open PR

```bash
git add .
git commit -m "feat: <description>"
git push -u origin HEAD
gh pr create --title "<title>" --body "Resolves <id>"
```

Recordings are committed alongside source code. The CI harness-report job posts a summary of changed recordings as a PR comment for visibility.

### 5. CI validates + posts harness report (automatic)

Three jobs run on the PR:

- **build** — compile + verify artifacts
- **test** — lint + integration tests (Polly.js replay)
- **harness-report** — posts a visual summary with embedded prompts, input media, and output results as a PR comment + uploads interactive HTML viewer as artifact

### 6. After merge

```bash
git checkout main && git pull
bd close <id>
```
