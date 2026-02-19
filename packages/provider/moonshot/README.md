# @bareapi/moonshot

Moonshot AI provider for BareAPI - **completely standalone** with streaming-first API, file uploads, embeddings, and built-in middleware.

## Installation

```bash
npm install @bareapi/moonshot
# or
yarn add @bareapi/moonshot
# or
pnpm add @bareapi/moonshot
```

**No other dependencies required!**

## Quick Start

```typescript
import { moonshot, type ChatRequest } from "@bareapi/moonshot";

// Create provider
const provider = moonshot({
  apiKey: process.env.MOONSHOT_API_KEY!,
});

// Use it
const request: ChatRequest = {
  model: "kimi-k2-5",
  messages: [{ role: "user", content: "Hello!" }],
};

for await (const chunk of provider.streamChat(request)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

## What's Included

- **Core Types**: `ChatRequest`, `ChatMessage`, `Provider`, etc.
- **Moonshot Implementation**: Streaming chat completion for Moonshot AI
- **Files API**: Upload, list, delete, and retrieve files
- **Embeddings API**: Generate text embeddings
- **SSE Utilities**: Server-Sent Events handling
- **Middleware**: Retry and fallback functionality
- **Error Handling**: Moonshot-specific error types

## Chat Completions

### Streaming

```typescript
import { moonshot } from "@bareapi/moonshot";

const provider = moonshot({ apiKey: "your-api-key" });

const request = {
  model: "kimi-k2-5",
  messages: [{ role: "user", content: "Hello!" }],
  temperature: 0.7,
  maxTokens: 1000,
};

for await (const chunk of provider.streamChat(request)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}
```

### Non-Streaming

```typescript
const response = await provider.chat(request);
console.log(response.content);
console.log(response.usage); // token counts
```

## Files API

Upload and manage files for use with Moonshot AI (e.g., for RAG).

### Upload File

```typescript
// From browser File
const fileInput = document.getElementById("file") as HTMLInputElement;
const file = fileInput.files![0];
const uploaded = await provider.uploadFile(file, "assistants");
console.log(uploaded.id); // file ID

// From Buffer (Node.js)
import { readFileSync } from "fs";
const buffer = readFileSync("./document.pdf");
const uploaded = await provider.uploadFile(
  buffer,
  "assistants",
  "document.pdf"
);
```

### List Files

```typescript
const files = await provider.listFiles();
for (const file of files) {
  console.log(`${file.id}: ${file.filename} (${file.bytes} bytes)`);
}
```

### Delete File

```typescript
await provider.deleteFile("file-abc123");
```

### Retrieve File

```typescript
const file = await provider.retrieveFile("file-abc123");
console.log(file.status); // "uploaded", "processed", "error"
```

### Retrieve File Content

```typescript
const content = await provider.retrieveFileContent("file-abc123");
console.log(content); // file content as string
```

## Embeddings API

Generate text embeddings for semantic search, clustering, etc.

```typescript
// Single text
const response = await provider.createEmbedding("Hello world");
console.log(response.data[0].embedding); // number[]

// Multiple texts
const response = await provider.createEmbedding(["First text", "Second text"]);

// Custom model and options
const response = await provider.createEmbedding(
  "Hello world",
  "moonshot-embedding-1",
  { encoding_format: "float", dimensions: 1536 }
);
```

## Middleware Usage

```typescript
import { moonshot, withRetry, withFallback } from "@bareapi/moonshot";

const baseProvider = moonshot({
  apiKey: process.env.MOONSHOT_API_KEY!,
});

// Add retry logic
const resilientProvider = withRetry(baseProvider, {
  retries: 3,
  baseMs: 500,
});

// Add fallback logic
const fallbackProvider = withFallback([
  moonshot({ apiKey: process.env.MOONSHOT_API_KEY! }),
  moonshot({ apiKey: process.env.MOONSHOT_API_KEY_2! }),
]);
```

## Configuration Options

```typescript
const provider = moonshot({
  apiKey: "your-api-key",
  baseURL: "https://api.moonshot.cn/v1", // optional
  timeout: 30000, // optional, default: 30000ms
  maxRetries: 3, // optional, default: 3
  fetch: customFetch, // optional, custom fetch implementation
});
```

## Environment Variables

```bash
MOONSHOT_API_KEY=your-api-key
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
MOONSHOT_TIMEOUT=30000
MOONSHOT_MAX_RETRIES=3
```

## Supported Models

- `kimi-k2-5` (131,072 context tokens)
- `moonshot-v1-128k` (131,072 context tokens)
- `moonshot-v1-32k` (32,768 context tokens)
- `moonshot-v1-8k` (8,192 context tokens)

## Why Standalone?

- **Faster Installation**: No extra dependencies
- **Smaller Bundle**: Only what you need
- **Easier Maintenance**: Self-contained package
- **Focused**: Moonshot-specific functionality only

## License

MIT
