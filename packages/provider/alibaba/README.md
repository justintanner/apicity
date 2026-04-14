# @apicity/alibaba

[![npm](https://img.shields.io/npm/v/@apicity/alibaba?color=cb0000)](https://www.npmjs.com/package/@apicity/alibaba)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Alibaba Cloud Model Studio provider for chat completions and streaming.

## Installation

```bash
npm install @apicity/alibaba
# or
pnpm add @apicity/alibaba
```

## Quick Start

```typescript
import { alibaba as createAlibaba } from "@apicity/alibaba";

const alibaba = createAlibaba({ apiKey: process.env.ALIBABA_API_KEY! });
```

## API Reference

4 endpoints across 3 groups. Each method mirrors an upstream URL path.

### compatibleMode

<details>
<summary><code>GET</code> <b><code>alibaba.compatibleMode.v1.models</code></b></summary>

<code>GET https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.compatibleMode.v1.models({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

<details>
<summary><code>POST</code> <b><code>alibaba.compatibleMode.v1.chat.completions</code></b></summary>

<code>POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.compatibleMode.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

### services

<details>
<summary><code>POST</code> <b><code>alibaba.api.v1.services.aigc.videoGeneration.videoSynthesis</code></b></summary>

<code>POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/services/aigc/video-generation/video-synthesis</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.api.v1.services.aigc.videoGeneration.videoSynthesis({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

### tasks

<details>
<summary><code>GET</code> <b><code>alibaba.api.v1.tasks</code></b></summary>

<code>GET https://dashscope-intl.aliyuncs.com/compatible-mode/v1/tasks/{taskId}</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.api.v1.tasks({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

## Middleware

```typescript
import { alibaba as createAlibaba, withRetry } from "@apicity/alibaba";

const alibaba = createAlibaba({ apiKey: process.env.ALIBABA_API_KEY! });
const models = withRetry(alibaba.get.v1.models, { retries: 3 });
```

## License

MIT
