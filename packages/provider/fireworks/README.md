# @nakedapi/fireworks

[![npm](https://img.shields.io/npm/v/@nakedapi/fireworks?color=cb0000)](https://www.npmjs.com/package/@nakedapi/fireworks)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fireworks AI provider — chat completions, text completions, and embeddings. OpenAI-compatible API with Fireworks-specific extensions. Completely standalone with zero external dependencies.

## Installation

```bash
npm install @nakedapi/fireworks
# or
pnpm add @nakedapi/fireworks
```

## Quick Start

```typescript
import { fireworks as createFireworks } from "@nakedapi/fireworks";

const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY!,
});

const response = await fireworks.v1.chat.completions({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Endpoints

Base URL: `https://api.fireworks.ai/inference/v1`

| URL                      | Method Signature                 |
| ------------------------ | -------------------------------- |
| `POST /chat/completions` | `fireworks.v1.chat.completions()` |
| `POST /completions`      | `fireworks.v1.completions()`      |
| `POST /embeddings`       | `fireworks.v1.embeddings()`       |

## Usage Examples

### Chat Completions

```typescript
const response = await fireworks.v1.chat.completions({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "Explain monads in one sentence." }],
  max_tokens: 256,
});
```

### Chat with Tools

```typescript
const response = await fireworks.v1.chat.completions({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "What's the weather in SF?" }],
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather",
        parameters: {
          type: "object",
          properties: { location: { type: "string" } },
          required: ["location"],
        },
      },
    },
  ],
  tool_choice: "auto",
});
```

### Chat with Structured Output

```typescript
const response = await fireworks.v1.chat.completions({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "List 3 colors" }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "colors",
      schema: {
        type: "object",
        properties: {
          colors: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
});
```

### Text Completions

```typescript
const response = await fireworks.v1.completions({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  prompt: "Once upon a time",
  max_tokens: 100,
});
```

### Embeddings

```typescript
const response = await fireworks.v1.embeddings({
  model: "accounts/fireworks/models/nomic-embed-text-v1.5",
  input: "The food was delicious",
});
console.log(response.data[0].embedding);
```

### Embeddings with Fireworks-Specific Options

```typescript
const response = await fireworks.v1.embeddings({
  model: "accounts/fireworks/models/nomic-embed-text-v1.5",
  input: ["First document", "Second document"],
  dimensions: 512,
  prompt_template: "search_document: {prompt}",
  normalize: true,
});
```

## Streaming

```typescript
const stream = await fireworks.v1.chat.completions({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "Write a short story." }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices?.[0]?.delta?.content;
  if (delta) {
    process.stdout.write(delta);
  }
}
```

## Configuration

```typescript
const fireworks = createFireworks({
  apiKey: "your-api-key",       // required
  baseURL: "https://...",       // optional, custom base URL
  timeout: 30000,               // optional, ms (default: 30000)
  fetch: customFetch,           // optional, custom fetch implementation
});
```

## Middleware

```typescript
import {
  fireworks as createFireworks,
  withRetry,
  withFallback,
} from "@nakedapi/fireworks";

const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY!,
});

// Retry on transient errors (429, 5xx)
const chat = withRetry(fireworks.v1.chat.completions, { retries: 3 });

// Failover across accounts
const primary = createFireworks({ apiKey: process.env.FIREWORKS_KEY_PRIMARY! });
const backup = createFireworks({ apiKey: process.env.FIREWORKS_KEY_BACKUP! });
const resilient = withFallback([
  primary.v1.chat.completions,
  backup.v1.chat.completions,
]);
```

## Payload Validation

```typescript
// Check schema
console.log(fireworks.v1.chat.completions.payloadSchema);

// Validate before sending
const { valid, errors } = fireworks.v1.chat.completions.validatePayload({
  model: "accounts/fireworks/models/llama-v3p1-70b-instruct",
  messages: [{ role: "user", content: "Hello" }],
});
```

## Fireworks-Specific Features

Fireworks AI extends the OpenAI-compatible API with additional parameters:

### Chat Completions

- **`top_k`** — Limits token sampling to the top K candidates
- **`response_format.type: "json_schema"`** — Structured output with JSON schema enforcement
- **`perf_metrics_in_response`** — Include performance metrics in the response
- **`prompt_cache_isolation_key`** — Control prompt caching behavior across requests
- **`raw_output`** — Return raw model output without post-processing

### Embeddings

- **`dimensions`** — Reduce embedding dimensionality
- **`prompt_template`** — Template for wrapping input text (e.g., `"search_document: {prompt}"`)
- **`normalize`** — L2-normalize the output embeddings
- **`return_logits`** — Return raw logits instead of embeddings

### Model Format

Fireworks models use a namespaced format:

```
accounts/fireworks/models/<model-name>
```

For example: `accounts/fireworks/models/llama-v3p1-70b-instruct`

## License

MIT
