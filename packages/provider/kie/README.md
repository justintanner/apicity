# @nakedapi/kie

[![npm](https://img.shields.io/npm/v/@nakedapi/kie?color=cb0000)](https://www.npmjs.com/package/@nakedapi/kie)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Kie provider for media generation — video, image, audio, and transcription.

## Installation

```bash
npm install @nakedapi/kie
# or
pnpm add @nakedapi/kie
```

## Supported Models

| Model                            | Type          | Description                                           |
| -------------------------------- | ------------- | ----------------------------------------------------- |
| `kling-3.0/video`                | Video         | High-quality video generation with multi-shot support |
| `grok-imagine/text-to-image`     | Image         | Text-to-image generation                              |
| `grok-imagine/image-to-image`    | Image         | Image-to-image generation                             |
| `grok-imagine/text-to-video`     | Video         | Text-to-video generation                              |
| `grok-imagine/image-to-video`    | Video         | Image-to-video generation                             |
| `nano-banana-pro`                | Image         | Advanced image generation                             |
| `bytedance/seedance-1.5-pro`     | Video         | Seedance video generation                             |
| `nano-banana-2`                  | Image         | Image generation with Google Search support           |
| `gpt-image/1.5-image-to-image`   | Image         | GPT image-to-image editing                            |
| `seedream/5-lite-image-to-image` | Image         | Seedream image-to-image editing                       |
| `elevenlabs/text-to-dialogue-v3` | Audio         | Multi-voice dialogue generation                       |
| `elevenlabs/sound-effect-v2`     | Audio         | Sound effect generation                               |
| `elevenlabs/speech-to-text`      | Transcription | Speech-to-text transcription                          |
| `sora-watermark-remover`         | Video         | Remove watermarks from video                          |

## Usage

### Basic Example

```typescript
import { kie as createKie } from "@nakedapi/kie";

const kie = createKie({
  apiKey: process.env.KIE_API_KEY!,
});

// Create a video generation task with Kling 3.0
const { taskId } = await kie.post.api.v1.jobs.createTask({
  model: "kling-3.0/video",
  input: {
    prompt: "A futuristic cityscape with flying cars at sunset",
    sound: true,
    duration: "5",
    mode: "pro",
    multi_shots: false,
  },
});

console.log("Task ID:", taskId);
```

### Grok Imagine - Text to Image

```typescript
const { taskId } = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine/text-to-image",
  input: {
    prompt: "A serene mountain landscape at dawn with misty valleys",
    aspect_ratio: "16:9",
  },
});

console.log("Task ID:", taskId);
```

### Grok Imagine - Text to Video

```typescript
const { taskId } = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine/text-to-video",
  input: {
    prompt: "A time-lapse of flowers blooming in a garden",
    aspect_ratio: "16:9",
    duration: "10",
  },
});

console.log("Task ID:", taskId);
```

### Upload Media

```typescript
import { readFile } from "node:fs/promises";

const buffer = await readFile("./my-image.png");
const file = new Blob([buffer], { type: "image/png" });

const { downloadUrl } = await kie.post.api.fileStreamUpload({
  file,
  filename: "my-image.png",
});

console.log("Uploaded to:", downloadUrl);
```

### Get Temporary Download URL

Convert a kie.ai file URL into a temporary downloadable link (valid 20 minutes):

```typescript
const { url } = await kie.post.api.v1.common.downloadUrl({
  url: "https://cdn.kie.ai/files/some-generated-video.mp4",
});

console.log("Download from:", url);
```

### Check Task Status

```typescript
const task = await kie.get.api.v1.jobs.recordInfo(taskId);

if (task.state === "success") {
  console.log("Result URLs:", task.result?.resultUrls);
} else if (task.state === "fail") {
  console.log("Failed:", task.failMsg);
} else {
  console.log(`In progress: ${task.progress}% (${task.state})`);
}
```

### Nano Banana Pro

```typescript
const { taskId } = await kie.post.api.v1.jobs.createTask({
  model: "nano-banana-pro",
  input: {
    prompt: "A detailed illustration of a vintage bicycle in a Parisian street",
    aspect_ratio: "3:2",
    resolution: "2K",
    output_format: "png",
  },
});

console.log("Task ID:", taskId);
```

### Kling 3.0 Multi-Shot Video

```typescript
const { taskId } = await kie.post.api.v1.jobs.createTask({
  model: "kling-3.0/video",
  input: {
    image_urls: ["https://example.com/first-frame.jpg"],
    sound: true,
    duration: "10",
    aspect_ratio: "16:9",
    mode: "pro",
    multi_shots: true,
    multi_prompt: [
      { prompt: "A car driving through a city", duration: 5 },
      { prompt: "The car parks in front of a building", duration: 5 },
    ],
  },
});
```

## Endpoints

Base URL: `https://api.kie.ai`

### Core

| URL                                   | Method Signature                         |
| ------------------------------------- | ---------------------------------------- |
| `POST /api/v1/jobs/createTask`        | `kie.post.api.v1.jobs.createTask()`      |
| `GET /api/v1/jobs/recordInfo?taskId=` | `kie.get.api.v1.jobs.recordInfo(taskId)` |
| `POST /api/v1/common/download-url`    | `kie.post.api.v1.common.downloadUrl()`   |
| `GET /api/v1/chat/credit`             | `kie.get.api.v1.chat.credit()`           |
| `POST /api/file-stream-upload`        | `kie.post.api.fileStreamUpload()`        |

### Sub-providers

| URL                                 | Method Signature                                 |
| ----------------------------------- | ------------------------------------------------ |
| `POST /api/v1/veo/generate`         | `kie.veo.post.api.v1.veo.generate()`             |
| `POST /api/v1/veo/extend`           | `kie.veo.post.api.v1.veo.extend()`               |
| `POST /api/v1/generate`             | `kie.suno.post.api.v1.generate()`                |
| `POST /gpt-5-2/v1/chat/completions` | `kie.chat.post["gpt-5-2"].v1.chat.completions()` |
| `POST /claude/v1/messages`          | `kie.claude.post.v1.messages()`                  |

## Data Shaping

| Method                        | What happens                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `post.api.fileStreamUpload()` | Infers MIME type from filename, generates timestamped upload path, wraps in FormData |

## API Reference

### `kie(options)`

Creates a Kie provider instance.

**Options:**

- `apiKey` (string, required): Your Kie API key
- `baseURL` (string, optional): Custom API base URL
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `fetch` (function, optional): Custom fetch implementation

**API methods:**

- `kie.post.api.v1.jobs.createTask(req)`: Creates a media generation task
- `kie.get.api.v1.jobs.recordInfo(taskId)`: Returns current task state, progress, and results
- `kie.post.api.fileStreamUpload(req)`: Uploads a file and returns a hosted URL
- `kie.post.api.v1.common.downloadUrl(req)`: Converts a kie.ai file URL to a temporary download link (20 min)
- `kie.get.api.v1.chat.credit()`: Returns account credit balance

**Sub-providers:**

- `kie.veo.post.api.v1.veo.generate(req)`: Generate video with Veo (veo3, veo3_fast)
- `kie.veo.post.api.v1.veo.extend(req)`: Extend an existing Veo video
- `kie.suno.post.api.v1.generate(req)`: Generate music with Suno
- `kie.chat.post["gpt-5-2"].v1.chat.completions(req)`: Chat completions (GPT-5.2)

## License

MIT
