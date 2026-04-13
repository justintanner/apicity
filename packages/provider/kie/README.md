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

11 endpoints across 9 groups. Each method mirrors an upstream URL path.

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
<summary><code>POST</code> <b><code>kie.api.v1.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate</code>

[Upstream docs ↗](https://docs.kie.ai)

```typescript
const res = await kie.api.v1.generate({ /* ... */ });
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

## Middleware

```typescript
import { kie as createKie, withRetry } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
const models = withRetry(kie.get.v1.models, { retries: 3 });
```

## License

MIT
