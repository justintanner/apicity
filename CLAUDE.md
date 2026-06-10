# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apicity is a TypeScript monorepo of standalone API provider packages (`@apicity/openai`, `@apicity/xai`, `@apicity/fal`, `@apicity/google`, `@apicity/kimicoding`, `@apicity/kie`, `@apicity/anthropic`, `@apicity/fireworks`, `@apicity/alibaba`, `@apicity/binance`, `@apicity/elevenlabs`, `@apicity/s3`, `@apicity/b2`, `@apicity/dolthub`, `@apicity/polymarket`, `@apicity/meta`, `@apicity/telegram`, `@apicity/x`, `@apicity/youtube`, `@apicity/free-media-upload`). Each package is self-contained with a minimal dependency footprint: every provider depends on `zod` (endpoint `.schema` definitions), and a few carry one more — `viem` in polymarket (EIP-712 order signing), `@apicity/s3` in b2 (the S3 core it wraps), and `@apicity/cost` in kie and xai (pay-gate). Based on [TetherAI](https://github.com/nbursa/TetherAI).

`@apicity/cost` is a dependency-free cross-provider helper: pure local USD cost/token estimation (`createCost`, `computeEstimate`, bundled rate tables) plus the OTP pay-gate (`withPaidGate`) that kie and xai use to gate paid endpoints.

`@apicity/mcp-server` (under `packages/mcp-server`, not `packages/provider/`) is an optional MCP server that exposes every provider endpoint as an MCP tool.

## Package Naming

Package names follow the pattern `@apicity/<provider>` where the provider name matches the upstream API name (lowercase).

## Endpoint Naming

Method paths mirror upstream API URL paths segment-by-segment. Kebab-case segments become camelCase. This is a strict convention — all endpoint properties must use camelCase, never bracket-notation kebab-case.

```
URL path:     /v1/chat/completions       →  openai.v1.chat.completions()
URL path:     /v1/language-models        →  xai.v1.languageModels()
URL path:     /api/v1/common/download-url →  kie.api.v1.common.downloadUrl()
URL path:     /v1/tokenize-text          →  xai.v1.tokenizeText()
```

