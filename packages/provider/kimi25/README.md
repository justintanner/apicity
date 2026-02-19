# @bareapi/kimi25

Kimi25 (Moonshot AI) provider for BareAPI - **completely standalone** with streaming-first API and built-in middleware.

## Installation

```bash
npm install @bareapi/kimi25
# or
yarn add @bareapi/kimi25
# or
pnpm add @bareapi/kimi25
```

**No other dependencies required!**

## Quick Start

```typescript
import { kimi25, type ChatRequest } from "@bareapi/kimi25";

// Create provider
const provider = kimi25({
  apiKey: process.env.KIMI25_API_KEY!,
});

// Use it
const request: ChatRequest = {
  model: "kimi-k2-5",
  messages: [{ role: "user", content: "Hello!" }],
};

for await (const chunk of provider.streamChat(request)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

## What's Included

- **Core Types**: `ChatRequest`, `ChatMessage`, `Provider`, etc.
- **Kimi25 Implementation**: Streaming chat completion for Moonshot AI
- **SSE Utilities**: Server-Sent Events handling
- **Middleware**: Retry and fallback functionality
- **Error Handling**: Kimi25-specific error types

## Middleware Usage

```typescript
import { kimi25, withRetry, withFallback } from "@bareapi/kimi25";

const baseProvider = kimi25({
  apiKey: process.env.KIMI25_API_KEY!,
});

// Add retry logic
const resilientProvider = withRetry(baseProvider, {
  retries: 3,
  baseMs: 500,
});

// Add fallback logic
const fallbackProvider = withFallback([
  kimi25({ apiKey: process.env.KIMI25_API_KEY! }),
  kimi25({ apiKey: process.env.KIMI25_API_KEY_2! }),
]);
```

## Configuration Options

```typescript
const provider = kimi25({
  apiKey: "your-api-key",
  baseURL: "https://api.moonshot.cn/v1", // optional
  timeout: 30000, // optional, default: 30000ms
  maxRetries: 3, // optional, default: 3
  fetch: customFetch, // optional, custom fetch implementation
});
```

## Environment Variables

```bash
KIMI25_API_KEY=your-api-key
KIMI25_BASE_URL=https://api.moonshot.cn/v1
KIMI25_TIMEOUT=30000
KIMI25_MAX_RETRIES=3
```

## Supported Models

- `kimi-k2-5` (131,072 context tokens)

## Why Standalone?

- **Faster Installation**: No extra dependencies
- **Smaller Bundle**: Only what you need
- **Easier Maintenance**: Self-contained package
- **Focused**: Kimi25-specific functionality only

## License

MIT
