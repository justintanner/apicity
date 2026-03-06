# NakedAPI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build](https://github.com/justintanner/nakedapi/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/nakedapi/actions)

NakedAPI is a **standalone-first** TypeScript platform for integrating AI providers. Each package is **completely self-contained** with no external dependencies.

## What's Included

- **Standalone Packages**: Each provider is completely independent
- **Streaming-First**: Real-time token streaming with AsyncIterable
- **Middleware**: Built-in retry with exponential backoff, multi-provider fallback
- **Edge Compatible**: Works everywhere from Node.js to Cloudflare Workers
- **Strict TypeScript**: 100% typed, zero `any` types
- **Polly.js Test Harness**: Record/replay integration tests with a web UI for reviewing recordings

## Architecture

```
packages/provider/
├── kimicoding/  – @nakedapi/kimicoding (Kimi for Coding, Anthropic Messages API)
├── kie/         – @nakedapi/kie (KIE AI media generation, chat, audio)
└── xai/         – @nakedapi/xai (X.AI / Grok chat and search)
```

Each package is standalone with zero dependencies. Copy-paste the architecture and middleware as needed.

## Quick Start

### Kimi for Coding (Chat)

```bash
npm install @nakedapi/kimicoding
```

```typescript
import { kimicoding, type ChatRequest } from "@nakedapi/kimicoding";

const provider = kimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});

const request: ChatRequest = {
  model: "k2p5",
  messages: [{ role: "user", content: "Hello!" }],
};

// Stream responses
for await (const chunk of provider.streamChat(request)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

### Kie (Media Generation)

```bash
npm install @nakedapi/kie
```

```typescript
import { kie } from "@nakedapi/kie";

const provider = kie({
  apiKey: process.env.KIE_API_KEY!,
});

// Generate an image
const result = await provider.generate({
  model: "nano-banana-pro",
  input: {
    prompt: "A serene mountain landscape",
    aspect_ratio: "16:9",
  },
});

console.log("Image URL:", result.imageUrl);

// Upload a local file to get a public URL for generation endpoints
const upload = await provider.uploadMedia({
  file: new Blob([fileBuffer]),
  filename: "photo.png",
});

// Use the URL with an image-to-video model
const video = await provider.generate({
  model: "grok-imagine/image-to-video",
  input: { image_urls: [upload.downloadUrl] },
});
```

### xAI (Grok Chat & Search)

```bash
npm install @nakedapi/xai
```

```typescript
import { xai } from "@nakedapi/xai";

const provider = xai({
  apiKey: process.env.XAI_API_KEY!,
});

// Chat
const response = await provider.chat({
  model: "grok-4-fast",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.content);

// Search X
const searchResult = await provider.search("latest TypeScript news");
console.log(searchResult.content);
```

## Available Providers

### [@nakedapi/kimicoding](packages/provider/kimicoding)

Kimi for Coding provider using Anthropic Messages API format.

- **Zero Dependencies**: Everything included
- **Streaming Chat**: Real-time token streaming
- **Anthropic API Format**: Uses `/v1/messages` endpoint
- **Models**: `k2p5` (262,144 context, 32,768 max output)
- **Middleware**: Retry, fallback built-in

### [@nakedapi/kie](packages/provider/kie)

Kie provider for media generation, chat, and audio.

- **Zero Dependencies**: Everything included
- **Video Models**: Kling 3.0, Grok Imagine, Seedance 1.5 Pro, Sora Watermark Remover
- **Image Models**: Grok Imagine, Nano Banana Pro, Nano Banana 2, GPT Image, Seedream
- **Audio Models**: ElevenLabs text-to-dialogue, sound effects, speech-to-text
- **Sub-Providers**: Veo (Google video), Suno (music generation), Chat
- **File Upload**: Upload local media files to get public URLs for generation endpoints
- **Task Polling**: Built-in polling with progress callbacks

### [@nakedapi/xai](packages/provider/xai)

X.AI / Grok provider for chat and search.

- **Zero Dependencies**: Everything included
- **Chat Completions**: OpenAI-compatible chat API
- **X Search**: Built-in tool for searching X/Twitter
- **Tool Use**: Function calling support
- **Models**: `grok-4-fast`

## Middleware

Both `kimicoding` and `kie` providers support the same middleware pattern:

```typescript
import { kimicoding, withRetry, withFallback } from "@nakedapi/kimicoding";

const provider = withRetry(kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY! }), {
  retries: 3,
  baseMs: 500,
});

const fallbackProvider = withFallback([
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_1! }),
  kimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_2! }),
]);
```

## Testing

### Unit Tests

Unit tests live in `tests/unit/` and run with Vitest:

```bash
pnpm run test:run
```

### Integration Tests (Polly.js)

Integration tests use [Polly.js](https://netflix.github.io/pollyjs/) to record and replay real HTTP interactions. This means tests run against actual API responses but don't require live API keys after the initial recording.

Recordings are stored as HAR files in `tests/recordings/`.

**Run integration tests (replay mode):**

```bash
pnpm run test:integration
```

**Record new fixtures (requires API keys):**

```bash
pnpm run test:integration:record
```

The test harness (`tests/harness.ts`) configures Polly with:
- `record` / `replay` / `passthrough` modes via `POLLY_MODE` env var
- Fetch adapter for intercepting HTTP requests
- File system persister for saving HAR recordings
- Automatic redaction of `Authorization` headers before persisting
- Zero-delay timing in replay mode for fast test runs

### Recording Review UI

A built-in web UI lets you inspect and approve new or modified Polly recordings before committing them:

```bash
pnpm run harness
```

This starts a local server at `http://localhost:3475` with:
- **Sidebar** listing all recordings with git status indicators (green = clean, yellow = modified, red = new)
- **Request/Response panes** showing headers and syntax-highlighted JSON bodies
- **Approve button** that stages the recording via `git add`

## Development

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

### Lint

```bash
pnpm run lint
```

## License

MIT - See [LICENSE](LICENSE)

## Acknowledgments

- Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac
- MIT License
