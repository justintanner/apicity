# Apicity

[![CI](https://github.com/justintanner/apicity/actions/workflows/ci.yml/badge.svg)](https://github.com/justintanner/apicity/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.base.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/justintanner/apicity/pulls)

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

| Package                                             | Version                                                                                                                           | Description                                                    | Docs                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| [@apicity/openai](packages/provider/openai)         | [![npm](https://img.shields.io/npm/v/@apicity/openai?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/openai)         | Chat, embeddings, images, responses, audio                     | [README](packages/provider/openai/README.md#api-reference)     |
| [@apicity/xai](packages/provider/xai)               | [![npm](https://img.shields.io/npm/v/@apicity/xai?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/xai)               | Grok chat, images, video, files, batches, collections, search  | [README](packages/provider/xai/README.md#api-reference)        |
| [@apicity/fal](packages/provider/fal)               | [![npm](https://img.shields.io/npm/v/@apicity/fal?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/fal)               | Model registry, pricing, usage, analytics                      | [README](packages/provider/fal/README.md#api-reference)        |
| [@apicity/kimicoding](packages/provider/kimicoding) | [![npm](https://img.shields.io/npm/v/@apicity/kimicoding?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/kimicoding) | Messages, models, embeddings                                   | [README](packages/provider/kimicoding/README.md#api-reference) |
| [@apicity/kie](packages/provider/kie)               | [![npm](https://img.shields.io/npm/v/@apicity/kie?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/kie)               | Media generation (video/image/audio), sub-providers            | [README](packages/provider/kie/README.md#api-reference)        |
| [@apicity/anthropic](packages/provider/anthropic)   | [![npm](https://img.shields.io/npm/v/@apicity/anthropic?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/anthropic)   | Messages, streaming, batches, files, models, admin APIs        | [README](packages/provider/anthropic/README.md#api-reference)  |
| [@apicity/fireworks](packages/provider/fireworks)   | [![npm](https://img.shields.io/npm/v/@apicity/fireworks?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/fireworks)   | Chat, completions, embeddings, audio, deployments, fine-tuning | [README](packages/provider/fireworks/README.md#api-reference)  |
| [@apicity/alibaba](packages/provider/alibaba)       | [![npm](https://img.shields.io/npm/v/@apicity/alibaba?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/alibaba)       | Qwen chat/streaming, Wan image & video generation (async)      | [README](packages/provider/alibaba/README.md#api-reference)    |
| [@apicity/free](packages/provider/free)             | [![npm](https://img.shields.io/npm/v/@apicity/free?color=cb0000&label=)](https://www.npmjs.com/package/@apicity/free)             | File upload/hosting to free services (catbox, gofile, tmpfiles, etc.) | [README](packages/provider/free/README.md#api-reference) |

## Quick Start

```bash
npm install @apicity/xai
```

```typescript
import { xai as createXai } from "@apicity/xai";

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

> **More examples:** [OpenAI](packages/provider/openai/README.md#quick-start) | [xAI](packages/provider/xai/README.md#quick-start) | [Fal](packages/provider/fal/README.md#quick-start) | [KimiCoding](packages/provider/kimicoding/README.md#quick-start) | [KIE](packages/provider/kie/README.md#quick-start) | [Anthropic](packages/provider/anthropic/README.md#quick-start) | [Fireworks](packages/provider/fireworks/README.md#quick-start) | [Alibaba](packages/provider/alibaba/README.md#quick-start) | [Free](packages/provider/free/README.md#quick-start)

## Endpoint Naming

Method paths mirror upstream API URL paths segment-by-segment. Kebab-case segments become camelCase.

```
URL path:     /v1/chat/completions       →  openai.v1.chat.completions()
URL path:     /v1/language-models        →  xai.v1.languageModels()
URL path:     /api/v1/common/download-url →  kie.api.v1.common.downloadUrl()
```

Full endpoint tables are in each provider's README: [OpenAI](packages/provider/openai/README.md#api-reference) | [xAI](packages/provider/xai/README.md#api-reference) | [Fal](packages/provider/fal/README.md#api-reference) | [KimiCoding](packages/provider/kimicoding/README.md#api-reference) | [KIE](packages/provider/kie/README.md#api-reference) | [Anthropic](packages/provider/anthropic/README.md#api-reference) | [Fireworks](packages/provider/fireworks/README.md#api-reference) | [Alibaba](packages/provider/alibaba/README.md#api-reference) | [Free](packages/provider/free/README.md#api-reference)

## Middleware

Every package exports `withRetry` and `withFallback` — generic function-level wrappers that work with any `(req, signal?) => Promise<T>` call. `@apicity/kimicoding` additionally exports `withStreamRetry` and `withStreamFallback` for async iterables.

### `withRetry` — Exponential Backoff

Retries on transient errors (HTTP 429 and 5xx) with configurable backoff.

```typescript
import { openai as createOpenai, withRetry } from "@apicity/openai";

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
import { openai as createOpenai, withFallback } from "@apicity/openai";

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
} from "@apicity/kimicoding";

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

Every dev-loop phase is one named pnpm script:

| Command                             | When to run it                                                |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm run test:run`                 | Replay all tests from disk (no network, no keys)              |
| `pnpm run test:run <file>`          | Replay a single test file                                     |
| `pnpm run dev:record -- <file>`     | Record fixtures for a _new_ test (1Password, safe)            |
| `pnpm run dev:rerecord -- <file>`   | Overwrite an existing HAR (destructive, file-filter required) |
| `pnpm run dev:preflight`            | Format + lint + replay tests — run this before `git push`     |
| `pnpm run ci:local`                 | Exact CI mirror: build + lint + replay tests                  |
| `pnpm run harness`                  | Review recordings in a local viewer (localhost:3475)          |
| `pnpm run harness:screenshot`       | Generate the full harness-report PNG locally                  |
| `pnpm run harness:screenshot:media` | Generate the media-only harness-report PNG locally            |
| `pnpm run check:op`                 | Verify 1Password is resolving every provider key in `.env.tpl` |

### Secrets Management

API keys are resolved at runtime via the [1Password CLI](https://developer.1password.com/docs/cli/) (`op run`). The `.env.tpl` file contains `op://` secret references — no plaintext secrets are stored on disk. Both `dev:record` and `dev:rerecord` invoke `op run` automatically.

```bash
# Record fixtures for a single new test:
pnpm run dev:record -- tests/integration/<file>.test.ts

# Verify the recording replays cleanly (no network):
pnpm run test:run tests/integration/<file>.test.ts
```

`dev:rerecord` refuses to run without a test-file filter (guarded by `tests/check-record-args.mjs`) so you can't accidentally overwrite every HAR in the repo. Override with `POLLY_FORCE_ALL=1` if you really do mean to re-record everything.

Alternatively, copy `.env.template` to `.env`, fill in your keys manually, and run:

```bash
source .env
POLLY_MODE=record pnpm run test:run tests/integration/<file>.test.ts
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
