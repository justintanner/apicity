# @nakedapi/kie

Kie provider for video and image generation (Kling 3.0, Grok Imagine, Nano Banana Pro).

## Installation

```bash
npm install @nakedapi/kie
# or
pnpm add @nakedapi/kie
```

## Supported Models

| Model                         | Type  | Description                                           |
| ----------------------------- | ----- | ----------------------------------------------------- |
| `kling-3.0/video`             | Video | High-quality video generation with multi-shot support |
| `grok-imagine/text-to-image`  | Image | Text-to-image generation                              |
| `grok-imagine/image-to-image` | Image | Image-to-image generation                             |
| `grok-imagine/text-to-video`  | Video | Text-to-video generation                              |
| `grok-imagine/image-to-video` | Video | Image-to-video generation                             |
| `nano-banana-pro`             | Image | Google's advanced image generation model              |

## Usage

### Basic Example

```typescript
import { kie } from "@nakedapi/kie";

const provider = kie({
  apiKey: process.env.KIE_API_KEY!,
});

// Create a video generation task with Kling 3.0
const { taskId } = await provider.createTask({
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
const { taskId } = await provider.createTask({
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
const { taskId } = await provider.createTask({
  model: "grok-imagine/text-to-video",
  input: {
    prompt: "A time-lapse of flowers blooming in a garden",
    aspect_ratio: "16:9",
    duration: "10",
  },
});

console.log("Task ID:", taskId);
```

### Nano Banana Pro

```typescript
const { taskId } = await provider.createTask({
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
const { taskId } = await provider.createTask({
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

## API Reference

### `kie(options)`

Creates a Kie provider instance.

**Options:**

- `apiKey` (string, required): Your Kie API key
- `baseURL` (string, optional): Custom API base URL
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `fetch` (function, optional): Custom fetch implementation

**Methods:**

- `createTask(req)`: Creates a media generation task
- `validateModel(modelId)`: Checks if a model is supported
- `getModels()`: Returns list of supported models
- `getModelType(modelId)`: Returns the media type for a model

## License

MIT
