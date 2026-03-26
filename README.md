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
- **Payload Validation** — per-endpoint schema and runtime validation
- **Polly.js Harness** — record/replay integration tests with review UI

## Architecture

```
packages/provider/
├── fal/         – @nakedapi/fal (model registry, pricing, analytics)
├── kie/         – @nakedapi/kie (media generation, chat, audio)
├── kimicoding/  – @nakedapi/kimicoding (Anthropic Messages API)
├── openai/      – @nakedapi/openai (chat, transcription)
└── xai/         – @nakedapi/xai (Grok chat, search, images, video)
```

## Endpoint Naming Scheme

Method paths mirror upstream API URL paths segment-by-segment. Kebab-case segments become camelCase.

```
URL path:     /v1/chat/completions
Method:       openai.v1.chat.completions()

URL path:     /v1/language-models
Method:       xai.v1.languageModels()

URL path:     /api/v1/common/download-url
Method:       kie.api.v1.common.downloadUrl()
```

### All Endpoints

#### OpenAI — `https://api.openai.com/v1`

| URL                          | Method Signature                   |
| ---------------------------- | ---------------------------------- |
| `POST /chat/completions`     | `openai.v1.chat.completions()`     |
| `POST /audio/transcriptions` | `openai.v1.audio.transcriptions()` |

#### xAI — `https://api.x.ai/v1`

| URL                                      | Method Signature                        |
| ---------------------------------------- | --------------------------------------- |
| `POST /chat/completions`                 | `xai.v1.chat.completions()`             |
| `POST /images/generations`               | `xai.v1.images.generations()`           |
| `POST /images/edits`                     | `xai.v1.images.edits()`                 |
| `GET /videos/{requestId}`                | `xai.v1.videos(requestId)`              |
| `POST /videos/generations`               | `xai.v1.videos.generations()`           |
| `POST /videos/extensions`                | `xai.v1.videos.extensions()`            |
| `POST /files`                            | `xai.v1.files.upload()`                 |
| `GET /files`                             | `xai.v1.files.list()`                   |
| `GET /files/{fileId}`                    | `xai.v1.files.get(fileId)`              |
| `DELETE /files/{fileId}`                 | `xai.v1.files.delete(fileId)`           |
| `GET /models`                            | `xai.v1.models()`                       |
| `GET /models/{modelId}`                  | `xai.v1.models(modelId)`                |
| `GET /language-models`                   | `xai.v1.languageModels()`               |
| `GET /language-models/{modelId}`         | `xai.v1.languageModels(modelId)`        |
| `GET /image-generation-models`           | `xai.v1.imageGenerationModels()`        |
| `GET /image-generation-models/{modelId}` | `xai.v1.imageGenerationModels(modelId)` |
| `GET /video-generation-models`           | `xai.v1.videoGenerationModels()`        |
| `GET /video-generation-models/{modelId}` | `xai.v1.videoGenerationModels(modelId)` |

#### Fal — `https://api.fal.ai/v1`

| URL                                     | Method Signature                      |
| --------------------------------------- | ------------------------------------- |
| `GET /models`                           | `fal.v1.models()`                     |
| `GET /models/pricing`                   | `fal.v1.models.pricing()`             |
| `POST /models/pricing/estimate`         | `fal.v1.models.pricing.estimate()`    |
| `GET /models/usage`                     | `fal.v1.models.usage()`               |
| `GET /models/analytics`                 | `fal.v1.models.analytics()`           |
| `GET /models/requests/by-endpoint`      | `fal.v1.models.requests.byEndpoint()` |
| `DELETE /models/requests/{id}/payloads` | `fal.v1.models.requests.payloads()`   |

#### KimiCoding — `https://api.kimi.com/coding/`

| URL                         | Method Signature                         |
| --------------------------- | ---------------------------------------- |
| `POST v1/messages`          | `kimicoding.coding.v1.messages()`        |
| `POST v1/messages` (stream) | `kimicoding.coding.v1.messages.stream()` |

#### KIE — `https://api.kie.ai`

