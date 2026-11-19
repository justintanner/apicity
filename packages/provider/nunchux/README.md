# @apicity/nunchux

[![npm](https://img.shields.io/npm/v/@apicity/nunchux?color=cb0000)](https://www.npmjs.com/package/@apicity/nunchux)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-docs.nunchux.ai-blue)](https://docs.nunchux.ai/credits-pricing)

Nunchux AI media generation API provider.

Nunchux account credits and plan limits. `v1.credits()` is free and takes no job slot, but counts toward the request rate limit. Authentication uses `Authorization: Bearer`. `NunchuxError` preserves the HTTP status, error code and body across standard and partner errors.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to POST endpoints as `.schema`; the credits read takes no parameters

## Installation

```bash
npm install @apicity/nunchux
# or
pnpm add @apicity/nunchux
```

## Quick Start

```typescript
import { createNunchux } from "@apicity/nunchux";

const nunchux = createNunchux({ apiKey: process.env.NUNCHUX_API_KEY! });
```

## API Reference

10 endpoints across 6 groups. Each method mirrors an upstream URL path.

### alibaba

<details>
<summary><code>POST</code> <b><code>nunchux.v1.alibaba.services.aigc.videoGeneration.videoSynthesis</code></b></summary>

<code>POST https://api.nunchux.com/v1/alibaba/services/aigc/video-generation/video-synthesis</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/wan)

```typescript
const res = await nunchux.v1.alibaba.services.aigc.videoGeneration.videoSynthesis({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

<details>
<summary><code>GET</code> <b><code>nunchux.v1.alibaba.tasks</code></b></summary>

<code>GET https://api.nunchux.com/v1/alibaba/tasks/{task_id}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/wan)

```typescript
const res = await nunchux.v1.alibaba.tasks({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

### bytedance

<details>
<summary><code>POST</code> <b><code>nunchux.v1.bytedance.contents.generations.tasks</code></b></summary>

<code>POST https://api.nunchux.com/v1/bytedance/contents/generations/tasks</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/seedance)

```typescript
const res = await nunchux.v1.bytedance.contents.generations.tasks({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

<details>
<summary><code>GET</code> <b><code>nunchux.v1.bytedance.contents.generations.tasks.retrieve</code></b></summary>

<code>GET https://api.nunchux.com/v1/bytedance/contents/generations/tasks/{task_id}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/seedance)

```typescript
const res = await nunchux.v1.bytedance.contents.generations.tasks.retrieve({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

### credits

<details>
<summary><code>GET</code> <b><code>nunchux.v1.credits</code></b></summary>

<code>GET https://api.nunchux.com/v1/credits</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://docs.nunchux.ai/credits-pricing)

```typescript
const res = await nunchux.v1.credits();
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

### google

<details>
<summary><code>POST</code> <b><code>nunchux.v1.google.v1beta.interactions</code></b></summary>

<code>POST https://api.nunchux.com/v1/google/v1beta/interactions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/nano-banana)

```typescript
const res = await nunchux.v1.google.v1beta.interactions({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

### minimax

<details>
<summary><code>GET</code> <b><code>nunchux.v1.minimax.v2.query.videoGeneration</code></b></summary>

<code>GET https://api.nunchux.com/v1/minimax/v2/query/video_generation/{task_id}</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/minimax)

```typescript
const res = await nunchux.v1.minimax.v2.query.videoGeneration({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

<details>
<summary><code>POST</code> <b><code>nunchux.v1.minimax.v2.videoGeneration</code></b></summary>

<code>POST https://api.nunchux.com/v1/minimax/v2/video_generation</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/minimax)

```typescript
const res = await nunchux.v1.minimax.v2.videoGeneration({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

### openai

<details>
<summary><code>POST</code> <b><code>nunchux.v2.openai.images.edits</code></b></summary>

<code>POST https://api.nunchux.com/v2/openai/images/edits</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/gpt-image)

> **Board setting:** Artificial Analysis ranks GPT Image 2.6 Sunburst and Flare at quality max. Nunchux does not offer OpenAI's `xhigh` or `max` (re-read 2026-11-19, [GPT Image](https://docs.nunchux.ai/partner-models/gpt-image)), so that setting cannot be reproduced. The highest quality on this route is `high`, and `auto` renders at `high`. Both `gpt-image-2.6-sunburst` and `gpt-image-2.6-flare` bill $5 / $8 / $30 per 1M text-input / image-input / image-output tokens ([pricing](https://nunchux.ai/pricing)). Input images, the mask and the markup count as image input. The call is synchronous and returns base64. `images` is required, 1 to 16 `image_url` values, each an https URL or a `data:image` URI. Send `mask` or `markup`, not both. `stream` and `partial_images` are not offered.

```typescript
const res = await nunchux.v2.openai.images.edits({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

<details>
<summary><code>POST</code> <b><code>nunchux.v2.openai.images.generations</code></b></summary>

<code>POST https://api.nunchux.com/v2/openai/images/generations</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.nunchux.ai/partner-models/gpt-image)

> **Board setting:** Artificial Analysis ranks GPT Image 2.6 Sunburst and Flare at quality max. Nunchux does not offer OpenAI's `xhigh` or `max` (re-read 2026-11-19, [GPT Image](https://docs.nunchux.ai/partner-models/gpt-image)), so that setting cannot be reproduced. The highest quality on this route is `high`, and `auto` renders at `high`. `quality` of `xhigh` or `max` is rejected. Both `gpt-image-2.6-sunburst` and `gpt-image-2.6-flare` bill $5 / $8 / $30 per 1M text-input / image-input / image-output tokens ([pricing](https://nunchux.ai/pricing)). The call is synchronous and returns base64. A generation body must not send `images`, `mask`, `markup`, `stream` or `partial_images`.

```typescript
const res = await nunchux.v2.openai.images.generations({ /* ... */ });
```

Source: [`packages/provider/nunchux/src/nunchux.ts`](src/nunchux.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
