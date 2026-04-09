# @nakedapi/alibaba

[![npm](https://img.shields.io/npm/v/@nakedapi/alibaba?color=cb0000)](https://www.npmjs.com/package/@nakedapi/alibaba)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Alibaba Cloud Model Studio provider for chat completions and streaming.

## Installation

```bash
npm install @nakedapi/alibaba
# or
pnpm add @nakedapi/alibaba
```

## Quick Start

```typescript
import { alibaba as createAlibaba } from "@nakedapi/alibaba";

const alibaba = createAlibaba({ apiKey: process.env.ALIBABA_API_KEY! });
```

## API Reference

All methods include their payload schema and a `validatePayload()` function for runtime validation.

### POST Endpoints

<details>
<summary><b><code>chat.completions</code></b> — <code>POST /chat/completions</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model ID (e.g. qwen3-max, qwen3-plus, qwen3-flash, qwen-turbo) |
| `messages` | array | Yes | Array of chat messages<br>Enum: `system`, `user`, `assistant`, `tool` |
| `content` | string | Yes | Message content |
| `temperature` | number | No | Sampling temperature (0 to 2) |
| `top_p` | number | No | Nucleus sampling threshold (0 to 1) |
| `max_tokens` | number | No | Maximum tokens to generate |
| `n` | number | No | Number of completions to generate (1-4) |
| `stop` | string | No | Stop sequence(s) |
| `stream` | boolean | No | Enable streaming output |
| `seed` | number | No | Random seed for reproducibility |
| `presence_penalty` | number | No | Presence penalty (-2.0 to 2.0) |
| `tools` | array | Yes | Tool/function definitions for function calling<br>Enum: `function` |
| `function` | object | Yes | Function name |
| `description` | string | No | Function description |
| `parameters` | object | No | JSON Schema for function parameters |
| `tool_choice` | string | No | Tool choice strategy (auto, none, or object) |
| `enable_search` | boolean | No | Enable web search augmentation (Alibaba-specific) |
| `stream_options` | object | No | Streaming options |
| `response_format` | object | No | Response format constraint<br>Enum: `text`, `json_object` |

**Validation:**

```typescript
// Access the schema
alibaba.chat.completions.payloadSchema

// Validate data
alibaba.chat.completions.validatePayload(data)
```

</details>

## Middleware

```typescript
import { alibaba as createAlibaba, withRetry } from "@nakedapi/alibaba";

const alibaba = createAlibaba({ apiKey: process.env.ALIBABA_API_KEY! });
const models = withRetry(alibaba.get.v1.models, { retries: 3 });
```

## License

MIT
