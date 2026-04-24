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

68 endpoints across 18 groups. Each method mirrors an upstream URL path.

### bytedance

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.fast.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/bytedance/seedance-2.0/fast/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.bytedance.seedance2p0.fast.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.fast.referenceToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/bytedance/seedance-2.0/fast/reference-to-video</code>

```typescript
const res = await fal.bytedance.seedance2p0.fast.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.fast.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/bytedance/seedance-2.0/fast/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.bytedance.seedance2p0.fast.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/bytedance/seedance-2.0/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.bytedance.seedance2p0.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.referenceToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/bytedance/seedance-2.0/reference-to-video</code>

```typescript
const res = await fal.bytedance.seedance2p0.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/bytedance/seedance-2.0/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.bytedance.seedance2p0.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.lite.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/bytedance/seedream/v5/lite/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.bytedance.seedream.v5.lite.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.lite.textToImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/bytedance/seedream/v5/lite/text-to-image</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.bytedance.seedream.v5.lite.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### falAi

<details>
<summary><code>POST</code> <b><code>fal.falAi.elevenlabs.speechToText.scribeV2</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/elevenlabs/speech-to-text/scribe-v2</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.falAi.elevenlabs.speechToText.scribeV2({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### gptImage1p5

<details>
<summary><code>POST</code> <b><code>fal.gptImage1p5</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.gptImage1p5({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.gptImage1p5.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.gptImage1p5.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### hunyuan

<details>
<summary><code>POST</code> <b><code>fal.hunyuan.v3.instructEdit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/hunyuan-image/v3/instruct/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.hunyuan.v3.instructEdit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### klingVideo

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3p4k.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/o3/4k/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.o3p4k.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3p4k.referenceToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/o3/4k/reference-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.o3p4k.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3p4k.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/o3/4k/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.o3p4k.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.pro.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/v3/pro/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.v3.pro.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.pro.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/v3/pro/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.v3.pro.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.standard.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/v3/standard/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.v3.standard.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.standard.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/kling-video/v3/standard/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.klingVideo.v3.standard.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### models

<details>
<summary><code>DELETE</code> <b><code>fal.v1.models.requests.payloads</code></b></summary>

<code>DELETE https://api.fal.ai/v1/models/requests/{param}/payloads</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.requests.payloads({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models</code></b></summary>

<code>GET https://api.fal.ai/v1/models</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.pricing</code></b></summary>

<code>GET https://api.fal.ai/v1/models/pricing</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.pricing.estimate</code></b></summary>

<code>GET https://api.fal.ai/v1/models/pricing/estimate</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing.estimate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.requests.payloads</code></b></summary>

<code>GET https://api.fal.ai/v1/models/requests/{param}/payloads</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.requests.payloads({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.models.pricing.estimate</code></b></summary>

<code>POST https://api.fal.ai/v1/models/pricing/estimate</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing.estimate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models</code></b></summary>

<code>GET https://api.fal.ai/v1/models</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.pricing</code></b></summary>

<code>GET https://api.fal.ai/v1/models/pricing</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.models.pricing.estimate</code></b></summary>

<code>POST https://api.fal.ai/v1/models/pricing/estimate</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing.estimate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fal.v1.models.requests.payloads</code></b></summary>

<code>DELETE https://api.fal.ai/v1/models/requests/{param}/payloads</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.requests.payloads({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBanana

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/nano-banana/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.nanoBanana.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana.textToImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/nano-banana</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.nanoBanana.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBanana2

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/nano-banana-2/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.nanoBanana2.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2.textToImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/nano-banana-2</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.nanoBanana2.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBananaPro

<details>
<summary><code>POST</code> <b><code>fal.nanoBananaPro.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/nano-banana-pro/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.nanoBananaPro.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBananaPro.textToImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/nano-banana-pro</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.nanoBananaPro.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### queue

<details>
<summary><code>POST</code> <b><code>fal.v1.queue.submit</code></b></summary>

<code>POST https://api.fal.ai/v1/POST</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.queue.submit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.queue.submit</code></b></summary>

<code>POST https://api.fal.ai/v1/POST</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.queue.submit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### qwenImage

<details>
<summary><code>POST</code> <b><code>fal.qwenImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/qwen-image</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.qwenImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.qwenImage.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/qwen-image-edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.qwenImage.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### serverless

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.logs</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/logs/stream</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.logs({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.files.uploadLocal</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/files/file/local/{param}</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.files.uploadLocal({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.files.uploadUrl</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/files/file/url/{param}</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.files.uploadUrl({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.files.uploadLocal</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/files/file/local/{param}</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.files.uploadLocal({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.files.uploadUrl</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/files/file/url/{param}</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.files.uploadUrl({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.logs</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/logs/stream</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.logs({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### sora2

<details>
<summary><code>POST</code> <b><code>fal.sora2.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/sora-2/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.sora2.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.sora2.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/sora-2/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.sora2.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### storage

<details>
<summary><b><code>fal.storage.upload.completeMultipart</code></b></summary>

```typescript
const res = await fal.storage.upload.completeMultipart({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><b><code>fal.storage.upload.initiate</code></b></summary>

```typescript
const res = await fal.storage.upload.initiate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><b><code>fal.storage.upload.initiateMultipart</code></b></summary>

```typescript
const res = await fal.storage.upload.initiateMultipart({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### veo3p1

<details>
<summary><code>POST</code> <b><code>fal.veo3p1.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/veo3.1/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.veo3p1.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.veo3p1.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/veo3.1</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.veo3p1.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### wan

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.wan.v2p7.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.editVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/edit-video</code>

```typescript
const res = await fal.wan.v2p7.editVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.wan.v2p7.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.pro.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/pro/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.wan.v2p7.pro.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.pro.textToImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/pro/text-to-image</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.wan.v2p7.pro.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.referenceToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/reference-to-video</code>

```typescript
const res = await fal.wan.v2p7.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.textToImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/text-to-image</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.wan.v2p7.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.textToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/wan/v2.7/text-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.wan.v2p7.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### workflows

<details>
<summary><code>GET</code> <b><code>fal.v1.workflows</code></b></summary>

<code>GET https://api.fal.ai/v1/workflows</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.workflows({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.workflows</code></b></summary>

<code>GET https://api.fal.ai/v1/workflows</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.workflows({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### xai

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineImage</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-image</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.xai.grokImagineImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineImage.edit</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-image/edit</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.xai.grokImagineImage.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.editVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-video/edit-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.xai.grokImagineVideo.editVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.extendVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-video/extend-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.xai.grokImagineVideo.extendVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.imageToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-video/image-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.xai.grokImagineVideo.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.referenceToVideo</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-video/reference-to-video</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.xai.grokImagineVideo.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

## Middleware

```typescript
import { fal as createFal, withRetry } from "@apicity/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });
const models = withRetry(fal.get.v1.models, { retries: 3 });
```

## License

MIT
