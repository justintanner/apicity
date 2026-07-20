# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apicity is a TypeScript monorepo of standalone API provider packages (`@apicity/openai`, `@apicity/xai`, `@apicity/fal`, `@apicity/google`, `@apicity/kimicoding`, `@apicity/kie`, `@apicity/anthropic`, `@apicity/fireworks`, `@apicity/alibaba`, `@apicity/binance`, `@apicity/openligadb`, `@apicity/elevenlabs`, `@apicity/s3`, `@apicity/b2`, `@apicity/dolthub`, `@apicity/polymarket`, `@apicity/meta`, `@apicity/telegram`, `@apicity/quo`, `@apicity/x`, `@apicity/youtube`, `@apicity/free-media-upload`). Each package is self-contained with a minimal dependency footprint: every provider depends on `zod` (endpoint `.schema` definitions), and polymarket also depends on `viem` for EIP-712 order signing. Shared provider helpers are copied into packages as synced local source rather than consumed through workspace package dependencies. Based on [TetherAI](https://github.com/nbursa/TetherAI).

`@apicity/cost` is a dependency-free cross-provider helper: pure local USD cost/token estimation (`createCost`, `computeEstimate`, bundled rate tables) plus the canonical OTP pay-gate (`withPaidGate`) source vendored into kie and xai.

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
pnpm run build:kimicoding        # Build single package (also: build:google, build:kie, build:xai, build:openai, build:fal, build:anthropic, build:fireworks, build:alibaba, build:binance, build:openligadb, build:elevenlabs, build:s3, build:b2, build:dolthub, build:polymarket, build:meta, build:telegram, build:quo, build:x, build:youtube, build:free-media-upload, build:cost, build:mcp-server)
pnpm run gen:shared              # Sync canonical shared/provider-src files into provider copies
pnpm run gen:shared:check        # Check shared provider copies for drift
pnpm run typecheck               # Type-check all packages (tsc --noEmit; no emit, no docs)
pnpm run typecheck:provider -- <name-or-path> # Type-check one provider; falls back to full on shared/package diffs
pnpm run lint                    # Full lint: prettier --check + ESLint + repo checks (NO build)
pnpm run lint:after-format       # Full lint minus prettier --check; safe after pnpm run format
pnpm run lint:provider <name-or-path> # Scoped ESLint + provider-relevant repo checks
pnpm run lint:fix                # Auto-fix lint issues
pnpm run format                  # Format with Prettier
pnpm run format:changed          # Format only changed or supplied files
pnpm run format:check            # Check formatting without writing (part of lint)

# Test (replay-only; no network, no keys)
pnpm run test:run                # Run all tests once (Polly.js replay)
pnpm run test:run <file>         # Replay a single test file
pnpm run test:affected           # Replay provider tests for provider-only diffs; falls back to test:run
pnpm run test:provider <name-or-path> # Typecheck + replay one provider's tests
pnpm run test                    # Run tests in watch mode

# Dev workflow (discrete per-phase aliases)
pnpm run dev:record -- <file>    # Safe record for a NEW test (record-missing + 1Password)
pnpm run dev:rerecord -- <file>  # Destructive re-record (guarded by tests/record.mjs)
pnpm run dev:preflight:fast -- <name-or-path> # fast provider gate: scoped format/lint/typecheck/tests
pnpm run dev:preflight:provider <name-or-path> # explicit alias for the fast provider gate
pnpm run dev:preflight:changed   # changed-file format/lint plus full typecheck + replay suite
pnpm run dev:preflight           # full local gate: format + typecheck + lint:after-format + test:run
pnpm run ci:local                # full CI-style gate: audit + gen:examples:check + build + lint + test:run

# Harness viewer + screenshots
pnpm run harness                 # HAR viewer at localhost:3475 (all recordings)
pnpm run harness:report          # Generate PR-diff harness report directory (SPA shell + per-commit JSON)
pnpm run harness:telegram -- --dry-run # Preview per-endpoint Telegram messages (changed recordings)
pnpm run harness:telegram -- --all <pattern> --dry-run # Preview ANY recording by name/path substring
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
    sse.ts         # SSE stream parsing (alibaba, anthropic, fireworks, free-media-upload, kie, kimicoding)
    middleware.ts  # retry/fallback/rate-limit helpers; synced into 11 recipients
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
**openligadb** — Public soccer match data, standings, and scorers
**elevenlabs** — Sound effect generation, text-to-speech, voices, user/subscription
**s3** — S3-compatible object storage (signing, buckets, objects)
**b2** — Backblaze B2 S3-compatible storage; S3-compatible signing/transport/schemas vendored from the s3 provider source (docs-only in `endpoint-docs.tsv`, excluded from the endpoint-walk lint)
**dolthub** — DoltHub API: SQL execution and Dolt database management
**polymarket** — Gamma, Data, and CLOB market-data/trading endpoints
**meta** — Instagram Graph API: posting reels via the public-URL flow (graph.instagram.com)
**telegram** — Telegram Bot API: send text, photo, video, audio messages
**quo** — Quo business text messaging
**x** — X (Twitter) social API for posting content (api.x.com)
**youtube** — YouTube Data API v3 for posting content
**free** — Free file hosting (tmpfiles.org, uguu.se, catbox.moe, litterbox, gofile.io, filebin.net, temp.sh, tmpfile.link)
**cost** — Dependency-free cross-provider USD cost/token estimation and canonical pay-gate source
**mcp-server** — MCP server exposing every provider endpoint as an MCP tool (`packages/mcp-server`)

