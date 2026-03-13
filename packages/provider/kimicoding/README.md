# @nakedapi/kimicoding

Kimi for Coding provider for NakedAPI - **completely standalone** with Anthropic Messages API format, streaming-first API, and built-in middleware.

## Installation

```bash
npm install @nakedapi/kimicoding
# or
yarn add @nakedapi/kimicoding
# or
pnpm add @nakedapi/kimicoding
```

**No other dependencies required!**

## Quick Start

```typescript
import { kimicoding, type ChatRequest } from "@nakedapi/kimicoding";

// Create provider
const provider = kimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});

// Use it
const request: ChatRequest = {
  model: "k2p5",
  messages: [{ role: "user", content: "Hello!" }],
};

for await (const chunk of provider.coding.v1.messages.stream(request)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

## What's Included

- **Core Types**: `ChatRequest`, `ChatMessage`, `Provider`, etc.
- **KimiCoding Implementation**: Streaming chat using Anthropic Messages API format
- **SSE Utilities**: Server-Sent Events handling for Anthropic-style events
- **Middleware**: Retry and fallback functionality
- **Error Handling**: KimiCoding-specific error types

## Chat Completions

### Streaming

```typescript
import { kimicoding } from "@nakedapi/kimicoding";

const provider = kimicoding({ apiKey: "your-api-key" });

const request = {
  model: "k2p5",
  messages: [{ role: "user", content: "Hello!" }],
  temperature: 0.7,
  maxTokens: 8192,
};

for await (const chunk of provider.coding.v1.messages.stream(request)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

### Non-Streaming

```typescript
const response = await provider.coding.v1.messages(request);
console.log(response.content);
console.log(response.usage); // token counts
```

### Promises (no async/await)

```javascript
import { kimicoding, textBlock, imageBase64 } from "@nakedapi/kimicoding";

const provider = kimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY,
  timeout: 60000,
});

provider.coding.v1
  .messages({
    model: "k2p5",
    messages: [{ role: "user", content: "What is the capital of France?" }],
    maxTokens: 256,
  })
  .then(function (response) {
    console.log(response.content);

    // Chain a vision request
    return provider.coding.v1.messages({
      model: "k2p5",
      messages: [
        {
          role: "user",
          content: [
            imageBase64(pngBase64String, "image/png"),
            textBlock("Describe this image."),
          ],
        },
      ],
      maxTokens: 512,
    });
  })
  .then(function (response) {
    console.log(response.content);
  })
  .catch(function (err) {
    console.error(err.message);
  });
```

## Middleware Usage

```typescript
import { kimicoding, withRetry, withFallback } from "@nakedapi/kimicoding";

const baseProvider = kimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});

// Add retry logic
const resilientProvider = withRetry(baseProvider, {
  retries: 3,
  baseMs: 500,
});

// Add fallback logic
const fallbackProvider = withFallback([
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY! }),
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_2! }),
]);
```

## Configuration Options

```typescript
const provider = kimicoding({
  apiKey: "your-api-key",
  baseURL: "https://api.kimi.com/coding/", // optional
  timeout: 30000, // optional, default: 30000ms
  maxRetries: 3, // optional, default: 3
  fetch: customFetch, // optional, custom fetch implementation
});
```

## Environment Variables

```bash
KIMI_CODING_API_KEY=your-api-key
```

## Supported Models

- `k2p5` (262,144 context window, 32,768 max output tokens)

## API Format

Kimi for Coding uses the **Anthropic Messages API format** (`/v1/messages`), not OpenAI-compatible chat completions. System prompts are sent as a top-level `system` field rather than in the messages array.

## Why Standalone?

- **Faster Installation**: No extra dependencies
- **Smaller Bundle**: Only what you need
- **Easier Maintenance**: Self-contained package
- **Focused**: Kimi for Coding-specific functionality only

## License

MIT
