# BareAPI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build](https://github.com/justintanner/bareapi/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/bareapi/actions)

BareAPI is a **standalone-first** TypeScript platform for integrating AI providers. Each package is **completely self-contained** with no external dependencies.

## Credit

This project is based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac, licensed under MIT. TetherAI provided the architectural foundation and code patterns used in this repository.

## What's Included

- **Standalone Packages**: Each provider is completely independent
- **Streaming-First**: Real-time token streaming with AsyncIterable
- **Middleware**: Built-in retry with exponential backoff, multi-provider fallback
- **Edge Compatible**: Works everywhere from Node.js to Cloudflare Workers
- **Strict TypeScript**: 100% typed, zero `any` types

## Architecture

```
packages/provider/
├── kimi25/   – @bareapi/kimi25 (Moonshot AI / Kimi chat models)
└── kie/      – @bareapi/kie (KIE AI media generation)
```

Each package is standalone with zero dependencies. Copy-paste the architecture and middleware as needed.

## Quick Start

### Kimi25 (Chat)

```bash
npm install @bareapi/kimi25
```

```typescript
import { kimi25, type ChatRequest } from "@bareapi/kimi25";

const provider = kimi25({
  apiKey: process.env.KIMI25_API_KEY!,
});

const request: ChatRequest = {
  model: "kimi-k2-5",
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
npm install @bareapi/kie
```

```typescript
import { kie } from "@bareapi/kie";

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
```

## Available Providers

### [@bareapi/kimi25](packages/provider/kimi25)

Kimi25 (Moonshot AI) provider for chat completions.

- **Zero Dependencies**: Everything included
- **Streaming Chat**: Real-time token streaming
- **Models**: `kimi-k2-5` (131K context)
- **Middleware**: Retry, fallback built-in

### [@bareapi/kie](packages/provider/kie)

Kie provider for media generation.

- **Zero Dependencies**: Everything included
- **Video Models**: Kling 3.0, Grok Imagine
- **Image Models**: Grok Imagine, Nano Banana Pro
- **Task Polling**: Built-in polling with progress callbacks

## Middleware

Both providers support the same middleware pattern:

```typescript
import { kimi25, withRetry, withFallback } from "@bareapi/kimi25";

const provider = withRetry(kimi25({ apiKey: process.env.KIMI25_API_KEY! }), {
  retries: 3,
  baseMs: 500,
});

const fallbackProvider = withFallback([
  kimi25({ apiKey: process.env.KIMI25_API_KEY_1! }),
  kimi25({ apiKey: process.env.KIMI25_API_KEY_2! }),
]);
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

### Test

```bash
pnpm run test:run
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