| URL                                   | Method Signature                     |
| ------------------------------------- | ------------------------------------ |
| `POST /api/v1/jobs/createTask`        | `kie.api.v1.jobs.createTask()`       |
| `GET /api/v1/jobs/recordInfo?taskId=` | `kie.api.v1.jobs.recordInfo(taskId)` |
| `POST /api/v1/common/download-url`    | `kie.api.v1.common.downloadUrl()`    |
| `GET /api/v1/chat/credit`             | `kie.api.v1.chat.credit()`           |
| `POST /api/file-stream-upload`        | `kie.api.fileStreamUpload()`         |

#### KIE Sub-providers

| URL                                 | Method Signature                       |
| ----------------------------------- | -------------------------------------- |
| `POST /api/v1/veo/generate`         | `kie.veo.api.v1.veo.generate()`        |
| `POST /api/v1/veo/extend`           | `kie.veo.api.v1.veo.extend()`          |
| `POST /api/v1/generate`             | `kie.suno.api.v1.generate()`           |
| `POST /gpt-5-2/v1/chat/completions` | `kie.chat.gpt52.v1.chat.completions()` |

## Quick Start

### Kimi for Coding

```bash
npm install @nakedapi/kimicoding
```

```typescript
import {
  kimicoding as createKimicoding,
  type ChatRequest,
} from "@nakedapi/kimicoding";

const kimicoding = createKimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});

for await (const chunk of kimicoding.coding.v1.messages.stream({
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
import { kie as createKie } from "@nakedapi/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });

const { taskId } = await kie.api.v1.jobs.createTask({
  model: "nano-banana-pro",
  input: { prompt: "A serene mountain landscape", aspect_ratio: "16:9" },
});

// Upload media for generation endpoints
const upload = await kie.api.fileStreamUpload({
  file: new Blob([fileBuffer]),
  filename: "photo.png",
});

const video = await kie.api.v1.jobs.createTask({
  model: "grok-imagine/image-to-video",
  input: { image_urls: [upload.downloadUrl] },
});
```

### OpenAI (Chat & Transcription)

```bash
npm install @nakedapi/openai
```

```typescript
import { openai as createOpenai } from "@nakedapi/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });

// Chat with tool support
const response = await openai.v1.chat.completions({
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.content);

// Transcribe audio
const result = await openai.v1.audio.transcriptions({
  file: new Blob([mp3Buffer], { type: "audio/mp3" }),
});
console.log(result.text);
```

### xAI (Grok Chat & Search)

```bash
npm install @nakedapi/xai
```

```typescript
import { xai as createXai } from "@nakedapi/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });

const response = await xai.v1.chat.completions({
  model: "grok-4-fast",
  messages: [{ role: "user", content: "Hello!" }],
});

const searchResult = await xai.v1.chat.completions.search(
  "latest TypeScript news"
);
```

### Fal (Model Registry & Analytics)

```bash
npm install @nakedapi/fal
```

```typescript
import { fal as createFal } from "@nakedapi/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });

const models = await fal.v1.models({ search: "flux" });
const pricing = await fal.v1.models.pricing({ appId: "fal-ai/flux" });
const usage = await fal.v1.models.usage();
```

## Providers

| Package                                              | Methods                                                                                                                        | Models                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [@nakedapi/fal](packages/provider/fal)               | `fal.v1.models()`, `.pricing()`, `.usage()`, `.analytics()`, `.requests`                                                       | Model registry/marketplace                                            |
| [@nakedapi/kie](packages/provider/kie)               | `kie.api.v1.jobs.createTask()`, `.recordInfo()`, `kie.api.fileStreamUpload()`, sub-providers (chat, veo, suno)                 | Kling 3.0, Grok Imagine, Nano Banana, GPT Image, Seedance, ElevenLabs |
| [@nakedapi/kimicoding](packages/provider/kimicoding) | `kimicoding.coding.v1.messages()`, `.stream()`                                                                                 | `k2p5` (32K max tokens)                                               |
| [@nakedapi/openai](packages/provider/openai)         | `openai.v1.chat.completions()`, `openai.v1.audio.transcriptions()`                                                             | `gpt-5.4-2026-03-05`, `gpt-4o-mini-transcribe`                        |
| [@nakedapi/xai](packages/provider/xai)               | `xai.v1.chat.completions()`, `.search()`, `xai.v1.images.generations()`, `.edits()`, `xai.v1.videos.generations()`, `.edits()` | `grok-4-fast`, `grok-imagine-image`, `grok-imagine-video`             |

