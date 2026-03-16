# NakedAPI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build](https://github.com/justintanner/nakedapi/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/nakedapi/actions)

Standalone-first TypeScript AI provider packages. Each is self-contained with zero external dependencies.

## Features

- **Standalone** — each provider is independent, no shared runtime
- **Streaming** — real-time token streaming via AsyncIterable
- **Middleware** — retry with backoff, multi-provider fallback
- **Edge Compatible** — Node.js, Cloudflare Workers, Deno
- **Strict TypeScript** — 100% typed, zero `any`
- **Polly.js Harness** — record/replay integration tests with review UI

## Architecture

```
packages/provider/
├── kimicoding/  – @nakedapi/kimicoding (Anthropic Messages API)
├── kie/         – @nakedapi/kie (media generation, chat, audio)
├── openai/      – @nakedapi/openai (chat, transcription)
└── xai/         – @nakedapi/xai (Grok chat and search)
```

## Quick Start

### Kimi for Coding

```bash
npm install @nakedapi/kimicoding
```

```typescript
import { kimicoding, type ChatRequest } from "@nakedapi/kimicoding";

const provider = kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY! });

for await (const chunk of provider.streamChat({
  model: "k2p5",
  messages: [{ role: "user", content: "Hello!" }],
})) {
  if (chunk.delta) process.stdout.write(chunk.delta);
}
```

### Kie (Media Generation)

```bash
npm install @nakedapi/kie
```

```typescript
import { kie } from "@nakedapi/kie";

const provider = kie({ apiKey: process.env.KIE_API_KEY! });

const { taskId } = await provider.createTask({
  model: "nano-banana-pro",
  input: { prompt: "A serene mountain landscape", aspect_ratio: "16:9" },
});

// Upload media for generation endpoints
const upload = await provider.uploadMedia({
  file: new Blob([fileBuffer]),
  filename: "photo.png",
});

const video = await provider.createTask({
  model: "grok-imagine/image-to-video",
  input: { image_urls: [upload.downloadUrl] },
});
```

### OpenAI (Chat & Transcription)

```bash
npm install @nakedapi/openai
```

```typescript
import { openai } from "@nakedapi/openai";

const provider = openai({ apiKey: process.env.OPENAI_API_KEY! });

// Chat with tool support
const response = await provider.chat({
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.content);

// Transcribe audio
const result = await provider.transcribe({
  file: new Blob([mp3Buffer], { type: "audio/mp3" }),
});
console.log(result.text);
```

### xAI (Grok Chat & Search)

```bash
npm install @nakedapi/xai
```

```typescript
import { xai } from "@nakedapi/xai";

const provider = xai({ apiKey: process.env.XAI_API_KEY! });

const response = await provider.chat({
  model: "grok-4-fast",
  messages: [{ role: "user", content: "Hello!" }],
});

const searchResult = await provider.search("latest TypeScript news");
```

## Providers

| Package | Endpoints | Models |
|---------|-----------|--------|
| [@nakedapi/kimicoding](packages/provider/kimicoding) | `chat`, `streamChat` | `k2p5` (262K context) |
| [@nakedapi/kie](packages/provider/kie) | `createTask`, `getTask`, `uploadMedia`, `chat`, `veo`, `suno` | Kling 3.0, Grok Imagine, Nano Banana, GPT Image, ElevenLabs |
| [@nakedapi/openai](packages/provider/openai) | `chat`, `transcribe` | `gpt-5.4-2026-03-05`, `gpt-4o-mini-transcribe` |
| [@nakedapi/xai](packages/provider/xai) | `chat`, `search` | `grok-4-fast` |

## Middleware

The `@nakedapi/kimicoding` package ships two composable middleware wrappers that decorate any provider. Both work with `coding.v1.messages()` and `.stream()`.

### `withRetry` — Exponential Backoff

Automatically retries on transient errors (HTTP 429 and 5xx). Works for both single-shot and streaming calls.

```typescript
import { kimicoding, withRetry } from "@nakedapi/kimicoding";

const provider = withRetry(
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY! }),
  {
    retries: 3,   // max retry attempts (default: 2)
    baseMs: 500,  // initial delay in ms (default: 300)
    factor: 2,    // exponential multiplier (default: 2)
    jitter: true, // randomize delay ±20% (default: true)
  }
);

// Single-shot — retries transparently on failure
const response = await provider.coding.v1.messages({
  model: "k2p5",
  messages: [{ role: "user", content: "Explain monads in one sentence." }],
});

// Streaming — retries the full stream on failure
for await (const chunk of provider.coding.v1.messages.stream({
  model: "k2p5",
  messages: [{ role: "user", content: "Write a haiku about TypeScript." }],
})) {
  if (chunk.delta) process.stdout.write(chunk.delta);
}
```

### `withFallback` — Multi-Provider Failover

Tries each provider in order. If one fails, the next picks up. Useful for redundant API keys, separate accounts, or mixing providers.

```typescript
import { kimicoding, withFallback } from "@nakedapi/kimicoding";

const provider = withFallback(
  [
    kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_PRIMARY! }),
    kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_BACKUP! }),
  ],
  {
    onFallback: (error, index) => {
      console.warn(`Provider ${index} failed, falling back:`, error);
    },
  }
);

// If the primary key hits a rate limit, the backup takes over
const response = await provider.coding.v1.messages({
  model: "k2p5",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### Composing Middleware

`withRetry` and `withFallback` return the same `Provider` interface, so they can be stacked:

```typescript
import { kimicoding, withRetry, withFallback } from "@nakedapi/kimicoding";

// Each provider retries individually, then fallback switches providers
const provider = withFallback([
  withRetry(kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_1! }), {
    retries: 2,
    baseMs: 300,
  }),
  withRetry(kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_2! }), {
    retries: 2,
    baseMs: 300,
  }),
]);

for await (const chunk of provider.coding.v1.messages.stream({
  model: "k2p5",
  messages: [{ role: "user", content: "Summarize this repo." }],
  maxTokens: 1024,
})) {
  if (chunk.delta) process.stdout.write(chunk.delta);
}
```

## Testing

```bash
pnpm run test:run               # Unit tests
pnpm run test:integration       # Integration tests (Polly.js replay)
pnpm run test:integration:record  # Re-record fixtures (needs API keys)
pnpm run harness                # Recording review UI at localhost:3475
```

## Development

```bash
pnpm install   # Install dependencies
pnpm run build # Build all packages
pnpm run lint  # Lint
```

## License

MIT — See [LICENSE](LICENSE)

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
