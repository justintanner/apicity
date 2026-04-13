# @apicity/openai

[![npm](https://img.shields.io/npm/v/@apicity/openai?color=cb0000)](https://www.npmjs.com/package/@apicity/openai)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

OpenAI / GPT provider for chat completions.

## Installation

```bash
npm install @apicity/openai
# or
pnpm add @apicity/openai
```

## Quick Start

```typescript
import { openai as createOpenai } from "@apicity/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });
```

## API Reference

37 endpoints across 10 groups. Each method mirrors an upstream URL path.

### audio

<details>
<summary><code>POST</code> <b><code>openai.v1.audio.speech</code></b></summary>

<code>POST https://api.openai.com/v1/audio/speech</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.audio.speech({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.audio.transcriptions</code></b></summary>

<code>POST https://api.openai.com/v1/audio/transcriptions</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.audio.transcriptions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.audio.translations</code></b></summary>

<code>POST https://api.openai.com/v1/audio/translations</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.audio.translations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### batches

<details>
<summary><code>GET</code> <b><code>openai.v1.batches</code></b></summary>

<code>GET https://api.openai.com/v1/batches/{idOrOpts}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.batches</code></b></summary>

<code>POST https://api.openai.com/v1/batches</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.batches.cancel</code></b></summary>

<code>POST https://api.openai.com/v1/batches/{id}/cancel</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.batches.cancel({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### chat

<details>
<summary><code>DELETE</code> <b><code>openai.v1.chat.completions</code></b></summary>

<code>DELETE https://api.openai.com/v1/chat/completions/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.chat.completions</code></b></summary>

<code>GET https://api.openai.com/v1/chat/completions/{idOrOpts}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.chat.completionsMessages</code></b></summary>

<code>GET https://api.openai.com/v1/chat/completions/{id}/messages</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completionsMessages({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.chat.completions</code></b></summary>

<code>POST https://api.openai.com/v1/chat/completions/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### embeddings

<details>
<summary><code>POST</code> <b><code>openai.v1.embeddings</code></b></summary>

<code>POST https://api.openai.com/v1/embeddings</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.embeddings({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### files

<details>
<summary><code>DELETE</code> <b><code>openai.v1.files</code></b></summary>

<code>DELETE https://api.openai.com/v1/files/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.files</code></b></summary>

<code>GET https://api.openai.com/v1/files/{idOrOpts}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.files.content</code></b></summary>

<code>GET https://api.openai.com/v1/files/{id}/content</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files.content({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.files</code></b></summary>

<code>POST https://api.openai.com/v1/files</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### fine_tuning

<details>
<summary><code>DELETE</code> <b><code>openai.v1.fine_tuning.checkpoints.permissions</code></b></summary>

<code>DELETE https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions/{permissionId}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.checkpoints.permissions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fine_tuning.checkpoints.permissions</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.checkpoints.permissions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fine_tuning.jobs</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/jobs/{idOrOpts}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fine_tuning.jobs.checkpoints</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/jobs/{id}/checkpoints</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs.checkpoints({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fine_tuning.jobs.events</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/jobs/{id}/events</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs.events({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fine_tuning.checkpoints.permissions</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.checkpoints.permissions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fine_tuning.jobs</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fine_tuning.jobs.cancel</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs/{id}/cancel</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs.cancel({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fine_tuning.jobs.pause</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs/{id}/pause</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs.pause({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fine_tuning.jobs.resume</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs/{id}/resume</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fine_tuning.jobs.resume({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### images

<details>
<summary><code>POST</code> <b><code>openai.v1.images.edits</code></b></summary>

<code>POST https://api.openai.com/v1/images/edits</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.images.edits({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.images.generations</code></b></summary>

<code>POST https://api.openai.com/v1/images/generations</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.images.generations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### models

<details>
<summary><code>DELETE</code> <b><code>openai.v1.models</code></b></summary>

<code>DELETE https://api.openai.com/v1/models/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.models({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.models</code></b></summary>

<code>GET https://api.openai.com/v1/models/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.models({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### moderations

<details>
<summary><code>POST</code> <b><code>openai.v1.moderations</code></b></summary>

<code>POST https://api.openai.com/v1/moderations</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.moderations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### responses

<details>
<summary><code>DELETE</code> <b><code>openai.v1.responses</code></b></summary>

<code>DELETE https://api.openai.com/v1/responses/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.responses</code></b></summary>

<code>GET https://api.openai.com/v1/responses/{id}</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.responses.inputItems</code></b></summary>

<code>GET https://api.openai.com/v1/responses/{id}/input_items</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.inputItems({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses</code></b></summary>

<code>POST https://api.openai.com/v1/responses</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses.cancel</code></b></summary>

<code>POST https://api.openai.com/v1/responses/{id}/cancel</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.cancel({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses.compact</code></b></summary>

<code>POST https://api.openai.com/v1/responses/compact</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.compact({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses.inputTokens</code></b></summary>

<code>POST https://api.openai.com/v1/responses/input_tokens</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.inputTokens({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

## Middleware

```typescript
import { openai as createOpenai, withRetry } from "@apicity/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });
const models = withRetry(openai.get.v1.models, { retries: 3 });
```

## License

MIT