## Middleware

Every package exports `withRetry` and `withFallback` — generic function-level wrappers that work with any `(req, signal?) => Promise<T>` call. `@nakedapi/kimicoding` additionally exports `withStreamRetry` and `withStreamFallback` for async iterables.

### `withRetry` — Exponential Backoff

Wraps a single API call with automatic retries on transient errors (HTTP 429 and 5xx).

```typescript
import { openai as createOpenai, withRetry } from "@nakedapi/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });

const chat = withRetry(openai.v1.chat.completions, {
  retries: 3, // max retry attempts (default: 2)
  baseMs: 500, // initial delay in ms (default: 300)
  factor: 2, // exponential multiplier (default: 2)
  jitter: true, // randomize delay ±20% (default: true)
});

const response = await chat({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Explain monads in one sentence." }],
});
```

Works the same way across all providers:

```typescript
import { xai as createXai, withRetry } from "@nakedapi/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
const chat = withRetry(xai.v1.chat.completions);
```

### `withFallback` — Multi-Function Failover

Tries each function in order. If one fails, the next picks up. Useful for redundant API keys, separate accounts, or mixing providers.

```typescript
import { openai as createOpenai, withFallback } from "@nakedapi/openai";

const primary = createOpenai({ apiKey: process.env.OPENAI_KEY_PRIMARY! });
const backup = createOpenai({ apiKey: process.env.OPENAI_KEY_BACKUP! });

const chat = withFallback(
  [primary.v1.chat.completions, backup.v1.chat.completions],
  {
    onFallback: (error, index) => {
      console.warn(`Function ${index} failed, falling back:`, error);
    },
  }
);

const response = await chat({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### Streaming Middleware (kimicoding)

`@nakedapi/kimicoding` exports `withStreamRetry` and `withStreamFallback` for wrapping streaming calls that return `AsyncIterable`:

```typescript
import {
  kimicoding as createKimicoding,
  withStreamRetry,
  withStreamFallback,
} from "@nakedapi/kimicoding";

const kimicoding = createKimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});

// Retry the full stream on transient failure
const stream = withStreamRetry(kimicoding.coding.v1.messages.stream, {
  retries: 2,
  baseMs: 300,
});

for await (const chunk of stream({
  model: "k2p5",
  messages: [{ role: "user", content: "Write a haiku about TypeScript." }],
})) {
  if (chunk.delta) process.stdout.write(chunk.delta);
}
```

### Composing Middleware

Since wrappers return plain functions with the same signature, they compose naturally:

```typescript
import {
  kimicoding as createKimicoding,
  withRetry,
  withFallback,
} from "@nakedapi/kimicoding";

const kimi1 = createKimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_1! });
const kimi2 = createKimicoding({ apiKey: process.env.KIMI_CODING_API_KEY_2! });

// Each function retries individually, then fallback switches
const chat = withFallback([
  withRetry(kimi1.coding.v1.messages, { retries: 2, baseMs: 300 }),
  withRetry(kimi2.coding.v1.messages, { retries: 2, baseMs: 300 }),
]);

const response = await chat({
  model: "k2p5",
  messages: [{ role: "user", content: "Summarize this repo." }],
  maxTokens: 1024,
});
```

## Payload Schema & Validation

Every POST endpoint exposes `.payloadSchema` and `.validatePayload(data)` directly on the endpoint function. Schemas are hardcoded and describe the expected request body fields, types, and constraints.

### Inspecting the Schema

```typescript
import { xai as createXai } from "@nakedapi/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });

const schema = xai.v1.chat.completions.payloadSchema;
// => {
//   method: "POST",
//   path: "/chat/completions",
//   contentType: "application/json",
//   fields: {
//     messages: { type: "array", required: true, ... },
//     model: { type: "string", ... },
//     temperature: { type: "number", ... },
//     ...
//   }
// }
```

### Validating Before Calling

```typescript
const result = xai.v1.chat.completions.validatePayload({
  messages: [{ role: "user", content: "Hello!" }],
});
// => { valid: true, errors: [] }

