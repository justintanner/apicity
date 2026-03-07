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

```typescript
import { kimicoding, withRetry, withFallback } from "@nakedapi/kimicoding";

const provider = withRetry(kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY! }), {
  retries: 3,
  baseMs: 500,
});

const fallback = withFallback([
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_1! }),
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_2! }),
]);
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
