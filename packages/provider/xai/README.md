# @nakedapi/xai

[![npm](https://img.shields.io/npm/v/@nakedapi/xai?color=cb0000)](https://www.npmjs.com/package/@nakedapi/xai)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

X.AI / Grok provider for chat and search.

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
```

## API Reference

All methods include their payload schema and a `validatePayload()` function for runtime validation.

### POST Endpoints

<details>
<summary><b><code>chat.completions</code></b> — <code>POST /chat/completions</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | No | Model ID (e.g. grok-3) |
| `messages` | array | Yes | Array of chat messages<br>Enum: `user`, `assistant`, `system` |
| `content` | string | Yes |  |
| `temperature` | number | No | Sampling temperature 0-2 |
| `max_tokens` | number | No | Max tokens to generate |
| `tools` | array | Yes | Tool definitions for function calling<br>Enum: `function` |
| `function` | object | Yes |  |
| `description` | string | No |  |
| `parameters` | object | No |  |
| `tool_choice` | string | No | Tool choice strategy |
| `deferred` | boolean | No |  |

**Validation:**

```typescript
// Access the schema
xai.chat.completions.payloadSchema

// Validate data
xai.chat.completions.validatePayload(data)
```

</details>

<details>
<summary><b><code>images.generations</code></b> — <code>POST /images/generations</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text prompt for image generation |
| `model` | string | No | Model ID |
| `n` | number | No | Number of images to generate |
| `response_format` | string | No | Response format<br>Enum: `url`, `b64_json` |
| `aspect_ratio` | string | No | Aspect ratio |
| `resolution` | string | No | Output resolution<br>Enum: `1k`, `2k` |

**Validation:**

```typescript
// Access the schema
xai.image.generations.payloadSchema

// Validate data
xai.image.generations.validatePayload(data)
```

</details>

<details>
<summary><b><code>images.edits</code></b> — <code>POST /images/edits</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Edit instruction |
| `model` | string | No | Model ID |
| `image` | object | Yes | Single image reference |
| `type` | string | No | <br>Enum: `image_url` |
| `images` | array | Yes | Multiple image references |
| `n` | number | No | Number of images to generate |
| `response_format` | string | No | Response format<br>Enum: `url`, `b64_json` |
| `aspect_ratio` | string | No | Aspect ratio |

**Validation:**

```typescript
// Access the schema
xai.image.edits.payloadSchema

// Validate data
xai.image.edits.validatePayload(data)
```

</details>

<details>
<summary><b><code>videos.generations</code></b> — <code>POST /videos/generations</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text prompt for video generation |
| `model` | string | No | Model ID |
| `duration` | number | No | Video duration in seconds |
| `aspect_ratio` | string | No | Aspect ratio<br>Enum: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3` |
| `resolution` | string | No | Output resolution<br>Enum: `480p`, `720p` |
| `image` | object | Yes | Source image reference |
| `video` | object | Yes | Source video reference |
| `reference_images` | array | Yes | Reference images |

**Validation:**

```typescript
// Access the schema
xai.video.generations.payloadSchema

// Validate data
xai.video.generations.validatePayload(data)
```

</details>

<details>
<summary><b><code>videos.edits</code></b> — <code>POST /videos/edits</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text prompt for video editing |
| `model` | string | No | Model ID |
| `video` | object | Yes | Source video to edit |
| `output` | object | Yes | Upload destination |
| `user` | string | No | End-user identifier |

**Validation:**

```typescript
// Access the schema
xai.video.edits.payloadSchema

// Validate data
xai.video.edits.validatePayload(data)
```

</details>

<details>
<summary><b><code>batches</code></b> — <code>POST /batches</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | The name of the batch to create |

**Validation:**

```typescript
// Access the schema
xai.batch.create.payloadSchema

// Validate data
xai.batch.create.validatePayload(data)
```

</details>

<details>
<summary><b><code>batches.batch_id.requests</code></b> — <code>POST /batches/{batch_id}/requests</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `batch_requests` | array | Yes | List of batch requests to add |
| `batch_request` | object | Yes | Chat request body for /v1/chat/completions endpoint |

**Validation:**

```typescript
// Access the schema
xai.batch.add.requests.payloadSchema

// Validate data
xai.batch.add.requests.validatePayload(data)
```

</details>

<details>
<summary><b><code>collections</code></b> — <code>POST /collections</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collection_name` | string | Yes | Name of the collection |
| `collection_description` | string | No | Description of the collection |
| `team_id` | string | No | Team ID |
| `index_configuration` | object | No | Index configuration |
| `chunk_configuration` | object | No | Chunk configuration for document processing |
| `metric_space` | string | No | Distance metric for vector search<br>Enum: `HNSW_METRIC_UNKNOWN`, `HNSW_METRIC_COSINE`, `HNSW_METRIC_EUCLIDEAN`, `HNSW_METRIC_INNER_PRODUCT` |
| `field_definitions` | array | Yes | Custom field definitions for documents |
| `required` | boolean | No |  |
| `unique` | boolean | No |  |
| `inject_into_chunk` | boolean | No |  |
| `description` | string | No |  |

**Validation:**

```typescript
// Access the schema
xai.collection.create.payloadSchema

// Validate data
xai.collection.create.validatePayload(data)
```

</details>

<details>
<summary><b><code>collections.collection_id.documents.file_id</code></b> — <code>POST /collections/{collection_id}/documents/{file_id}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `team_id` | string | No | Team ID |
| `fields` | object | No | Metadata fields matching collection field definitions |

**Validation:**

```typescript
// Access the schema
xai.document.add.payloadSchema

// Validate data
xai.document.add.validatePayload(data)
```

</details>

<details>
<summary><b><code>documents.search</code></b> — <code>POST /documents/search</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query text |
| `source` | object | Yes | Source collections to search |
| `rag_pipeline` | string | No | RAG pipeline backend<br>Enum: `chroma_db`, `es` |
| `filter` | string | No | AIP-160 filter expression |
| `instructions` | string | No | Custom search instructions |
| `limit` | number | No | Max number of results |
| `ranking_metric` | string | No | Ranking metric for results<br>Enum: `RANKING_METRIC_UNKNOWN`, `RANKING_METRIC_L2_DISTANCE`, `RANKING_METRIC_COSINE_SIMILARITY` |
| `group_by` | object | Yes | Grouping configuration |
| `aggregate` | object | No |  |
| `retrieval_mode` | object | Yes | Retrieval mode configuration<br>Enum: `hybrid`, `keyword`, `semantic` |

**Validation:**

```typescript
// Access the schema
xai.document.search.payloadSchema

// Validate data
xai.document.search.validatePayload(data)
```

</details>

<details>
<summary><b><code>responses</code></b> — <code>POST /responses</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model ID (e.g. grok-4-fast) |
| `input` | string | Yes | Input text or array of input items |
| `instructions` | string | No | System instructions |
| `previous_response_id` | string | No | ID of previous response for multi-turn |
| `max_output_tokens` | number | No | Maximum output tokens (includes reasoning tokens) |
| `temperature` | number | No | Sampling temperature (0-2) |
| `top_p` | number | No | Nucleus sampling threshold |
| `tools` | array | Yes | Tools available to the model (max 128)<br>Enum: `function`, `web_search`, `web_search_preview`, `file_search` |
| `tool_choice` | string | No | Tool choice strategy |
| `store` | boolean | No | Whether to persist the response (30 days) |
| `stream` | boolean | No | Enable SSE streaming |
| `search_parameters` | object | No | Live web/X search configuration<br>Enum: `off`, `on`, `auto` |
| `max_search_results` | number | No | Maximum search results |
| `return_citations` | boolean | No | Include citations in response |
| `text` | object | No | Output text format configuration |
| `reasoning` | object | No | Reasoning configuration<br>Enum: `low`, `medium`, `high` |
| `prompt_cache_key` | string | No | Routing key for conversation caching |
| `parallel_tool_calls` | boolean | No | Allow parallel tool calls |
| `user` | string | No | End user identifier |

**Validation:**

```typescript
// Access the schema
xai.responses.payloadSchema

// Validate data
xai.responses.validatePayload(data)
```

</details>

<details>
<summary><b><code>realtime.client_secrets</code></b> — <code>POST /realtime/client_secrets</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expires_after` | object | Yes | Expiration configuration for the ephemeral token |
| `session` | object | No | Optional initial session configuration to bind |

**Validation:**

```typescript
// Access the schema
xai.realtime.client.secrets.payloadSchema

// Validate data
xai.realtime.client.secrets.validatePayload(data)
```

</details>

<details>
<summary><b><code>tokenizetext</code></b> — <code>POST /tokenize-text</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model to use for tokenization (e.g. grok-4-0709) |
| `text` | string | Yes | Text content to tokenize |
| `user` | string | No | End-user identifier |

**Validation:**

```typescript
// Access the schema
xai.tokenize.text.payloadSchema

// Validate data
xai.tokenize.text.validatePayload(data)
```

</details>

<details>
<summary><b><code>auth.teams.teamId.apikeys</code></b> — <code>POST /auth/teams/{teamId}/api-keys</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name for the API key |
| `acls` | array | No | ACL permission strings (e.g. api-key:endpoint:*) |
| `qps` | number | No | Queries per second limit |
| `qpm` | number | No | Queries per minute limit |
| `tpm` | string | No | Tokens per minute limit |
| `expireTime` | string | No | Expiration time (ISO 8601) |

**Validation:**

```typescript
// Access the schema
xai.api.key.create.payloadSchema

// Validate data
xai.api.key.create.validatePayload(data)
```

</details>

<details>
<summary><b><code>videos.extensions</code></b> — <code>POST /videos/extensions</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text prompt for video extension |
| `model` | string | No | Model ID |
| `duration` | number | No | Extension duration in seconds |
| `video` | object | Yes | Source video to extend |

**Validation:**

```typescript
// Access the schema
xai.video.extensions.payloadSchema

// Validate data
xai.video.extensions.validatePayload(data)
```

</details>

### DELETE Endpoints

<details>
<summary><b><code>responses.id</code></b> — <code>DELETE /responses/{id}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | The ID of the response to delete |

**Validation:**

```typescript
// Access the schema
xai.responses.delete.payloadSchema

// Validate data
xai.responses.delete.validatePayload(data)
```

</details>

### PUT Endpoints

<details>
<summary><b><code>collections.collection_id</code></b> — <code>PUT /collections/{collection_id}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `team_id` | string | No | Team ID |
| `collection_name` | string | No | New collection name |
| `collection_description` | string | No | New collection description |
| `chunk_configuration` | object | No | Updated chunk configuration |
| `field_definition_updates` | array | Yes | Field definition changes |
| `required` | boolean | No |  |
| `unique` | boolean | No |  |
| `inject_into_chunk` | boolean | No |  |
| `description` | string | No |  |
| `operation` | string | Yes | <br>Enum: `FIELD_DEFINITION_ADD`, `FIELD_DEFINITION_DELETE` |

**Validation:**

```typescript
// Access the schema
xai.collection.update.payloadSchema

// Validate data
xai.collection.update.validatePayload(data)
```

</details>

<details>
<summary><b><code>auth.apikeys.api_key_id</code></b> — <code>PUT /auth/api-keys/{api_key_id}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiKey` | object | Yes | Fields to update on the API key |
| `qps` | number | No | Queries per second limit |
| `qpm` | number | No | Queries per minute limit |
| `tpm` | string | No | Tokens per minute limit |
| `disabled` | boolean | No | Whether the key is disabled |
| `expireTime` | string | No | Expiration time (ISO 8601) |
| `aclStrings` | array | No | ACL permission strings |
| `fieldMask` | string | Yes | Comma-separated field names to update |

**Validation:**

```typescript
// Access the schema
xai.api.key.update.payloadSchema

// Validate data
xai.api.key.update.validatePayload(data)
```

</details>

## Middleware

```typescript
import { xai as createXai, withRetry } from "@nakedapi/xai";

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
} from "@nakedapi/xai";

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