const bad = xai.v1.chat.completions.validatePayload({});
// => { valid: false, errors: ["messages is required"] }
```

### Works on Every POST Endpoint

```typescript
// OpenAI
openai.v1.chat.completions.payloadSchema;
openai.v1.audio.transcriptions.validatePayload(data);

// xAI
xai.v1.images.generations.payloadSchema;
xai.v1.videos.extensions.validatePayload(data);

// Fal
fal.v1.models.pricing.estimate.payloadSchema;

// KimiCoding (messages + stream share the same schema)
kimicoding.coding.v1.messages.payloadSchema;
kimicoding.coding.v1.messages.stream.validatePayload(data);

// KIE (core + sub-providers)
kie.api.v1.jobs.createTask.payloadSchema;
kie.api.v1.common.downloadUrl.validatePayload(data);
kie.veo.api.v1.veo.generate.payloadSchema;
kie.suno.api.v1.generate.payloadSchema;
kie.chat.gpt52.v1.chat.completions.payloadSchema;
```

### Validation Checks

The validator performs the following checks recursively:

- **Required fields** — reports missing fields marked `required: true`
- **Type checking** — verifies `string`, `number`, `boolean`, `array`, `object`
- **Enum values** — rejects values not in the allowed list
- **Nested objects** — validates `properties` within object fields
- **Array items** — validates each element against `items` schema

GET-only endpoints (e.g. `xai.v1.models()`, `fal.v1.models()`) do not carry `.payloadSchema` or `.validatePayload` since they have no request body.

### Model Input Schemas (KIE)

KIE's `createTask` endpoint accepts 18 different model types, each with a unique `input` shape. The `modelInputSchemas` property provides the input field schema for every model — no network call, just static data:

```typescript
const kie = createKie({ apiKey: process.env.KIE_API_KEY! });

// Discover what fields nano-banana-pro accepts
const schema = kie.modelInputSchemas["nano-banana-pro"];
// => {
//   type: "image",
//   fields: {
//     prompt: { type: "string", required: true },
//     aspect_ratio: { type: "string", enum: ["1:1", "2:3", "3:2", ...] },
//     resolution: { type: "string", enum: ["1K", "2K", "4K"] },
//     output_format: { type: "string", enum: ["png", "jpg"] },
//     image_input: { type: "array", items: { type: "string" } },
//   }
// }

// List all available models and their media types
for (const [model, { type }] of Object.entries(kie.modelInputSchemas)) {
  console.log(`${model} → ${type}`);
}
```

### Types

Each package exports `PayloadSchema`, `PayloadFieldSchema`, and `ValidationResult`:

```typescript
import type {
  PayloadSchema,
  PayloadFieldSchema,
  ValidationResult,
} from "@nakedapi/xai";
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

## Data Shaping Exceptions

Most methods are pure pass-through — your request params are sent as-is and the API response is returned as-is. The following methods shape data on the **input** side before sending. No method shapes data on the output side.

| Transformation        | Provider | Method                                                                            | What happens                                                                         |
| --------------------- | -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| FormData construction | OpenAI   | `v1.audio.transcriptions()`                                                       | Builds FormData from params; converts `temperature` to string                        |
| FormData construction | xAI      | `v1.files.upload()`                                                               | Builds FormData from `file` Blob + `filename`                                        |
| FormData construction | KIE      | `api.fileStreamUpload()`                                                          | Infers MIME type from filename, generates timestamped upload path, wraps in FormData |
| Query string          | Fal      | `v1.models()`, `.pricing()`, `.usage()`, `.analytics()`, `.requests.byEndpoint()` | Converts param objects to URL query strings                                          |
| Header promotion      | Fal      | `v1.models.requests.payloads()`                                                   | Moves `idempotency_key` from params to `Idempotency-Key` header                      |

## License

MIT — See [LICENSE](LICENSE)

Based on [TetherAI](https://github.com/nbursa/TetherAI) by Nenad Bursac.
