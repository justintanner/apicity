# @apicity/xai

[![npm](https://img.shields.io/npm/v/@apicity/xai?color=cb0000)](https://www.npmjs.com/package/@apicity/xai)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

X.AI / Grok provider for chat and search.

## Installation

```bash
npm install @apicity/xai
# or
pnpm add @apicity/xai
```

## Quick Start

```typescript
import { xai as createXai } from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
```

## API Reference

36 endpoints across 14 groups. Each method mirrors an upstream URL path.

### batches

<details>
<summary><code>GET</code> <b><code>xai.v1.batches</code></b></summary>

<code>GET https://api.x.ai/v1/batches/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.batches.requests</code></b></summary>

<code>GET https://api.x.ai/v1/batches/{batchId}/requests{query}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.requests({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.batches.results</code></b></summary>

<code>GET https://api.x.ai/v1/batches/{batchId}/results{query}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.results({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.batches</code></b></summary>

<code>POST https://api.x.ai/v1/batches</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.batches.cancel</code></b></summary>

<code>POST https://api.x.ai/v1/batches/{batchId}:cancel</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.cancel({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.batches.requests</code></b></summary>

<code>POST https://api.x.ai/v1/batches/{batchId}/requests</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.requests({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### chat

<details>
<summary><code>GET</code> <b><code>xai.v1.chat.deferredCompletion</code></b></summary>

<code>GET https://api.x.ai/v1/chat/deferred-completion/{requestId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.chat.deferredCompletion({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.chat.completions</code></b></summary>

<code>POST https://api.x.ai/v1/chat/completions</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### collections

<details>
<summary><code>DELETE</code> <b><code>xai.v1.collections</code></b></summary>

<code>DELETE https://api.x.ai/v1/collections/{collectionId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>xai.v1.collections.documents</code></b></summary>

<code>DELETE https://api.x.ai/v1/collections/{collectionId}/documents/{fileId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.collections</code></b></summary>

<code>GET https://api.x.ai/v1/collections/{paramsOrIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.collections.documents</code></b></summary>

<code>GET https://api.x.ai/v1/collections/{collectionId}/documents/{paramsOrFileId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.collections.documents.batchGet</code></b></summary>

<code>GET https://api.x.ai/v1/collections/{collectionId}/documents:batchGet{query}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections.documents.batchGet({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>xai.v1.collections.documents</code></b></summary>

<code>PATCH https://api.x.ai/v1/collections/{collectionId}/documents/{fileId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.collections</code></b></summary>

<code>POST https://api.x.ai/v1/collections</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.collections.documents</code></b></summary>

<code>POST https://api.x.ai/v1/collections/{collectionId}/documents/{fileId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>xai.v1.collections</code></b></summary>

<code>PUT https://api.x.ai/v1/collections/{collectionId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### documents

<details>
<summary><code>POST</code> <b><code>xai.v1.documents.search</code></b></summary>

<code>POST https://api.x.ai/v1/documents/search</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.documents.search({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### files

<details>
<summary><code>DELETE</code> <b><code>xai.v1.files</code></b></summary>

<code>DELETE https://api.x.ai/v1/files/{fileId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.files</code></b></summary>

<code>GET https://api.x.ai/v1/files/{fileIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.files</code></b></summary>

<code>POST https://api.x.ai/v1/files</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### imageGenerationModels

<details>
<summary><code>GET</code> <b><code>xai.v1.imageGenerationModels</code></b></summary>

<code>GET https://api.x.ai/v1/image-generation-models/{modelIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.imageGenerationModels({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### images

<details>
<summary><code>POST</code> <b><code>xai.v1.images.edits</code></b></summary>

<code>POST https://api.x.ai/v1/images/edits</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.images.edits({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.images.generations</code></b></summary>

<code>POST https://api.x.ai/v1/images/generations</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.images.generations({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### languageModels

<details>
<summary><code>GET</code> <b><code>xai.v1.languageModels</code></b></summary>

<code>GET https://api.x.ai/v1/language-models/{modelIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.languageModels({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>xai.v1.models</code></b></summary>

<code>GET https://api.x.ai/v1/models/{modelIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.models({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### realtime

<details>
<summary><code>POST</code> <b><code>xai.v1.realtime.clientSecrets</code></b></summary>

<code>POST https://api.x.ai/v1/realtime/client_secrets</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.realtime.clientSecrets({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### responses

<details>
<summary><code>DELETE</code> <b><code>xai.v1.responses</code></b></summary>

<code>DELETE https://api.x.ai/v1/responses/{id}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.responses</code></b></summary>

<code>GET https://api.x.ai/v1/responses/{id}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.responses</code></b></summary>

<code>POST https://api.x.ai/v1/responses</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### tokenizeText

<details>
<summary><code>POST</code> <b><code>xai.v1.tokenizeText</code></b></summary>

<code>POST https://api.x.ai/v1/tokenize-text</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.tokenizeText({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### videoGenerationModels

<details>
<summary><code>GET</code> <b><code>xai.v1.videoGenerationModels</code></b></summary>

<code>GET https://api.x.ai/v1/video-generation-models/{modelIdOrSignal}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videoGenerationModels({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### videos

<details>
<summary><code>GET</code> <b><code>xai.v1.videos</code></b></summary>

<code>GET https://api.x.ai/v1/videos/{requestId}</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.edits</code></b></summary>

<code>POST https://api.x.ai/v1/videos/edits</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos.edits({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.extensions</code></b></summary>

<code>POST https://api.x.ai/v1/videos/extensions</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos.extensions({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.generations</code></b></summary>

<code>POST https://api.x.ai/v1/videos/generations</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos.generations({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

## Middleware

```typescript
import { xai as createXai, withRetry } from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
const models = withRetry(xai.get.v1.models, { retries: 3 });
```

## Rate Limiting

Client-side rate limiting that queues requests to stay within xAI API limits.

```typescript
import {
  xai as createXai,
  withRateLimit,
  withRetry,
  createRateLimiter,
  XAI_RATE_LIMITS,
} from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
```

### Using xAI tier presets

```typescript
// Use built-in tier presets (free, tier1, tier2, tier3, tier4)
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);
// => { rpm: 60, concurrent: 10 }

const chat = withRateLimit(xai.post.v1.chat.completions, limiter);
```

### Custom limits

```typescript
const limiter = createRateLimiter({ rpm: 30, concurrent: 5 });
const chat = withRateLimit(xai.post.v1.chat.completions, limiter);
```

### Shared limiter across endpoints

RPM limits apply globally, so share a single limiter across all endpoints:

```typescript
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier2);

const chat = withRateLimit(xai.post.v1.chat.completions, limiter);
const responses = withRateLimit(xai.post.v1.responses, limiter);
const images = withRateLimit(xai.post.v1.images.generations, limiter);
```

### Composing with retry

Place `withRateLimit` innermost so retries count against the limit:

```typescript
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);

const chat = withRetry(
  withRateLimit(xai.post.v1.chat.completions, limiter),
  { retries: 2 }
);
```

### Batch processing

Fire requests in parallel — the limiter handles pacing automatically:

```typescript
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);
const chat = withRateLimit(xai.post.v1.chat.completions, limiter);

const results = await Promise.all(
  prompts.map((p) =>
    chat({
      model: "grok-3",
      messages: [{ role: "user", content: p }],
    })
  )
);
```

### xAI rate limit tiers

| Preset | RPM | Concurrent | Spend threshold |
|--------|-----|------------|-----------------|
| `free` | 5 | 2 | $0 |
| `tier1` | 60 | 10 | $0+ |
| `tier2` | 200 | 25 | $100+ |
| `tier3` | 500 | 50 | $500+ |
| `tier4` | 1000 | 100 | $1,000+ |

## License

MIT
