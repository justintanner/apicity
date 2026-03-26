# AGENTS.md - Coding Guidelines for nakedapi

This file provides guidelines for AI agents working in this repository.

## Project Overview

TypeScript monorepo for AI provider packages (@nakedapi/openai, @nakedapi/xai, @nakedapi/fal, @nakedapi/kimicoding, @nakedapi/kie).
Uses pnpm workspaces, ES modules, and Vitest for testing.

Provider method paths mirror their upstream API endpoint paths (e.g., `provider.v1.chat.completions()` maps to `POST /v1/chat/completions`). Callable namespaces use `Object.assign` for dual-purpose nodes. POST endpoints expose `.payloadSchema` and `.validatePayload(data)` for runtime validation.

## Build/Lint/Test Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build
pnpm run build:kimicoding  # Build specific package
pnpm run build:kie
pnpm run build:xai
pnpm run build:openai
pnpm run build:fal

# Linting
pnpm run lint            # Check linting
pnpm run lint:fix        # Fix linting issues

# Formatting
pnpm run format          # Format with Prettier

# Testing
pnpm run test            # Run tests in watch mode
pnpm run test:run        # Run tests once
pnpm run test:ui         # Run tests with UI
pnpm run test:integration       # Integration tests (Polly.js replay)
pnpm run test:integration:record  # Re-record fixtures (needs API keys)

# Run single test file
pnpm run test:run tests/unit/providers/kimicoding.test.ts

# Clean build artifacts
pnpm run clean
```

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2022, Module: ESNext
- Strict mode enabled
- Use explicit types over `any`
- Prefer interface over type for object shapes

### Imports

- Use ES modules (`"type": "module"`)
- Group imports: external deps first, then internal
- Use relative imports for same-package files
- Example:

```typescript
import { ChatRequest, ChatResponse } from "./types";
import { sseToIterable } from "./sse";
```

### Formatting (Prettier)

- Semi-colons: required
- Single quotes: NO (use double quotes)
- Trailing commas: ES5 compatible
- Print width: 80
- Tab width: 2 spaces
- Arrow function parentheses: always

### Naming Conventions

- Functions: camelCase (e.g., `completions`, `createTask`)
- Types/Interfaces: PascalCase (e.g., `ChatRequest`, `Provider`)
- Error classes: PascalCase ending with "Error" (e.g., `KimiCodingError`)
- Private helpers: camelCase with descriptive names
- Type guards: `is<Name>` pattern (e.g., `isAnthropicErrorBody`)

### Error Handling

- Create custom error classes extending Error
- Include HTTP status codes in error objects
- Use type guards to safely parse API responses
- Always clear timeouts in finally blocks
- Example:

```typescript
export class KimiCodingError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "KimiCodingError";
    this.status = status;
  }
}
```

### Testing

- Use Vitest with globals enabled
- Mock external APIs using vi.fn()
- Store mock data in tests/setup.ts
- Test file pattern: `*.test.ts`
- Integration tests with real dependencies (no mocks for core logic)

### File Organization

```
packages/provider/<name>/
  src/
    index.ts      # Public exports
    types.ts      # Type definitions
    <name>.ts     # Main implementation
    *.ts          # Helper modules
  package.json
  tsconfig.json
```

### Environment Variables

- Store secrets in env vars, never commit them
- Use `.env` files for local development
- Access via `process.env.VAR_NAME`

## Package Management

- Use pnpm with workspace protocol for internal deps
- Node.js >= 18.12.0 required
- Always run `pnpm install` after pulling changes

## CI/CD

GitHub Actions (`ci.yml`) runs three jobs on push/PR to main:
1. **build** — install, build, verify artifacts
2. **test** — lint, unit tests, integration tests (replay mode)
3. **harness-report** (PRs only) — generates a recording diff report in the job summary

All checks must pass before merging. The harness report shows new/modified HAR recordings for human review.

## Beads Task Tracking

Hooks auto-inject `bd prime` at session start and before compaction.

| Command | Description |
|---------|-------------|
| `bd ready` | Find unblocked work |
| `bd create "Title"` | Create a new task |
| `bd close <id>` | Complete a task |
| `bd sync` | Sync issues with git |

## Development Workflow

Follow the step-by-step workflow in `CLAUDE.md` § "Development Workflow" when picking up beads issues. The sequence is:

1. **Claim** — `bd ready` → `bd update <id> --status in_progress` → feature branch
2. **Implement** — code the feature following the provider pattern
3. **Format** — `pnpm run format`
4. **Lint (gate)** — `pnpm run lint` — must pass before proceeding
5. **Unit tests (gate)** — `pnpm run test:run` — must pass before proceeding
6. **Integration tests** — record fixtures, verify replay, STOP for human review
7. **PR** — push branch, `gh pr create`, reference beads issue ID
8. **CI** — build + test + harness report run automatically
9. **Human review** — user reviews code + harness report in GitHub
10. **After merge** — `bd close <id> && bd sync`

Do NOT skip gates. Do NOT commit recordings — the user reviews and commits them.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
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

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
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

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
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
