# AGENTS.md - Coding Guidelines for nakedapi

This file provides guidelines for AI agents working in this repository.

## Project Overview

TypeScript monorepo for AI provider packages (@nakedapi/openai, @nakedapi/xai, @nakedapi/fal, @nakedapi/kimicoding, @nakedapi/kie).
Uses pnpm workspaces, ES modules, and Vitest for testing.

Provider method paths mirror their upstream API endpoint paths (e.g., `provider.v1.chat.completions()` maps to `POST /v1/chat/completions`). Callable namespaces use `Object.assign` for dual-purpose nodes. Local helpers like `getModels()` stay flat on the provider root.

## Build/Lint/Test Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build
pnpm run build:kimicoding  # Build specific package
pnpm run build:kie
pnpm run build:xai

# Linting
pnpm run lint            # Check linting
pnpm run lint:fix        # Fix linting issues

# Formatting
pnpm run format          # Format with Prettier

# Testing
pnpm run test            # Run tests in watch mode
pnpm run test:run        # Run tests once
pnpm run test:ui         # Run tests with UI

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

GitHub Actions runs: lint -> build -> test on every PR.
All checks must pass before merging.

## Claude Code Tooling (`.claude/`)

### Hooks

- **PostToolUse**: Auto-formats `.ts`/`.tsx` files with prettier after every Edit/Write (skips `.claude/` directory files).

### Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `/cp` | "commit and push" | Stage, commit, push -- skips secrets, `.env`, `dist/` |
| `/qa` | "run qa", "check changes" | Build -> lint -> code smell scan -> tests, with summary table |
| `/strict` | "strict review" | Launches the strict FP review agent in background |

### Agents

- **strict** (cyan): FP and type-safety review agent. Reviews `packages/provider/*/src/` files for functional programming violations, `any` usage, and type-safety issues. Two modes: plan review (appends advice) and code review (fixes directly).
