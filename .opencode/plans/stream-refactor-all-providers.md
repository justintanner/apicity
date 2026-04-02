# Refactor Plan: Move .stream to post.stream namespace

## Overview

Move streaming methods from being appended as `.stream` properties to being accessed via a `post.stream` namespace prefix.

## Providers Affected

### 1. fireworks (3 methods)

**Current:**

- `fireworks.post.v1.chat.completions.stream()`
- `fireworks.post.v1.completions.stream()`
- `fireworks.post.v1.messages.stream()`

**New:**

- `fireworks.post.stream.v1.chat.completions()`
- `fireworks.post.stream.v1.completions()`
- `fireworks.post.stream.v1.messages()`

**Files:**

- `packages/provider/fireworks/src/types.ts` - Update interfaces
- `packages/provider/fireworks/src/fireworks.ts` - Move stream implementations
- Update tests in `tests/integration/fireworks-stream.test.ts`

### 2. anthropic (1 method)

**Current:**

- `anthropic.post.v1.messages.stream()`

**New:**

- `anthropic.post.stream.v1.messages()`

**Files:**

- `packages/provider/anthropic/src/types.ts` - Update interfaces
- `packages/provider/anthropic/src/anthropic.ts` - Move stream implementation
- Update tests in `tests/integration/anthropic-messages-stream.test.ts`
- Update README.md

### 3. fal (1 method)

**Current:**

- `fal.post.v1.serverless.logs.stream()`

**New:**

- `fal.post.stream.v1.serverless.logs()`

**Files:**

- `packages/provider/fal/src/types.ts` - Update interfaces
- `packages/provider/fal/src/fal.ts` - Move stream implementation
- Update tests in `tests/integration/fal-logs.test.ts`

## Changes Required

### For each provider:

1. **Types (types.ts):**
   - Remove `stream` property from method interfaces
   - Add new method interface without stream (e.g., `FireworksChatCompletionsMethod` without `stream`)
   - Add `Stream` namespace interface (e.g., `FireworksPostStreamV1`)
   - Update `Provider` interface to include `post.stream` namespace

2. **Implementation (\*.ts):**
   - Extract stream implementations from existing method objects
   - Create new `postStreamV1` (or similar) namespace object
   - Remove `stream` from original method objects
   - Update return object to include `post.stream` namespace

3. **Tests:**
   - Update all test files that use `.stream()` to use new API path
   - Re-record integration fixtures if needed

## Example Change Pattern

### Before:

```typescript
const messages = Object.assign(chatImpl, {
  stream: Object.assign(streamImpl, { ... }),
  payloadSchema: messagesSchema,
  validatePayload(data) { ... }
});

return {
  post: { v1: { messages } }
};
```

### After:

```typescript
const messages = Object.assign(chatImpl, {
  payloadSchema: messagesSchema,
  validatePayload(data) { ... }
});

const streamMessages = Object.assign(streamImpl, {
  payloadSchema: messagesSchema,
  validatePayload(data) { ... }
});

return {
  post: {
    v1: { messages },
    stream: { v1: { messages: streamMessages } }
  }
};
```

## Testing Strategy

1. Run unit tests: `pnpm run test:run`
2. Check TypeScript compilation
3. Run integration tests in replay mode
4. Update any failing tests
