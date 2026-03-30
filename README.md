# NakedAPI

[![CI](https://github.com/justintanner/nakedapi/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/nakedapi/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/justintanner/nakedapi/pulls)

Standalone-first TypeScript AI provider packages. Each is self-contained with zero external dependencies.

## Features

- **Standalone** — each provider is independent, no shared runtime
- **Streaming** — real-time token streaming via AsyncIterable
- **Middleware** — [retry with backoff](#withretry--exponential-backoff), [multi-provider fallback](#withfallback--multi-function-failover)
- **Edge Compatible** — Node.js, Cloudflare Workers, Deno
- **Strict TypeScript** — 100% typed, zero `any`
- **Payload Validation** — [per-endpoint schema and runtime validation](#payload-validation)
- **Polly.js Harness** — record/replay integration tests with review UI

## Providers

| Package                                              | Version                                                                                                                             | Description                                                                                                              | Docs                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [@nakedapi/openai](packages/provider/openai)         | [![npm](https://img.shields.io/npm/v/@nakedapi/openai?color=cb0000&label=)](https://www.npmjs.com/package/@nakedapi/openai)         | Chat, embeddings, images, responses, audio                                                                               | [README](packages/provider/openai/README.md#endpoints)     |
| [@nakedapi/xai](packages/provider/xai)               | [![npm](https://img.shields.io/npm/v/@nakedapi/xai?color=cb0000&label=)](https://www.npmjs.com/package/@nakedapi/xai)               | Grok chat, images, video, files, batches, collections, search                                                            | [README](packages/provider/xai/README.md#endpoints)        |
| [@nakedapi/fal](packages/provider/fal)               | [![npm](https://img.shields.io/npm/v/@nakedapi/fal?color=cb0000&label=)](https://www.npmjs.com/package/@nakedapi/fal)               | Model registry, pricing, usage, analytics                                                                                | [README](packages/provider/fal/README.md#endpoints)        |
| [@nakedapi/kimicoding](packages/provider/kimicoding) | [![npm](https://img.shields.io/npm/v/@nakedapi/kimicoding?color=cb0000&label=)](https://www.npmjs.com/package/@nakedapi/kimicoding) | Anthropic Messages API format, streaming                                                                                 | [README](packages/provider/kimicoding/README.md#endpoints) |
| [@nakedapi/kie](packages/provider/kie)               | [![npm](https://img.shields.io/npm/v/@nakedapi/kie?color=cb0000&label=)](https://www.npmjs.com/package/@nakedapi/kie)               | Media generation (video/image/audio), sub-providers                                                                      | [README](packages/provider/kie/README.md#endpoints)        |
| [@nakedapi/anthropic](packages/provider/anthropic)   | [![npm](https://img.shields.io/npm/v/@nakedapi/anthropic?color=cb0000&label=)](https://www.npmjs.com/package/@nakedapi/anthropic)   | Messages (streaming, token counting), batches, files, models, skills (beta), admin org/users/invites/workspaces/api_keys | [README](packages/provider/anthropic/README.md#endpoints)  |

## Quick Start

```bash
npm install @nakedapi/xai
```

```typescript
import { xai as createXai } from "@nakedapi/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });

// Generate an image with Grok
const image = await xai.v1.images.generations({
  prompt: "A mass of thousands of rubber ducks spilling out of a warehouse",
  model: "grok-2-image",
  n: 1,
});

console.log(image.data[0].url);
```

Every provider works the same way: a factory function that takes `{ apiKey }` and returns an object whose method paths mirror the upstream API URL paths. See [Endpoint Naming](#endpoint-naming) below.

> **More examples:** [OpenAI](packages/provider/openai/README.md#usage-examples) | [xAI](packages/provider/xai/README.md#usage-examples) | [Fal](packages/provider/fal/README.md#usage-examples) | [KimiCoding](packages/provider/kimicoding/README.md#quick-start) | [KIE](packages/provider/kie/README.md#usage) | [Anthropic](packages/provider/anthropic/README.md#usage-examples)

## Endpoint Naming

Method paths mirror upstream API URL paths segment-by-segment. Kebab-case segments become camelCase.

```
URL path:     /v1/chat/completions       →  openai.v1.chat.completions()
URL path:     /v1/language-models        →  xai.v1.languageModels()
URL path:     /api/v1/common/download-url →  kie.api.v1.common.downloadUrl()
```

Full endpoint tables are in each provider's README: [OpenAI](packages/provider/openai/README.md#endpoints) | [xAI](packages/provider/xai/README.md#endpoints) | [Fal](packages/provider/fal/README.md#endpoints) | [KimiCoding](packages/provider/kimicoding/README.md#endpoints) | [KIE](packages/provider/kie/README.md#endpoints) | [Anthropic](packages/provider/anthropic/README.md#endpoints)

## Middleware

Every package exports `withRetry` and `withFallback` — generic function-level wrappers that work with any `(req, signal?) => Promise<T>` call. `@nakedapi/kimicoding` additionally exports `withStreamRetry` and `withStreamFallback` for async iterables.

### `withRetry` — Exponential Backoff

Retries on transient errors (HTTP 429 and 5xx) with configurable backoff.

```typescript
import { openai as createOpenai, withRetry } from "@nakedapi/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });

const chat = withRetry(openai.v1.chat.completions, {
  retries: 3, // max retry attempts (default: 2)
  baseMs: 500, // initial delay in ms (default: 300)
  factor: 2, // exponential multiplier (default: 2)
  jitter: true, // randomize delay ±20% (default: true)
});
```

### `withFallback` — Multi-Function Failover

Tries each function in order. If one fails, the next picks up.

```typescript
import { openai as createOpenai, withFallback } from "@nakedapi/openai";

const primary = createOpenai({ apiKey: process.env.OPENAI_KEY_PRIMARY! });
const backup = createOpenai({ apiKey: process.env.OPENAI_KEY_BACKUP! });

const chat = withFallback([
  primary.v1.chat.completions,
  backup.v1.chat.completions,
]);
```

### Composing Middleware

Wrappers return plain functions with the same signature, so they compose naturally:

```typescript
import {
  kimicoding as createKimicoding,
  withRetry,
  withFallback,
} from "@nakedapi/kimicoding";

const kimi1 = createKimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_1! });
const kimi2 = createKimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_2! });

const chat = withFallback([
  withRetry(kimi1.coding.v1.messages, { retries: 2 }),
  withRetry(kimi2.coding.v1.messages, { retries: 2 }),
]);
```

## Payload Validation

Every POST endpoint exposes `.payloadSchema` and `.validatePayload(data)` directly on the endpoint function.

```typescript
const schema = xai.v1.chat.completions.payloadSchema;

const result = xai.v1.chat.completions.validatePayload({
  messages: [{ role: "user", content: "Hello!" }],
});
// => { valid: true, errors: [] }
```

Validation checks: required fields, type checking, enum values, nested objects, and array items. GET-only endpoints do not carry schema or validation since they have no request body.

Each package exports `PayloadSchema`, `PayloadFieldSchema`, and `ValidationResult` types.

## Testing

```bash
pnpm run test:run                 # All tests (Polly.js replay)
pnpm run test:integration:record  # Re-record fixtures (needs API keys)
pnpm run harness                  # Recording review UI at localhost:3475
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
