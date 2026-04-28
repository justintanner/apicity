# @apicity/kie

[![npm](https://img.shields.io/npm/v/@apicity/kie?color=cb0000)](https://www.npmjs.com/package/@apicity/kie)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Kie provider for video and image generation (Kling 3.0, Grok Imagine, Nano Banana Pro).

## Installation

```bash
npm install @apicity/kie
# or
pnpm add @apicity/kie
```

## Quick Start

```typescript
import { kie as createKie } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
```

## API Reference

21 endpoints across 15 groups. Each method mirrors an upstream URL path.

### chat

<details>
<summary><code>GET</code> <b><code>kie.api.v1.chat.credit</code></b></summary>

<code>GET https://api.kie.ai/api/v1/chat/credit</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.chat.credit({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### claude

<details>
<summary><code>POST</code> <b><code>kie.claude.v1.messages</code></b></summary>

<code>POST https://api.kie.ai/claude/v1/messages</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.claude.v1.messages({ /* ... */ });
```

Source: [`packages/provider/kie/src/claude.ts`](src/claude.ts)

</details>

### common

<details>
<summary><code>POST</code> <b><code>kie.api.v1.common.downloadUrl</code></b></summary>

<code>POST https://api.kie.ai/api/v1/common/download-url</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.common.downloadUrl({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### fileBase64Upload

<details>
<summary><code>POST</code> <b><code>kie.api.fileBase64Upload</code></b></summary>

<code>POST https://api.kie.ai/api/file-base64-upload</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.fileBase64Upload({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### fileStreamUpload

<details>
<summary><code>POST</code> <b><code>kie.api.fileStreamUpload</code></b></summary>

<code>POST https://api.kie.ai/api/file-stream-upload</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.fileStreamUpload({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### fileUrlUpload

<details>
<summary><code>POST</code> <b><code>kie.api.fileUrlUpload</code></b></summary>

<code>POST https://api.kie.ai/api/file-url-upload</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.fileUrlUpload({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### generate

<details>
<summary><code>GET</code> <b><code>kie.api.v1.generate.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/generate/record-info?taskId={taskId}</code>

```typescript
const res = await kie.api.v1.generate.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.api.v1.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.api.v1.generate.extend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/extend</code>

```typescript
const res = await kie.api.v1.generate.extend({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.api.v1.generate.uploadCover</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/upload-cover</code>

```typescript
const res = await kie.api.v1.generate.uploadCover({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.api.v1.generate.uploadExtend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/upload-extend</code>

```typescript
const res = await kie.api.v1.generate.uploadExtend({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### jobs

<details>
<summary><code>GET</code> <b><code>kie.api.v1.jobs.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.jobs.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.api.v1.jobs.createTask</code></b></summary>

<code>POST https://api.kie.ai/api/v1/jobs/createTask</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.jobs.createTask({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### lyrics

<details>
<summary><code>POST</code> <b><code>kie.api.v1.lyrics</code></b></summary>

<code>POST https://api.kie.ai/api/v1/lyrics</code>

```typescript
const res = await kie.api.v1.lyrics({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### midi

<details>
<summary><code>POST</code> <b><code>kie.api.v1.midi.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/midi/generate</code>

```typescript
const res = await kie.api.v1.midi.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### mp4

<details>
<summary><code>POST</code> <b><code>kie.api.v1.mp4.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/mp4/generate</code>

```typescript
const res = await kie.api.v1.mp4.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### style

<details>
<summary><code>POST</code> <b><code>kie.api.v1.style.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/style/generate</code>

```typescript
const res = await kie.api.v1.style.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### veo

<details>
<summary><code>POST</code> <b><code>kie.api.v1.veo.extend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/extend</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.veo.extend({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.api.v1.veo.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/generate</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.veo.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

### vocalRemoval

<details>
<summary><code>POST</code> <b><code>kie.api.v1.vocalRemoval.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/vocal-removal/generate</code>

```typescript
const res = await kie.api.v1.vocalRemoval.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### wav

<details>
<summary><code>POST</code> <b><code>kie.api.v1.wav.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/wav/generate</code>

```typescript
const res = await kie.api.v1.wav.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

## Middleware

```typescript
import { kie as createKie, withRetry } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
const models = withRetry(kie.get.v1.models, { retries: 3 });
```

## License

MIT
