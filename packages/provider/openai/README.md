# @nakedapi/openai

[![npm](https://img.shields.io/npm/v/@nakedapi/openai?color=cb0000)](https://www.npmjs.com/package/@nakedapi/openai)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

OpenAI provider — chat completions, embeddings, image generation/editing, responses, and audio transcription/translation. Completely standalone with zero external dependencies.

## Installation

```bash
npm install @nakedapi/openai
# or
pnpm add @nakedapi/openai
```

## Quick Start

```typescript
import { openai as createOpenai } from "@nakedapi/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });

const response = await openai.v1.chat.completions({
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.content);
```

## Endpoints

Base URL: `https://api.openai.com/v1`

| URL                          | Method Signature                   |
| ---------------------------- | ---------------------------------- |
| `POST /chat/completions`     | `openai.v1.chat.completions()`     |
| `POST /embeddings`           | `openai.v1.embeddings()`           |
| `POST /images/edits`         | `openai.v1.images.edits()`         |
| `POST /images/generations`   | `openai.v1.images.generations()`   |
| `POST /responses`            | `openai.v1.responses()`            |
| `GET /responses/{id}`        | `openai.v1.responses.get(id)`      |
| `POST /audio/transcriptions` | `openai.v1.audio.transcriptions()` |
| `POST /audio/translations`   | `openai.v1.audio.translations()`   |

## Usage Examples

### Chat Completions

```typescript
const response = await openai.v1.chat.completions({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Explain monads in one sentence." }],
});
```

### Embeddings

```typescript
const response = await openai.v1.embeddings({
  model: "text-embedding-3-small",
  input: "The food was delicious",
});
console.log(response.data[0].embedding);
```

### Image Generation

```typescript
const response = await openai.v1.images.generations({
  model: "dall-e-3",
  prompt: "A white siamese cat",
  size: "1024x1024",
});
console.log(response.data[0].url);
```

### Image Editing

```typescript
const response = await openai.v1.images.edits({
  image: new Blob([imageBuffer]),
  prompt: "Add a hat to the cat",
});
```

### Responses API

```typescript
const response = await openai.v1.responses({
  model: "gpt-4o",
  input: "What is the capital of France?",
});

// Retrieve a previous response
const saved = await openai.v1.responses.get(response.id);
```

### Audio Transcription

```typescript
const result = await openai.v1.audio.transcriptions({
  file: new Blob([mp3Buffer], { type: "audio/mp3" }),
  model: "gpt-4o-mini-transcribe",
});
console.log(result.text);
```

### Audio Translation

```typescript
const result = await openai.v1.audio.translations({
  file: new Blob([audioBuffer], { type: "audio/mp3" }),
  model: "whisper-1",
});
console.log(result.text);
```

## Data Shaping

These endpoints transform input before sending (all others are pure pass-through):

| Method                                                 | What happens                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `v1.audio.transcriptions()`, `v1.audio.translations()` | Builds FormData from params; converts `temperature` to string |
| `v1.images.edits()`                                    | Builds FormData from params; supports multiple image blobs    |

## Configuration

```typescript
const openai = createOpenai({
  apiKey: "your-api-key", // required
  baseURL: "https://...", // optional, custom base URL
  timeout: 30000, // optional, ms (default: 30000)
  fetch: customFetch, // optional, custom fetch implementation
});
```

## Middleware

```typescript
import {
  openai as createOpenai,
  withRetry,
  withFallback,
} from "@nakedapi/openai";

const openai = createOpenai({ apiKey: process.env.OPENAI_API_KEY! });

// Retry on transient errors (429, 5xx)
const chat = withRetry(openai.v1.chat.completions, { retries: 3 });

// Failover across accounts
const primary = createOpenai({ apiKey: process.env.OPENAI_KEY_PRIMARY! });
const backup = createOpenai({ apiKey: process.env.OPENAI_KEY_BACKUP! });
const resilient = withFallback([
  primary.v1.chat.completions,
  backup.v1.chat.completions,
]);
```

## License

MIT
