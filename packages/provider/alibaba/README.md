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

<details>
<summary><b><code>services.aigc.videogeneration.videosynthesis</code></b> — <code>POST /services/aigc/video-generation/video-synthesis</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Wan image-to-video model ID (e.g. wan2.7-i2v, wan2.6-i2v-flash) |
| `input` | object | Yes | Prompt + image (and optional audio) inputs |
| `img_url` | string | Yes | Public HTTPS URL or base64 data URL of the first frame |
| `audio_url` | string | No | Optional public HTTPS URL of an audio track for audio-video sync (wan2.5/2.6/2.7) |
| `parameters` | object | No | Generation parameters<br>Enum: `480P`, `720P`, `1080P` |
| `duration` | number | No | Video duration in seconds (model-dependent, 2-15s) |
| `shot_type` | string | No | Multi-shot narrative mode (wan2.6+ only); default single<br>Enum: `single`, `multi` |
| `prompt_extend` | boolean | No | Enable intelligent prompt rewriting |
| `watermark` | boolean | No | Embed a watermark in the output |
| `audio` | boolean | No | For wan2.6-i2v-flash: set false to force silent output (billed at video-without-audio rate) |
| `seed` | number | No | Random seed for reproducibility |
| `negative_prompt` | string | No | Negative prompt — things to avoid in the output |

**Validation:**

```typescript
// Access the schema
alibaba.video.synthesis.payloadSchema

// Validate data
alibaba.video.synthesis.validatePayload(data)
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
