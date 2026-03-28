# @nakedapi/xai

[![npm](https://img.shields.io/npm/v/@nakedapi/xai?color=cb0000)](https://www.npmjs.com/package/@nakedapi/xai)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

xAI (Grok) provider — responses API, chat completions, image/video generation and editing, file management, batches, collections, document search, and model listing. Completely standalone with zero external dependencies.

## Installation

```bash
npm install @nakedapi/xai
# or
pnpm add @nakedapi/xai
```

## Quick Start

```typescript
import { xai as createXai } from "@nakedapi/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });

const response = await xai.v1.chat.completions({
  model: "grok-4-fast",
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Endpoints

Base URL: `https://api.x.ai/v1`

### Responses

| URL                   | Method Signature        |
| --------------------- | ----------------------- |
| `POST /responses`     | `xai.v1.responses(req)` |
| `GET /responses/{id}` | `xai.v1.responses(id)`  |

### Chat

| URL                      | Method Signature            |
| ------------------------ | --------------------------- |
| `POST /chat/completions` | `xai.v1.chat.completions()` |

### Images

| URL                        | Method Signature              |
| -------------------------- | ----------------------------- |
| `POST /images/generations` | `xai.v1.images.generations()` |
| `POST /images/edits`       | `xai.v1.images.edits()`       |

### Videos

| URL                        | Method Signature              |
| -------------------------- | ----------------------------- |
| `GET /videos/{requestId}`  | `xai.v1.videos(requestId)`    |
| `POST /videos/generations` | `xai.v1.videos.generations()` |
| `POST /videos/edits`       | `xai.v1.videos.edits()`       |
| `POST /videos/extensions`  | `xai.v1.videos.extensions()`  |

### Files

| URL                      | Method Signature              |
| ------------------------ | ----------------------------- |
| `POST /files`            | `xai.v1.files.upload()`       |
| `GET /files`             | `xai.v1.files.list()`         |
| `GET /files/{fileId}`    | `xai.v1.files.get(fileId)`    |
| `DELETE /files/{fileId}` | `xai.v1.files.delete(fileId)` |

### Models

| URL                                      | Method Signature                        |
| ---------------------------------------- | --------------------------------------- |
| `GET /models`                            | `xai.v1.models()`                       |
| `GET /models/{modelId}`                  | `xai.v1.models(modelId)`                |
| `GET /language-models`                   | `xai.v1.languageModels()`               |
| `GET /language-models/{modelId}`         | `xai.v1.languageModels(modelId)`        |
| `GET /image-generation-models`           | `xai.v1.imageGenerationModels()`        |
| `GET /image-generation-models/{modelId}` | `xai.v1.imageGenerationModels(modelId)` |
| `GET /video-generation-models`           | `xai.v1.videoGenerationModels()`        |
| `GET /video-generation-models/{modelId}` | `xai.v1.videoGenerationModels(modelId)` |

### Batches

| URL                           | Method Signature                       |
| ----------------------------- | -------------------------------------- |
| `GET /batches`                | `xai.v1.batches()`                     |
| `POST /batches`               | `xai.v1.batches.create()`              |
| `GET /batches/{id}`           | `xai.v1.batches.get(id)`               |
| `POST /batches/{id}:cancel`   | `xai.v1.batches.cancel(id)`            |
| `GET /batches/{id}/requests`  | `xai.v1.batches.requests(id)`          |
| `POST /batches/{id}/requests` | `xai.v1.batches.requests.add(id, req)` |
| `GET /batches/{id}/results`   | `xai.v1.batches.results(id)`           |

### Collections & Documents

| URL                                           | Method Signature                                      |
| --------------------------------------------- | ----------------------------------------------------- |
| `GET /collections`                            | `xai.v1.collections()`                                |
| `POST /collections`                           | `xai.v1.collections.create()`                         |
| `GET /collections/{id}`                       | `xai.v1.collections.get(id)`                          |
| `PUT /collections/{id}`                       | `xai.v1.collections.update(id, req)`                  |
| `DELETE /collections/{id}`                    | `xai.v1.collections.delete(id)`                       |
| `GET /collections/{id}/documents`             | `xai.v1.collections.documents(id)`                    |
| `POST /collections/{id}/documents/{fileId}`   | `xai.v1.collections.documents.add(id, fileId)`        |
| `GET /collections/{id}/documents/{fileId}`    | `xai.v1.collections.documents.get(id, fileId)`        |
| `DELETE /collections/{id}/documents/{fileId}` | `xai.v1.collections.documents.delete(id, fileId)`     |
| `PATCH /collections/{id}/documents/{fileId}`  | `xai.v1.collections.documents.regenerate(id, fileId)` |
| `GET /collections/{id}/documents:batchGet`    | `xai.v1.collections.documents.batchGet(id, fileIds)`  |
| `POST /documents/search`                      | `xai.v1.documents.search()`                           |

## Usage Examples

### Responses API

```typescript
// Create a response
const response = await xai.v1.responses({
  model: "grok-4-fast",
  input: "What is the capital of France?",
});

// With web search
const searched = await xai.v1.responses({
  model: "grok-4-fast",
  input: "Latest TypeScript news",
  tools: [{ type: "web_search" }],
  search_parameters: { mode: "auto" },
});

// Retrieve a stored response
const saved = await xai.v1.responses(response.id);
```

### Image Generation

```typescript
const response = await xai.v1.images.generations({
  model: "grok-imagine-image",
  prompt: "A futuristic cityscape",
});
```

### Video Generation

```typescript
const response = await xai.v1.videos.generations({
  model: "grok-imagine-video",
  prompt: "A timelapse of a sunset",
});
// Poll for completion
const result = await xai.v1.videos(response.request_id);
```

### Document Search

```typescript
const results = await xai.v1.documents.search({
  query: "latest TypeScript news",
  collection_ids: ["your-collection-id"],
});
```

### File Upload

```typescript
const file = new Blob([buffer], { type: "application/jsonl" });
const uploaded = await xai.v1.files.upload(file, "data.jsonl", "batch");
```

## Data Shaping

These endpoints transform input before sending (all others are pure pass-through):

| Method                                                                          | What happens                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `v1.files.upload()`                                                             | Builds FormData from `file` Blob + `filename`          |
| `v1.batches()`, `.requests()`, `.results()`, `v1.collections()`, `.documents()` | Converts pagination/filter params to URL query strings |

## Configuration

```typescript
const xai = createXai({
  apiKey: "your-api-key", // required
  baseURL: "https://...", // optional, custom base URL
  timeout: 30000, // optional, ms (default: 30000)
  fetch: customFetch, // optional, custom fetch implementation
});
```

## Middleware

```typescript
import { xai as createXai, withRetry, withFallback } from "@nakedapi/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
const chat = withRetry(xai.v1.chat.completions, { retries: 3 });
```

## License

MIT