### Testing

All tests use Polly.js HTTP record/replay (no mocks):

- **Config**: `tests/vitest.integration.ts` — includes `tests/integration/**/*.test.ts`, 30s timeout
- **Setup**: `tests/integration-setup.ts` — aliases `@apicity/*` to source directories so tests run against source (not dist)

**Scope the loop to one provider.** While working on a single provider, don't replay the whole suite — run only that provider's tests with `pnpm test:provider <name-or-path>` (resolves `<name>.test.ts` + `<name>-*.test.ts` across the top level of `tests/integration`, `tests/functional`, and `tests/unit`). The argument can be a provider name, a path under `packages/provider/<name>`, or a matching integration test path. From inside a provider package, `pnpm -w run test:provider` and `pnpm -w run dev:preflight:fast` infer the provider from pnpm's `INIT_CWD`. For committed, staged, unstaged, or untracked provider-only diffs, `pnpm run test:affected` auto-selects the touched provider tests. It falls back to full `pnpm run test:run` for shared scripts/config, package metadata, unit or functional tests, docs, and other ambiguous changes. Run full `pnpm run test:run` directly when you need an explicit complete local replay. The **full suite is GitHub CI's responsibility**; locally you only need the provider you're touching. `pnpm run dev:preflight:fast -- <name-or-path>` prints and runs the fast provider checklist: scoped format, scoped lint, provider typecheck, provider replay, and the cross-cutting recording-enumeration tests. Use `pnpm run dev:preflight` or `pnpm run ci:local` for shared tooling, package metadata, docs, test harness changes, release prep, or any ambiguous diff that needs the full repository gate.

**Cross-cutting recording tests always run in the fast gates.** A few integration tests (`tests/integration/upload-recordings.test.ts`, `tests/integration/multipart-recordings.test.ts`) enumerate the ENTIRE `tests/recordings` corpus and assert it matches a hardcoded allowlist. They are not named after a single provider, so `test:provider <name>` alone skips them — which once let a new upload recording missing from the allowlist pass the fast gate, merge, and go red in full CI. Both `dev:preflight:fast` and `test:affected` (in its provider-scoped path) therefore also run the cross-cutting tests listed in `scripts/lib/cross-cutting-tests.mjs`. They are filesystem-only (no Polly/network, ~1s). When you add a test that walks the whole recordings tree, add it to that list.

For typecheck-only local iteration, use
`pnpm run typecheck:provider -- <name-or-path>`. It checks
`origin/main...HEAD` plus staged and unstaged files: provider-only diffs run
that provider's `tsconfig.json`; diffs that touch another package or shared
package/TypeScript config fall back to the full `pnpm run typecheck` so
shared-package errors are not missed. `dev:preflight:provider` does not run a
separate root typecheck step because `test:provider` already runs the selected
provider's `tsc --noEmit` check before replaying tests.

Timing baseline recorded on 2026-06-30 in a fresh worktree:
`pnpm run typecheck` completed in 105.61s real time, while
`npx tsc --noEmit -p packages/provider/openai/tsconfig.json` completed in
5.79s real time. After adding the guarded script,
`pnpm run typecheck:provider -- openai --base=HEAD` completed in 10.33s real
time on the clean fast path.

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

Recordings are committed alongside source code and included in PRs. CI no longer generates a harness report or screenshots on PRs; instead, on **push to main** the `endpoint-telegram` job sends one Telegram message per changed recording. To inspect recording diffs locally, use the harness viewer (`pnpm run harness`, `pnpm run harness:report`, `pnpm run harness:telegram -- --dry-run`).

**Secrets management:**

