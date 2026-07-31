# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

**opencode users:** the [`opencode-beads`](https://github.com/joshuadavidthomas/opencode-beads) plugin auto-runs `bd prime` on session start and after compaction. Add it to your user-global opencode config (e.g. `~/.config/opencode/opencode.json`: `{ "plugin": ["opencode-beads"] }`). Without it, run `bd prime` manually at the start of each session.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Dolt Sync Recovery

**Symptom:** `bd dolt pull` fails with `Error 1105: cannot merge with uncommitted changes` after a bd schema migration.

**Invariant:** the `ignored_schema_migrations` bookkeeping table must stay UNTRACKED and listed in `dolt_ignore`. `dolt_ignore` follows git-ignore semantics: it exempts only untracked tables from Dolt's merge preflight. A tracked-but-dirty bookkeeping table blocks every pull.

**Validated recovery** (the only supported procedure — it preserves all bookkeeping rows in the working set):

```sql
CALL DOLT_RM('--cached','ignored_schema_migrations');
CALL DOLT_COMMIT('-m','untrack ignored_schema_migrations');
```

NEVER `dolt add -f` / force-commit the table: that re-tracks it and re-creates the hazard on the next migration.

**Verification:** run `scripts/check-bd-dolt-sync.sh` for the repeatable scratch + live check.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**

```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**

- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Project Overview

Apicity is a TypeScript monorepo of standalone AI provider packages (`@apicity/openai`, `@apicity/xai`, `@apicity/fal`, `@apicity/google`, `@apicity/kimicoding`, `@apicity/kie`, `@apicity/anthropic`, `@apicity/fireworks`, `@apicity/alibaba`, `@apicity/binance`, `@apicity/free-media-upload`). Each package has zero external dependencies.

Method paths mirror upstream API URL paths segment-by-segment; kebab-case becomes camelCase (e.g. `/v1/chat/completions` → `openai.v1.chat.completions()`).

`CLAUDE.md` is the canonical source for project conventions. This file is the self-sufficient summary for non-Claude harnesses (opencode, other agents). If they disagree, prefer `CLAUDE.md`.

## Commands

```bash
pnpm install                     # Install dependencies
pnpm run build                   # Build all packages
pnpm run lint                    # Full lint: format check + ESLint + repo checks
pnpm run lint:after-format       # Full lint minus format check; safe after pnpm run format
pnpm run lint:provider -- <name-or-path> # Scoped ESLint + provider-relevant checks
pnpm run typecheck:provider -- <name-or-path> # Fast provider typecheck; falls back to full on shared/package diffs
pnpm run test:run                # Run tests once (Polly.js replay; no network)
pnpm run test:affected           # Provider tests for provider-only diffs; full fallback otherwise
pnpm run test:provider -- <name-or-path> # Typecheck + replay one provider

pnpm run dev:record -- <file>    # Safe record for a NEW test (record-missing + 1Password)
pnpm run dev:rerecord -- <file>  # Destructive re-record (file filter required)
pnpm run format:changed -- [paths...] # Prettier only changed or supplied files
pnpm run dev:preflight:fast -- <name-or-path> # Fast provider gate: scoped format+lint, whole tests-project typecheck, provider typecheck+test, cross-cutting recording tests
pnpm run dev:preflight:provider -- <name-or-path> # Explicit alias for the fast provider gate
pnpm run dev:preflight:changed -- [paths...] # Changed-file format/lint plus full typecheck+test
pnpm run dev:preflight           # Full local gate: format + typecheck + lint:after-format + test:run
pnpm run ci:local                # Full CI-style gate: audit + gen:examples:check + build + lint + test:run
pnpm run harness:telegram -- --dry-run # Preview per-endpoint Telegram messages (changed recordings)
pnpm run harness:telegram -- --all <pattern> --dry-run # Preview ANY recording by name/path substring

pnpm run check:op                # Verify 1Password service account is working
pnpm run harness                 # Local HAR viewer at localhost:3475
pnpm run gc:review-proof -- --watch <file> -- <command> [args...]
```

## Concurrent Review Proofs

Gas City starter review lanes can share one source-anchor worktree. Every proof
command run from a shared review worktree must use `gc:review-proof` and name
each source file whose contents make the result meaningful:

```bash
pnpm run gc:review-proof -- \
  --watch packages/provider/kie/src/kie.ts \
  --watch packages/provider/kie/src/zod.ts \
  -- pnpm run test:provider kie
```

The runner prints SHA-256 snapshots before and after the command, watches the
files while it runs, preserves the command's exit status when they stay stable,
and exits 86 if it observes interference. Discard an interfered result and run
the proof again. Never make and restore mutation probes in a shared source
anchor; use an isolated worktree for any proof that intentionally edits source.

Provider-scoped commands accept either `openai`-style names or paths such as
`packages/provider/openai/src/openai.ts` and
`tests/integration/openai-chat.test.ts`. For narrow provider work, use
`pnpm run dev:preflight:fast -- <name-or-path>`; it prints
the <!-- fast-gate-steps:start -->scoped format<!-- fast-gate-step:format -->
and scoped lint<!-- fast-gate-step:lint --> steps, the whole tests-project
typecheck<!-- fast-gate-step:typecheck-tests -->, the provider typecheck and
replay<!-- fast-gate-step:test-provider -->, and the cross-cutting
recording-enumeration
tests<!-- fast-gate-step:cross-cutting --><!-- fast-gate-steps:end --> as it
runs them. From inside a
provider package, run `pnpm -w run dev:preflight:fast` to infer the provider
from pnpm's `INIT_CWD`. Keep `pnpm run dev:preflight` and
`pnpm run ci:local` for shared scripts/config, package metadata, docs, test
harness changes, release prep, or any ambiguous diff that needs the full
repository gate. Changed-file commands infer from `origin/main...HEAD`,
staged/unstaged changes, and untracked files, or accept explicit paths after
`--`. Use `pnpm run typecheck:provider -- <name-or-path>` for typecheck-only
local iteration; it falls back to the full typecheck when the diff, including
staged and unstaged files, touches another package or shared package/TypeScript
config.

## Adding a New Endpoint

Work through the standard endpoint flow: research the upstream docs → add
types/schema/factory → record a HAR fixture → verify replay → preview the
Telegram message → run the gates → open the PR (one endpoint per PR).

Two invariants worth knowing:

- **URL comment (lint-enforced)** — a 2-line comment immediately above each endpoint property in the factory (`// {METHOD} {full upstream URL}` then `// Docs: {docs URL}`), plus a matching `(provider, dotPath, method, fullUrl, docsUrl)` row in `scripts/endpoint-docs.tsv`. Checked by `pnpm run lint:endpoints`; the docs hostname must be on the provider's allow-list in `scripts/check-endpoint-comments.mjs`. For overloaded endpoints, comment the default path.
- **One endpoint per PR.**

## Integration Test Recording

All tests use Polly.js HTTP record/replay — no mocks. Recordings live under `tests/recordings/` as HAR files and are committed alongside source.

Two recording modes:

- **`record-missing` (default, safe)** — Only records tests whose HAR files don't exist yet. Existing recordings replay from disk. Use this when _adding_ a new test. Safe without a file filter.
- **`record` (destructive)** — Overwrites existing HAR files. Use only when intentionally re-recording. **Hard-errors if run without a test file filter** (`tests/record.mjs` enforces this). Override with `POLLY_FORCE_ALL=1` only if you really mean to re-record everything.

Workflow for a new test:

```bash
# Record only the new test's fixtures; existing HARs untouched.
pnpm run dev:record -- tests/integration/<file>.test.ts

# Verify pure replay:
pnpm run test:run tests/integration/<file>.test.ts
```

For provider-only changes, `pnpm run test:affected` reads the current git diff
(committed, staged, unstaged, and untracked files) and runs the matching
`test:provider` subset. It falls back to full `pnpm run test:run` for shared
scripts/config, package metadata, unit or functional tests, docs, and ambiguous
paths. Run `pnpm run test:run` directly when you need an explicit full local
replay.

**Pitfall:** `pnpm run dev:rerecord` without a file filter will refuse to run (by design). Do not set `POLLY_FORCE_ALL=1` to force it — prefer deleting the specific recording directory and re-running `dev:record` on that one test.

API keys resolve at runtime via the 1Password CLI (`op run --env-file=.env`). The tracked `.env` file contains 1Password references only.

## Code Conventions

- ES modules; target ES2022; strict mode; `@typescript-eslint/no-explicit-any: "error"`
- Double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char width
- PascalCase for types/interfaces/errors, camelCase for functions
- Error classes: extend `Error`, include `status` field, named `<Provider>Error`
- Prefer `interface` over `type` for object shapes
- `Record<string, unknown>` for API request/response bodies

## Gascity Handoff

Some `bd` issues are owned by `jwt-gascity[bot]@users.noreply.github.com`. Do not reassign those unless you are the bot. Use `bd search gascity` to surface interop-related work.

<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:0a1bbe8a -->

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Quality

- Use `--acceptance` and `--design` fields when creating issues
- Use `--validate` to check description completeness

### Lifecycle

- `bd defer <id>` / `bd supersede <id>` for issue management
- `bd stale` / `bd orphans` / `bd lint` for hygiene
- `bd human <id>` to flag for human decisions
- `bd formula list` / `bd mol pour <name>` for structured workflows

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- No manual export/import needed!

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

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

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->

## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

<!-- END BEADS CODEX SETUP -->
