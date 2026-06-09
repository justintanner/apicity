# Beads Workflow Context

> Context recovery: run `bd prime` after compaction, clear, or a new session.
> This project overrides the bd default prime text; Apicity uses a maintainer
> close workflow, not the conservative handoff-only profile.

## Project Rules

- Use `bd` for all task tracking. Do not create markdown TODO lists or external
  task trackers.
- Create or claim a bead before changing code: `bd create ... --json`, then
  `bd update <id> --claim --json`.
- Close completed beads with `bd close <id> --reason="..." --json`.
- Record follow-up work as linked beads, usually with
  `--deps discovered-from:<parent-id>`.
- Use non-interactive shell flags for file operations: `cp -f`, `mv -f`,
  `rm -f`, `rm -rf`, and similar.

## Apicity Memories

- Normal feature/fix work lands on `main`. Use `stable` only for release flow
  and release commits.
- Endpoint PRs should send one Telegram message per changed endpoint recording
  through `pnpm run harness:telegram`. Messages must use Telegram HTML
  formatting; do not send `harness-summary-full.md` raw.
- Query current persistent memories with `bd memories --json` when release
  state or older project context matters.

## Session Close Protocol

Apicity grants maintainer authority for normal repository work. Before saying
work is done:

1. Create beads for any remaining follow-up work.
2. Run relevant quality gates. For code changes, prefer `pnpm run lint` and
   `pnpm run test:run`; use focused tests first when useful.
3. Close completed beads with a specific reason.
4. Check `git status --short`.
5. Commit the intended code, fixture, docs, lockfile, and bead changes.
6. Push bead data when bead state changed: `bd dolt push`.
7. Run `git pull --rebase`, then `git push`.
8. Verify `git status --branch --short` shows the branch up to date with
   origin.

If the active user or orchestrator explicitly says not to commit, sync, or push,
that current instruction wins. Otherwise, do not leave completed work stranded
only in the local checkout.

## Essential Commands

```bash
bd ready --json
bd show <id> --json
bd update <id> --claim --json
bd close <id> --reason="Completed" --json
bd memories --json
bd dolt push
```

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm run test:run
pnpm run dev:record -- <test-file>
pnpm run dev:rerecord -- <test-file>
pnpm run harness:telegram -- --dry-run
```