API keys are resolved at runtime via the [1Password CLI](https://developer.1password.com/docs/cli/) (`op run --env-file=.env`). The tracked `.env` file contains `op://` secret references (e.g., `op://Apicity/OPENAI_API_KEY/password`). Both `test:integration:record` and `test:integration:record-missing` use `op run` automatically.

### CI

GitHub Actions (`ci.yml`): two jobs — **test** (guard against cassette re-recording, install, audit, build, verify artifacts, lint, integration tests via Polly.js replay; runs on push + PR) and **endpoint-telegram** (push-only; sends one Telegram message per changed recording). The old PR-only harness-report job (HTML report + Chromium screenshot + PR comment) has been removed — the harness viewer is now a local-only tool.

## Code Conventions

- ES modules (`"type": "module"`) throughout
- Target ES2022, strict mode, `@typescript-eslint/no-explicit-any: "error"`
- Double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char width
- PascalCase for types/interfaces/errors, camelCase for functions
- Error classes: extend `Error`, include `status` field, named `<Provider>Error`
- Type guards: `is<Name>` pattern (e.g., `isAnthropicErrorBody`)
- Prefer `interface` over `type` for object shapes
- `Record<string, unknown>` for API request/response bodies
- **Model-identifier enums stay open.** When a field names an upstream _model_
  and upstream independently ships new identifiers in that family on its own
  cadence, write `z.enum([...known]).or(<FamilyAliasSchema>)`, where the alias
  is a `z.string().regex(...)` matching that provider's actual id grammar —
  never a bare `.or(z.string())`, which accepts typos. The known ids stay
  enumerated so MCP clients keep autocomplete. See
  `GoogleFlowVeoModelAliasSchema` in `packages/provider/googleflow/src/zod.ts`.
  (The `model` field of `GoogleFlowImagesRequestSchema` in that same file still
  uses the bare form this rule replaces; it predates the rule and is tracked in
  `ac-wss39`.)
  Fixed vocabularies that are _not_ model registries — `quality`, `vad_model`,
  `apply_text_normalization`, tier enums like `SimpleFunctionsModelSchema` —
  stay closed `z.enum`s.

### Adding a New Endpoint

Work through the full flow in order: research the upstream docs →
add types/schema/factory → record a HAR fixture → verify replay →
preview the Telegram message → run the gates → open the PR → close the bead.

Two invariants worth knowing:

- **URL comment (lint-enforced)** — a 2-line comment immediately above each
  endpoint property in the factory, plus a matching
  `(provider, dotPath, method, fullUrl, docsUrl)` row in
  `scripts/endpoint-docs.tsv`. Checked by `pnpm run lint:endpoints`; the docs
  hostname must be on the provider's allow-list in
  `scripts/check-endpoint-comments.mjs`. For overloaded endpoints, comment the
  default path.

  ```typescript
  // POST https://api.openai.com/v1/chat/completions
  // Docs: https://platform.openai.com/docs/api-reference/chat/create
  completions: Object.assign(async (req) => { ... }, { schema: ... })
  ```

- **One endpoint per PR.**

## Development Workflow

Every phase of the dev loop is one `pnpm` command. Format/lint gates are also
wired into `dev:preflight`, so you don't need a separate hook step.

When editing files under `shared/provider-src/` or another canonical vendoring
source, run `pnpm run gen:shared` before linting so generated provider copies
stay in sync. `pnpm run lint` includes `gen:shared:check` and fails on drift.

| # | Phase             | Command                                                          |
| - | ----------------- | ---------------------------------------------------------------- |
| 1 | Implement         | _(edit code — types, schema, factory, integration test)_         |
| 2 | Record fixtures   | `pnpm run dev:record -- tests/integration/<file>.test.ts`        |
| 3 | Verify replay     | `pnpm run test:provider <name-or-path>` or `pnpm run test:affected` for provider-only diffs |
| 4 | Telegram preview  | `pnpm run harness:telegram -- --dry-run`                         |
| 5 | Pre-push          | `pnpm run dev:preflight:fast -- <name-or-path>` for provider work, `pnpm run dev:preflight:changed` for known changed-file work, or `dev:preflight` for full |
| 6 | CI dry-run        | `pnpm run ci:local`                                              |
| 7 | Push + open PR    | `git push -u origin HEAD && gh pr create`                        |
| 8 | CI                | _(automatic — replay suite on PR; Telegram per changed recording on push to main)_ |

**Escape hatches**

- `pnpm run dev:rerecord -- tests/integration/<file>.test.ts` — destructive
  re-record of an existing HAR. Requires a file filter (`POLLY_FORCE_ALL=1`
  overrides the guard).
- `pnpm run check:op` — confirm 1Password is resolving `.env`
  before recording.
- `pnpm run harness` — local HAR viewer at `localhost:3475`.
- `pnpm run harness:telegram -- --dry-run` — write
  `harness-telegram-messages.json` without sending. On **push to main** CI sends
  these same per-endpoint HTML messages when Telegram secrets are present.
- `pnpm run harness:screenshot:media` — generate a media-only PNG of the harness
  viewer locally, useful when iterating on `har-viewer.html` rendering.

### CI jobs

- **test** (push + PR) — guards against cassette re-recording
  (`POLLY_MODE` must be `replay`), then audit + generated-example drift check +
  build + verify artifacts + lint + integration tests via Polly.js replay.
  Equivalent to `ci:local`.
- **endpoint-telegram** (push only) — diffs recordings since the previous push
  and sends one Telegram message per changed recording (full headers, payloads,
  response, inline media). Skips cleanly when nothing changed.

The harness report/screenshot is no longer run in CI — it is a local-only tool
(`pnpm run harness`, `harness:report`, `harness:screenshot`).


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
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

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
