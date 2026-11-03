# @apicity/wavespeed

[![npm](https://img.shields.io/npm/v/@apicity/wavespeed?color=cb0000)](https://www.npmjs.com/package/@apicity/wavespeed)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-wavespeed.ai-blue)](https://wavespeed.ai/docs/rest-api)

WaveSpeed AI media generation API provider.

WaveSpeed runs one endpoint per model id: a model call answers at once with a prediction id in `data.id`, and `api.v3.predictions.result` reads that prediction until `data.status` is `completed`, when `data.outputs` holds the results, or `failed`, `cancelled`, `timeout` or `deleted`. Poll at least 2 s apart, and never resubmit a model call automatically: a submit whose answer was lost may still have created, and billed, a task. The key goes in `Authorization: Bearer`. API errors answer `{ code, message }` and reject with `WaveSpeedError`, whose `code` is that envelope code (404 for an unknown prediction). Output URLs are temporary.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to every POST endpoint as `.schema`, and the prediction statuses as `WaveSpeedPredictionStatusSchema`

## Installation

```bash
npm install @apicity/wavespeed
# or
pnpm add @apicity/wavespeed
```

## Quick Start

```typescript
import { createWaveSpeed } from "@apicity/wavespeed";

const wavespeed = createWaveSpeed({ apiKey: process.env.WAVESPEED_API_KEY! });
```

## API Reference

24 endpoints across 9 groups. Each method mirrors an upstream URL path.

### alibaba

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.alibaba.happyhorse1p1.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/alibaba/happyhorse-1.1/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/alibaba/happyhorse-1.1/image-to-video)

```typescript
const res = await wavespeed.api.v3.alibaba.happyhorse1p1.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.alibaba.wan3p0.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/alibaba/wan-3.0/image-to-video)

```typescript
const res = await wavespeed.api.v3.alibaba.wan3p0.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.alibaba.wan3p0.referenceToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/alibaba/wan-3.0/reference-to-video)

```typescript
const res = await wavespeed.api.v3.alibaba.wan3p0.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.alibaba.wan3p0.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/alibaba/wan-3.0/text-to-video)

```typescript
const res = await wavespeed.api.v3.alibaba.wan3p0.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.alibaba.wan3p0.videoEdit</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/video-edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/alibaba/wan-3.0/video-edit)

```typescript
const res = await wavespeed.api.v3.alibaba.wan3p0.videoEdit({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### blackForestLabs

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.blackForestLabs.flux3.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/black-forest-labs/flux-3/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/black-forest-labs/flux-3/image-to-video)

```typescript
const res = await wavespeed.api.v3.blackForestLabs.flux3.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.blackForestLabs.flux3.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/black-forest-labs/flux-3/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/black-forest-labs/flux-3/text-to-video)

```typescript
const res = await wavespeed.api.v3.blackForestLabs.flux3.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### bytedance

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.bytedance.seedance2p0.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/bytedance/seedance-2.0/image-to-video)

```typescript
const res = await wavespeed.api.v3.bytedance.seedance2p0.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.bytedance.seedance2p0.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/bytedance/seedance-2.0/text-to-video)

```typescript
const res = await wavespeed.api.v3.bytedance.seedance2p0.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.bytedance.seedance2p5.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/bytedance/seedance-2.5/image-to-video)

```typescript
const res = await wavespeed.api.v3.bytedance.seedance2p5.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.bytedance.seedance2p5.referenceToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/bytedance/seedance-2.5/reference-to-video)

```typescript
const res = await wavespeed.api.v3.bytedance.seedance2p5.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.bytedance.seedance2p5.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/bytedance/seedance-2.5/text-to-video)

```typescript
const res = await wavespeed.api.v3.bytedance.seedance2p5.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.bytedance.seedance2p5.videoEdit</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.5/video-edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/bytedance/seedance-2.5/video-edit)

```typescript
const res = await wavespeed.api.v3.bytedance.seedance2p5.videoEdit({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### google

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.google.geminiOmni1p1Flash.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/google/gemini-omni-1.1-flash/image-to-video)

```typescript
const res = await wavespeed.api.v3.google.geminiOmni1p1Flash.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.google.geminiOmni1p1Flash.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/google/gemini-omni-1.1-flash/text-to-video)

```typescript
const res = await wavespeed.api.v3.google.geminiOmni1p1Flash.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.google.geminiOmni1p1Flash.videoEdit</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/google/gemini-omni-1.1-flash/video-edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/google/gemini-omni-1.1-flash/video-edit)

```typescript
const res = await wavespeed.api.v3.google.geminiOmni1p1Flash.videoEdit({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### heygen

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.heygen.video1p0.referenceToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/heygen/video-1.0/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/heygen/video-1.0/reference-to-video)

```typescript
const res = await wavespeed.api.v3.heygen.video1p0.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.heygen.video1p0.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/heygen/video-1.0/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/heygen/video-1.0/text-to-video)

```typescript
const res = await wavespeed.api.v3.heygen.video1p0.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### minimax

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.minimax.h3.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/minimax/h3/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/minimax/h3/image-to-video)

```typescript
const res = await wavespeed.api.v3.minimax.h3.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.minimax.h3.referenceToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/minimax/h3/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/minimax/h3/reference-to-video)

```typescript
const res = await wavespeed.api.v3.minimax.h3.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.minimax.h3.textToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/minimax/h3/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/minimax/h3/text-to-video)

```typescript
const res = await wavespeed.api.v3.minimax.h3.textToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### predictions

<details>
<summary><code>GET</code> <b><code>wavespeed.api.v3.predictions.result</code></b></summary>

<code>GET https://api.wavespeed.ai/api/v3/predictions/{id}/result</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/docs/get-result)

```typescript
const prediction = await wavespeed.api.v3.predictions.result("prediction_id");
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### wavespeedAi

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.wavespeedAi.minimaxH3.videoEdit</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/wavespeed-ai/minimax-h3/video-edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/wavespeed-ai/minimax-h3/video-edit)

```typescript
const res = await wavespeed.api.v3.wavespeedAi.minimaxH3.videoEdit({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

### xAi

<details>
<summary><code>POST</code> <b><code>wavespeed.api.v3.xAi.grokImagineVideoV1p5.imageToVideo</code></b></summary>

<code>POST https://api.wavespeed.ai/api/v3/x-ai/grok-imagine-video-v1.5/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://wavespeed.ai/models/x-ai/grok-imagine-video-v1.5/image-to-video)

```typescript
const res = await wavespeed.api.v3.xAi.grokImagineVideoV1p5.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/wavespeed/src/wavespeed.ts`](src/wavespeed.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
