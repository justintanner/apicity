# @bareapi/keiai

Kei AI provider for video and image generation (Kling 3.0, Grok Imagine, Nano Banana Pro).

## Installation

```bash
npm install @bareapi/keiai
# or
pnpm add @bareapi/keiai
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
import { keiai } from "@bareapi/keiai";

const provider = keiai({
  apiKey: process.env.KEI_AI_API_KEY!,
});

// Generate a video with Kling 3.0
const result = await provider.generate({
  model: "kling-3.0/video",
  input: {
    prompt: "A futuristic cityscape with flying cars at sunset",
    sound: true,
    duration: "5",
    mode: "pro",
    multi_shots: false,
  },
});

console.log("Video URL:", result.videoUrl);
```

### Grok Imagine - Text to Image

```typescript
const result = await provider.generate({
  model: "grok-imagine/text-to-image",
  input: {
    prompt: "A serene mountain landscape at dawn with misty valleys",
    aspect_ratio: "16:9",
  },
});

console.log("Image URL:", result.imageUrl);
```

### Grok Imagine - Text to Video

```typescript
const result = await provider.generate({
  model: "grok-imagine/text-to-video",
  input: {
    prompt: "A time-lapse of flowers blooming in a garden",
    aspect_ratio: "16:9",
    duration: "10",
  },
});

console.log("Video URL:", result.videoUrl);
```

### Nano Banana Pro

```typescript
const result = await provider.generate({
  model: "nano-banana-pro",
  input: {
    prompt: "A detailed illustration of a vintage bicycle in a Parisian street",
    aspect_ratio: "3:2",
    resolution: "2K",
    output_format: "png",
  },
});

console.log("Image URL:", result.imageUrl);
```

### Async Task Creation with Polling

```typescript
// Create task and poll manually
const { taskId } = await provider.createTask({
  model: "kling-3.0/video",
  input: {
    prompt: "A cat playing with a ball of yarn",
    sound: true,
    duration: "5",
    mode: "std",
    multi_shots: false,
  },
});

console.log("Task ID:", taskId);

// Poll for status manually
const status = await provider.getTaskStatus(taskId);
console.log("Status:", status.status);

// Or wait for completion with progress callback
const result = await provider.waitForTask(taskId, {
  intervalMs: 3000,
  maxAttempts: 100,
  onProgress: (status) => {
    console.log(`Progress: ${status.status}`);
  },
});
```

### Kling 3.0 Multi-Shot Video

```typescript
const result = await provider.generate({
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

### `keiai(options)`

Creates a Kei AI provider instance.

**Options:**

- `apiKey` (string, required): Your Kei AI API key
- `baseURL` (string, optional): Custom API base URL
- `timeout` (number, optional): Request timeout in milliseconds (default: 30000)
- `fetch` (function, optional): Custom fetch implementation

**Methods:**

- `createTask(req)`: Creates a media generation task
- `getTaskStatus(taskId)`: Gets the current status of a task
- `waitForTask(taskId, options)`: Waits for a task to complete
- `generate(req, options)`: Creates a task and waits for completion
- `validateModel(modelId)`: Checks if a model is supported
- `getModels()`: Returns list of supported models
- `getModelType(modelId)`: Returns the media type for a model

## License

MIT
