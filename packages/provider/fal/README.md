# @apicity/fal

[![npm](https://img.shields.io/npm/v/@apicity/fal?color=cb0000)](https://www.npmjs.com/package/@apicity/fal)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fal Platform API provider for model management, pricing, usage, and analytics.

## Installation

```bash
npm install @apicity/fal
# or
pnpm add @apicity/fal
```

## Quick Start

```typescript
import { fal as createFal } from "@apicity/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });
```

## API Reference

All methods include their payload schema and a `validatePayload()` function for runtime validation.

### POST Endpoints

<details>
<summary><b><code>models.pricing.estimate</code></b> — <code>POST /models/pricing/estimate</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `estimate_type` | string | Yes | Type of cost estimate<br>Enum: `historical_api_price`, `unit_price` |
| `endpoints` | object | Yes |  |

**Validation:**

```typescript
// Access the schema
fal.pricing.estimate.payloadSchema

// Validate data
fal.pricing.estimate.validatePayload(data)
```

</details>

<details>
<summary><b><code>endpoint_id</code></b> — <code>POST /{endpoint_id}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `endpoint_id` | string | Yes | Model endpoint ID (e.g. fal-ai/flux/schnell) |
| `input` | object | Yes | Model-specific input payload |
| `webhook` | string | No | Webhook URL for async notification |
| `priority` | string | No | Queue priority (defaults to normal)<br>Enum: `normal`, `low` |
| `timeout` | number | No | Server-side request timeout in seconds |
| `no_retry` | boolean | No | Disable automatic retries |

**Validation:**

```typescript
// Access the schema
fal.queue.submit.payloadSchema

// Validate data
fal.queue.submit.validatePayload(data)
```

</details>

<details>
<summary><b><code>serverless.logs.stream</code></b> — <code>POST /serverless/logs/stream</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | string | No | Start date in ISO8601 (defaults to 24h ago) |
| `end` | string | No | End date in ISO8601, exclusive (defaults to now) |
| `app_id` | array | No |  |
| `revision` | string | No | Filter by revision |
| `run_source` | string | No | Filter by run source<br>Enum: `grpc-run`, `grpc-register`, `gateway`, `cron` |
| `search` | string | No | Free-text search |
| `level` | string | No | Minimum log level |
| `job_id` | string | No | Filter by job ID |
| `request_id` | string | No | Filter by request ID |

**Validation:**

```typescript
// Access the schema
fal.logs.stream.payloadSchema

// Validate data
fal.logs.stream.validatePayload(data)
```

</details>

<details>
<summary><b><code>serverless.files.file.url.file</code></b> — <code>POST /serverless/files/file/url/{file}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | Yes | Target file path on fal storage |
| `url` | string | Yes | Publicly accessible URL to download the file from |

**Validation:**

```typescript
// Access the schema
fal.files.upload.url.payloadSchema

// Validate data
fal.files.upload.url.validatePayload(data)
```

</details>

<details>
<summary><b><code>serverless.files.file.local.target_path</code></b> — <code>POST /serverless/files/file/local/{target_path}</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_path` | string | Yes | Target file path on fal storage |
| `file` | object | Yes | Binary file content (Blob) |
| `filename` | string | No | Optional filename for the upload |
| `unzip` | boolean | No | If true and file is a ZIP, extract after upload |

**Validation:**

```typescript
// Access the schema
fal.files.upload.local.payloadSchema

// Validate data
fal.files.upload.local.validatePayload(data)
```

</details>

<details>
<summary><b><code>bytedance.seedance2.0.imagetovideo</code></b> — <code>POST /bytedance/seedance-2.0/image-to-video</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Text prompt describing desired motion and action |
| `image_url` | string | Yes | URL or data URL of the starting frame image (JPEG, PNG, WebP, max 30 MB) |
| `end_image_url` | string | No | Optional URL of the ending frame image |
| `resolution` | string | No | Video resolution (default 720p)<br>Enum: `480p`, `720p` |
| `duration` | string | No | Duration in seconds, 4-15 or auto (default auto)<br>Enum: `auto`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `14`, `15` |
| `aspect_ratio` | string | No | Aspect ratio of the generated video (default auto)<br>Enum: `auto`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, `9:16` |
| `generate_audio` | boolean | No | Whether to generate synchronized audio (default true). Cost is identical either way. |
| `seed` | number | No | Random seed for reproducibility |
| `end_user_id` | string | No | Unique end-user ID |

**Validation:**

```typescript
// Access the schema
fal.bytedance.seedance2p0.image.to.video.payloadSchema

// Validate data
fal.bytedance.seedance2p0.image.to.video.validatePayload(data)
```

</details>

<details>
<summary><b><code>falai.nanobananapro</code></b> — <code>POST /fal-ai/nano-banana-pro</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The text prompt to generate an image from |
| `num_images` | number | No | The number of images to generate (1-4, default 1) |
| `seed` | number | No | The seed for the random number generator |
| `aspect_ratio` | string | No | Aspect ratio of the generated image (default 1:1)<br>Enum: `auto`, `21:9`, `16:9`, `3:2`, `4:3`, `5:4`, `1:1`, `4:5`, `3:4`, `2:3`, `9:16` |
| `output_format` | string | No | Format of the generated image (default png)<br>Enum: `jpeg`, `png`, `webp` |
| `safety_tolerance` | string | No | Content moderation level: 1 strictest, 6 most permissive (default 4)<br>Enum: `1`, `2`, `3`, `4`, `5`, `6` |
| `sync_mode` | boolean | No | If true, media is returned as a data URI and not recorded in request history |
| `resolution` | string | No | Resolution of the generated image; 4K costs double (default 1K)<br>Enum: `1K`, `2K`, `4K` |
| `limit_generations` | boolean | No | Experimental: limit generations to 1 per prompt regardless of prompt instructions |
| `enable_web_search` | boolean | No | Enable web search to use the latest web information (adds $0.015 per call) |

**Validation:**

```typescript
// Access the schema
fal.nano.banana.pro.text.to.image.payloadSchema

// Validate data
fal.nano.banana.pro.text.to.image.validatePayload(data)
```

</details>

<details>
<summary><b><code>falai.nanobananapro.edit</code></b> — <code>POST /fal-ai/nano-banana-pro/edit</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The prompt for image editing |
| `image_urls` | array | Yes |  |
| `num_images` | number | No | The number of images to generate (1-4, default 1) |
| `seed` | number | No | The seed for the random number generator |
| `aspect_ratio` | string | No | Aspect ratio of the generated image (default auto)<br>Enum: `auto`, `21:9`, `16:9`, `3:2`, `4:3`, `5:4`, `1:1`, `4:5`, `3:4`, `2:3`, `9:16` |
| `output_format` | string | No | Format of the generated image (default png)<br>Enum: `jpeg`, `png`, `webp` |
| `safety_tolerance` | string | No | Content moderation level: 1 strictest, 6 most permissive (default 4)<br>Enum: `1`, `2`, `3`, `4`, `5`, `6` |
| `sync_mode` | boolean | No | If true, media is returned as a data URI and not recorded in request history |
| `resolution` | string | No | Resolution of the generated image; 4K costs double (default 1K)<br>Enum: `1K`, `2K`, `4K` |
| `limit_generations` | boolean | No | Experimental: limit generations to 1 per prompt regardless of prompt instructions |
| `enable_web_search` | boolean | No | Enable web search to use the latest web information (adds $0.015 per call) |

**Validation:**

```typescript
// Access the schema
fal.nano.banana.pro.edit.payloadSchema

// Validate data
fal.nano.banana.pro.edit.validatePayload(data)
```

</details>

<details>
<summary><b><code>falai.bytedance.seedream.v5.lite.edit</code></b> — <code>POST /fal-ai/bytedance/seedream/v5/lite/edit</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The text prompt used to edit the image |
| `image_urls` | array | Yes |  |
| `image_size` | string | No | The size of the generated image. Default: auto_2K. Can also be an object with width/height.<br>Enum: `auto_2K`, `auto_4K` |
| `num_images` | number | No | Number of separate model generations to run. Range: 1-6, default: 1 |
| `max_images` | number | No | Enables multi-image generation. Total images will be between num_images and max_images*num_images. Range: 1-6, default: 1 |
| `sync_mode` | boolean | No | If true, media is returned as a data URI and not available in request history. Default: false |
| `enable_safety_checker` | boolean | No | If set to true, the safety checker will be enabled. Default: true |

**Validation:**

```typescript
// Access the schema
fal.seedream.v5.lite.edit.payloadSchema

// Validate data
fal.seedream.v5.lite.edit.validatePayload(data)
```

</details>

<details>
<summary><b><code>falai.bytedance.seedream.v5.lite.texttoimage</code></b> — <code>POST /fal-ai/bytedance/seedream/v5/lite/text-to-image</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The text prompt used to generate the image |
| `image_size` | string | No | The size of the generated image. Default: auto_2K. Can also be an object with width/height.<br>Enum: `auto_2K`, `auto_4K` |
| `num_images` | number | No | Number of separate model generations to run. Range: 1-6, default: 1 |
| `max_images` | number | No | Enables multi-image generation. Total images will be between num_images and max_images*num_images. Range: 1-6, default: 1 |
| `sync_mode` | boolean | No | If true, media is returned as a data URI and not available in request history. Default: false |
| `enable_safety_checker` | boolean | No | If set to true, the safety checker will be enabled. Default: true |

**Validation:**

```typescript
// Access the schema
fal.seedream.v5.lite.text.to.image.payloadSchema

// Validate data
fal.seedream.v5.lite.text.to.image.validatePayload(data)
```

</details>

### DELETE Endpoints

<details>
<summary><b><code>models.requests.request_id.payloads</code></b> — <code>DELETE /models/requests/{request_id}/payloads</code></summary>

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request_id` | string | Yes | Request ID whose payloads to delete |
| `idempotency_key` | string | No | Optional idempotency key |

**Validation:**

```typescript
// Access the schema
fal.delete.payloads.payloadSchema

// Validate data
fal.delete.payloads.validatePayload(data)
```

</details>

## Middleware

```typescript
import { fal as createFal, withRetry } from "@apicity/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });
const models = withRetry(fal.get.v1.models, { retries: 3 });
```

## License

MIT
