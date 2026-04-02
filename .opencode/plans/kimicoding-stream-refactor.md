# Plan: Rename KimiCoding stream API from `messages.stream` to `post.stream`

## Current State

The KimiCoding provider currently has the streaming endpoint nested under `messages`:

```typescript
provider.post.coding.v1.messages(); // non-streaming
provider.post.coding.v1.messages.stream(); // streaming
```

## Target State

Move the stream indicator to the beginning as a namespace:

```typescript
provider.post.coding.v1.messages(); // non-streaming
provider.post.stream.coding.v1.messages(); // streaming
```

## Files to Modify

### 1. packages/provider/kimicoding/src/types.ts

**Changes:**

- Remove `stream` property from `KimiCodingMessagesNamespace`
- Add `KimiCodingMessagesMethod` interface (without stream)
- Add `KimiCodingPostStreamV1` interface
- Update `KimiCodingPostV1` to use `KimiCodingMessagesMethod` (no stream)
- Update `Provider` interface to include `post.stream` namespace

**Lines affected:** 168-206

### 2. packages/provider/kimicoding/src/kimicoding.ts

**Changes:**

- Remove `stream` property from `messages` object assignment
- Create separate `streamMessages` const for the stream namespace
- Update the return object to include `post.stream.coding.v1.messages`

**Lines affected:** 284-323

### 3. tests/integration/kimicoding-chat.test.ts

**Changes:**

- Update streaming call on line 38: `provider.post.coding.v1.messages.stream()` → `provider.post.stream.coding.v1.messages()`
- Update streaming call on line 96: same change

**Lines affected:** 38, 96

### 4. tests/recordings/\* (regenerate fixtures)

**Changes:**

- Re-record integration tests since the request signature changed
- Files affected:
  - `tests/recordings/kimicoding_90644969/stream-hi_4133216507/recording.har`
  - `tests/recordings/kimicoding_90644969/stream-image-base64_1949100831/recording.har`

## API Change Summary

| Endpoint           | Current API                                 | New API                                          |
| ------------------ | ------------------------------------------- | ------------------------------------------------ |
| Non-streaming chat | `provider.post.coding.v1.messages()`        | `provider.post.coding.v1.messages()` (no change) |
| Streaming chat     | `provider.post.coding.v1.messages.stream()` | `provider.post.stream.coding.v1.messages()`      |

## Testing Strategy

1. Run unit tests: `pnpm run test:run`
2. Re-record integration fixtures: `pnpm run test:integration:record`
3. Verify replay mode: `pnpm run test:integration`
4. Run lint: `pnpm run lint`

## Implementation Order

1. Update types.ts
2. Update kimicoding.ts
3. Update kimicoding-chat.test.ts
4. Run unit tests to verify
5. Re-record integration fixtures
6. Run integration tests
7. Run lint
8. Push changes
