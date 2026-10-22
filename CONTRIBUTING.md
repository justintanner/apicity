# Contributing

[README.md](README.md) is the install and the call. This file is the
development loop: the gates, the provider loop and the recording rules.

## Development

- **Runtime** — Node 18+, Cloudflare Workers, Deno, Bun. ESM only. The CLI
  itself requires Node.js 20 or newer (`@apicity/cli` `engines`).
- **Build & test** — `pnpm install && pnpm run build && pnpm run test:run`.
  Integration tests record/replay via Polly.js (no keys needed for replay).
  A new test records with `pnpm run dev:record -- <file>`; replaying is
  `pnpm run test:run`. Re-record an existing fixture only with
  `pnpm run dev:rerecord -- <file>`.
- **Provider-scoped loop** — use
  `pnpm run dev:preflight:fast -- <name-or-path>` as the fast pre-push
  checklist for narrow provider work. It prints and runs the
  steps: <!-- fast-gate-steps:start -->Prettier on the provider
  package/tests<!-- fast-gate-step:format -->,
  `lint:provider`<!-- fast-gate-step:lint -->, the whole tests-project
  typecheck (`typecheck:tests`, unscoped by
  design)<!-- fast-gate-step:typecheck-tests -->, `test:provider` for
  provider typecheck + replay<!-- fast-gate-step:test-provider -->, then the
  cross-cutting repo-wide guard tests<!-- fast-gate-step:cross-cutting --><!-- fast-gate-steps:end -->.
  `<name-or-path>` can be `openai`,
  `packages/provider/openai/src/openai.ts`, or a matching
  `tests/integration/openai-*.test.ts` path. From a provider package,
  `pnpm -w run dev:preflight:fast` infers the provider from `INIT_CWD`.
  Use `pnpm run test:provider -- <name-or-path>` for test-only loops,
  `pnpm run typecheck:provider -- <name-or-path>` for provider-only compile
  checks, and `pnpm run lint:provider -- <name-or-path>` for provider-only
  lint. `pnpm run test:affected` auto-selects provider tests from the current
  git diff when every changed file belongs to provider packages, provider
  integration tests, or provider recordings; it falls back to full
  `pnpm run test:run` for shared scripts/config, unit or functional tests,
  docs, package metadata, or other ambiguous changes. `pnpm run dev:preflight`
  and `pnpm run ci:local` remain the full repository gates.
- **Changed-file loop** — use `pnpm run format:changed` to run Prettier only
  on files changed from `origin/main`, staged/unstaged files, and untracked
  files. Use `pnpm run dev:preflight:changed` when you want that scoped
  Prettier step followed by the repository checks that still run globally:
  full typecheck, scoped ESLint for changed JS/TS files, endpoint comment
  checks, orphan-recording checks, test-timer checks, and the replay suite.
  Pass explicit paths when the changed surface is known; for example, pass
  `package.json README.md` after `--`. Prefer `dev:preflight:fast` instead
  when the diff is cleanly provider-scoped. The full repository gates remain
  `pnpm run lint` for format check plus full linting/repo checks,
  `pnpm run lint:after-format` after formatting, `pnpm run dev:preflight`,
  and `pnpm run ci:local`.
- **Typecheck-only fast path** — use
  `pnpm run typecheck:provider -- <name-or-path>` for provider-only diffs.
  It includes staged and unstaged files in its safety check, and falls back to
  the full `pnpm run typecheck` when the diff touches another package or shared
  package/TypeScript config. Baseline timing on 2026-06-30: full typecheck
  105.61s real, representative provider tsconfig 5.79s real; the guarded
  fast path validated at 10.33s real with
  `pnpm run typecheck:provider -- openai --base=HEAD`.
- **Validate before sending** — every POST endpoint exposes a `.schema`:
  `createOpenAi(...).v1.chat.completions.schema.safeParse(payload)` catches a
  hallucinated call locally instead of at the API.