POST endpoints expose a zod request schema as `.schema` (defined in the provider's `src/zod.ts`, attached via `Object.assign`). Providers do not validate payloads at runtime; the schema is metadata for consumers — the MCP server converts it to tool input JSON Schema, and callers can `.schema.safeParse(data)` themselves.

## Commands

Every phase of the dev loop maps to a single named pnpm script. Prefer these
over raw `vitest` / `op run` invocations.

```bash
# Build / lint / format
pnpm install                     # Install dependencies
pnpm run build                   # Build all packages
pnpm run build:kimicoding        # Build single package (also: build:google, build:kie, build:xai, build:openai, build:fal, build:anthropic, build:fireworks, build:alibaba, build:binance, build:elevenlabs, build:s3, build:b2, build:dolthub, build:polymarket, build:meta, build:telegram, build:x, build:youtube, build:free-media-upload, build:cost, build:mcp-server)
pnpm run lint                    # Lint (runs build first via prelint)
pnpm run lint:fix                # Auto-fix lint issues
pnpm run format                  # Format with Prettier

# Test (replay-only; no network, no keys)
pnpm run test:run                # Run all tests once (Polly.js replay)
pnpm run test:run <file>         # Replay a single test file
pnpm run test                    # Run tests in watch mode

# Dev workflow (discrete per-phase aliases)
pnpm run dev:record -- <file>    # Safe record for a NEW test (record-missing + 1Password)
pnpm run dev:rerecord -- <file>  # Destructive re-record (guarded by tests/record.mjs)
pnpm run dev:preflight           # format + lint + test:run (run before `git push`)
pnpm run ci:local                # build + lint + test:run (exact CI mirror)

# Harness viewer + screenshots
pnpm run harness                 # HAR viewer at localhost:3475 (all recordings)
pnpm run harness:report          # Generate PR-diff harness report directory (SPA shell + per-commit JSON)
pnpm run harness:telegram -- --dry-run # Preview per-endpoint Telegram HTML messages
pnpm run harness:screenshot      # Generate + screenshot the full harness report locally
pnpm run harness:screenshot:media # Generate + screenshot ONLY media-bearing recordings

# Secrets
pnpm run check:op                # Verify 1Password service account is working

# Standalone HAR viewer
npx tsx tests/harness-serve.ts path/to/file.har        # View specific HAR file(s)
npx tsx tests/harness-serve.ts tests/recordings/       # View a directory of recordings
npx tsx tests/harness-serve.ts --html out.html <paths> # Generate self-contained HTML
npx tsx tests/harness-serve.ts --git-approve <paths>   # Enable approve button (git add)
```

## Architecture

### Monorepo Structure

- **pnpm workspaces** with `packages/provider/*` and `examples/*`
- Each provider builds with `tsc` + a `scripts/dist.mjs` post-build step
- Output: `dist/src/index.js` + `dist/src/index.d.ts` per package

### Provider Pattern

All providers follow the same factory function pattern — a function that takes an options object (containing `apiKey`, optional `baseURL`, `timeout`, `fetch`) and returns a provider object whose method paths mirror the upstream API endpoint paths (e.g., `provider.v1.chat.completions()` for `/v1/chat/completions`). Callable namespaces (via `Object.assign`) serve dual purposes — e.g., `v1.models(params)` is callable and also has child methods like `v1.models.pricing(params)`. POST endpoints expose a zod request schema as `.schema`, attached via `Object.assign`.

```
packages/provider/<name>/
  src/
    index.ts       # Public exports (types + factory)
    types.ts       # All type definitions + error class
    <name>.ts      # Factory function + core implementation
    sse.ts         # SSE stream parsing (kimicoding, kie, fireworks, anthropic)
    middleware.ts  # withRetry, withFallback (all providers)
    zod.ts         # Zod request schemas, attached to endpoints as .schema (all providers)
```

**openai** — Chat, embeddings, images, files, models, moderations, batches, responses, audio, fine-tuning
**xai** — Chat, images, video, files, batches, collections, search, models, auth, realtime, responses, tokenize-text
**fal** — Models (pricing, usage, analytics, requests), queue, serverless (files, logs, apps, metrics), workflows
**google** — Gemini express-mode generateContent
**kimicoding** — Messages, streaming, models, embeddings, countTokens
**kie** — Media generation (video/image/audio), sub-providers (veo, suno, chat, claude)
**anthropic** — Messages, streaming, batches, files, models, skills, admin/org APIs
**fireworks** — Chat, completions, embeddings, rerank, messages, workflows, audio, models, deployments, training
**alibaba** — Chat (Qwen3), streaming, models
**binance** — Spot REST public/general endpoints
**elevenlabs** — Sound effect generation, text-to-speech, voices, user/subscription
**s3** — S3-compatible object storage (signing, buckets, objects)
**b2** — Backblaze B2 S3-compatible storage; thin wrapper delegating signing/transport/schemas to `@apicity/s3` (docs-only in `endpoint-docs.tsv`, excluded from the endpoint-walk lint)
**dolthub** — DoltHub API: SQL execution and Dolt database management
**polymarket** — Gamma, Data, and CLOB market-data/trading endpoints
**meta** — Instagram Graph API: posting reels via the public-URL flow (graph.instagram.com)
**telegram** — Telegram Bot API: send text, photo, video, audio messages
**x** — X (Twitter) social API for posting content (api.x.com)
**youtube** — YouTube Data API v3 for posting content
**free** — Free file hosting (tmpfiles.org, uguu.se, catbox.moe, litterbox, gofile.io, filebin.net, temp.sh, tmpfile.link)
**cost** — Cross-provider USD cost/token estimation (depends on the other workspace packages)
**mcp-server** — MCP server exposing every provider endpoint as an MCP tool (`packages/mcp-server`)

### Testing

All tests use Polly.js HTTP record/replay (no mocks):

- **Config**: `tests/vitest.integration.ts` — includes `tests/integration/**/*.test.ts`, 30s timeout
- **Setup**: `tests/integration-setup.ts` — aliases `@apicity/*` to source directories so tests run against source (not dist)

Tests use `setupPolly(recordingName)` / `teardownPolly(ctx)` from `tests/harness.ts`. Recordings stored as HAR files in `tests/recordings/`. Auth headers are auto-redacted before persisting.

**Integration test recording workflow — NEVER skip this when adding/modifying integration tests:**

The recording system uses two modes, chosen based on whether you're adding new tests or explicitly overwriting existing ones:

- **`record-missing` (default)** — Only records tests whose HAR files don't already exist. Existing recordings replay from disk. Use this when *adding* a new test. Safe to run without a file filter: it will only hit the network for new tests.
- **`record` (destructive)** — Overwrites existing HAR files. Use this only when you intentionally want to re-record an existing test (e.g., API payload changed). **Hard-errors if run without a test file filter** to prevent accidental full-suite re-records. Override with `POLLY_FORCE_ALL=1` if you really do need to re-record everything.

1. Write the test file in `tests/integration/`.
2. Record fixtures for the new test:

   ```bash
   # Default: record-missing. Only new tests hit the network; existing HARs untouched.
   # Uses 1Password CLI to resolve secrets from .env.
   pnpm run test:integration:record-missing
   ```

   Or target a specific file for speed:

   ```bash
   pnpm run test:integration:record-missing -- tests/integration/<file>.test.ts
   ```

   To intentionally re-record an existing test (destructive):

   ```bash
   pnpm run test:integration:record -- tests/integration/<file>.test.ts
   ```

3. Verify the test passes in pure replay mode:
   ```bash
   pnpm vitest run --config tests/vitest.integration.ts tests/integration/<file>.test.ts
   ```

Recordings are committed alongside source code and included in PRs. The CI harness-report job posts a summary of changed recordings as a PR comment for visibility, and uploads both a paginated interactive HAR viewer (directory with SPA shell + per-commit JSON files) and a full-page screenshot of the viewer index as artifacts.

**Secrets management:**

API keys are resolved at runtime via the [1Password CLI](https://developer.1password.com/docs/cli/) (`op run --env-file=.env`). The tracked `.env` file contains `op://` secret references (e.g., `op://Apicity/OPENAI_API_KEY/password`). Both `test:integration:record` and `test:integration:record-missing` use `op run` automatically.

### CI

GitHub Actions (`ci.yml`): Three jobs — build (install, compile, verify artifacts), test (lint, integration tests via Polly.js replay), harness-report (PR-only, posts Markdown summary of changed recordings as a PR comment + uploads paginated interactive HAR viewer directory as artifact). Runs on push/PR to main.

## Code Conventions

- ES modules (`"type": "module"`) throughout
- Target ES2022, strict mode, `@typescript-eslint/no-explicit-any: "error"`
- Double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char width
- PascalCase for types/interfaces/errors, camelCase for functions
- Error classes: extend `Error`, include `status` field, named `<Provider>Error`
- Type guards: `is<Name>` pattern (e.g., `isAnthropicErrorBody`)
- Prefer `interface` over `type` for object shapes
- `Record<string, unknown>` for API request/response bodies

### Adding a New Endpoint

When assigned an endpoint task (e.g., "Add openai POST /v1/embeddings"):

1. **Research** — Fetch the upstream API docs for the endpoint. Study an existing
   endpoint in the same provider for patterns (types, schema, factory wiring, tests).
2. **Types** — Add request/response interfaces to `types.ts` (PascalCase).
   Update the provider interface. Export from `index.ts`.
3. **Schema** — Add a zod request schema to `zod.ts`. Attach it to the
   endpoint function as `.schema` via Object.assign.
4. **Factory** — Wire the endpoint into the factory function in `<provider>.ts`.
   Use Object.assign for callable namespaces.
5. **URL comment (required)** — Place a 2-line comment immediately above the
   endpoint property in the factory:

   ```typescript
   // POST https://api.openai.com/v1/chat/completions
   // Docs: https://platform.openai.com/docs/api-reference/chat/create
   completions: Object.assign(async (req) => { ... }, { schema: ... })
   ```

   Line 1 is `// {METHOD} {full upstream URL}` (must match the URL the factory
   actually hits). Line 2 is `// Docs: {upstream docs URL}` whose hostname is
   on the provider's allow-list in `scripts/check-endpoint-comments.mjs`. Also
   add a `(provider, dotPath, method, fullUrl, docsUrl)` row to
   `scripts/endpoint-docs.tsv` (the source of truth for docs URLs). Both are
   enforced by `pnpm run lint:endpoints`. For overloaded endpoints (one async
   function that dispatches to multiple paths), comment the default path.
6. **Integration test** — Write `tests/integration/<provider>-<slug>.test.ts`
   using setupPolly/teardownPolly. Record fixtures, verify replay.
7. **Telegram notification** — Endpoint changes send one Telegram message per
   changed recording through `pnpm run harness:telegram` in PR and push CI. Use
   `pnpm run harness:telegram -- --dry-run` to inspect the HTML-formatted
   messages locally. Do not send `harness-summary-full.md` raw to Telegram.
8. **Commit and PR** — One endpoint per PR.

## Development Workflow

Every phase of the dev loop is one `pnpm` command. Format/lint gates are also
wired into `dev:preflight`, so you don't need a separate hook step.

| # | Phase             | Command                                                          |
| - | ----------------- | ---------------------------------------------------------------- |
| 1 | Implement         | _(edit code — types, schema, factory, integration test)_         |
| 2 | Record fixtures   | `pnpm run dev:record -- tests/integration/<file>.test.ts`        |
| 3 | Verify replay     | `pnpm run test:run tests/integration/<file>.test.ts`             |
| 4 | Telegram preview  | `pnpm run harness:telegram -- --dry-run`                         |
| 5 | Pre-push          | `pnpm run dev:preflight`                                         |
| 6 | CI dry-run        | `pnpm run ci:local`                                              |
| 7 | Push + open PR    | `git push -u origin HEAD && gh pr create`                        |
| 8 | CI + harness diff | _(automatic — same 3 commands as `ci:local` + harness report)_   |

**Escape hatches**

- `pnpm run dev:rerecord -- tests/integration/<file>.test.ts` — destructive
  re-record of an existing HAR. Requires a file filter (`POLLY_FORCE_ALL=1`
  overrides the guard).
- `pnpm run check:op` — confirm 1Password is resolving `.env`
  before recording.
- `pnpm run harness` — local HAR viewer at `localhost:3475`.
- `pnpm run harness:telegram -- --dry-run` — write
  `harness-telegram-messages.json` without sending. PR and push CI send the
  same per-endpoint HTML messages when Telegram secrets are present.
- `pnpm run harness:screenshot:media` — generate the same media-only PNG that
  the CI harness-report job attaches to PRs, useful when iterating on
  `har-viewer.html` rendering.

### CI jobs (automatic on PR)

- **build** — compile + verify artifacts
- **test** — `ci:local` line-for-line: `pnpm run build && pnpm run lint && pnpm run test:run`
- **harness-report** — generates a paginated interactive viewer (SPA shell
  with per-commit JSON files) and two screenshots via the reusable
  `.github/actions/screenshot-harness` composite action: a full report
  (`harness-report.png`) and a media-only report (`harness-report-media.png`)
  filtered to recordings that contain embedded images, video, or audio. The
  viewer directory + PNGs are uploaded as artifacts and a Markdown summary is
  posted as a PR comment.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
