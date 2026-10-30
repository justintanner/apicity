# @apicity/fal

[![npm](https://img.shields.io/npm/v/@apicity/fal?color=cb0000)](https://www.npmjs.com/package/@apicity/fal)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fal Platform API provider for model management, pricing, usage, and analytics.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/fal
# or
pnpm add @apicity/fal
```

## Quick Start

```typescript
import { createFal } from "@apicity/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });
```

## Real-world example: upload a portrait, render a Sora 2 video

fal's signature flow is upload-once, reuse-everywhere — drop bytes onto
fal's CDN via a presigned PUT, then thread the resulting
`https://*.fal.media/` URL through any model endpoint. The two-step
snippet below combines
[`tests/integration/fal-storage-upload-initiate.test.ts`](../../../tests/integration/fal-storage-upload-initiate.test.ts)
(POST initiate → PUT bytes) with
[`tests/integration/fal-sora-2-image-to-video.test.ts`](../../../tests/integration/fal-sora-2-image-to-video.test.ts)
(image-to-video generation), so every URL, byte count, and asset id
below comes from real recorded HARs.

```typescript
import { readFile } from "node:fs/promises";
import { createFal } from "@apicity/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });

// 1. Reserve a signed upload slot. `initiate` returns two URLs: a
//    permanent `file_url` you'll feed to downstream models, and a
//    presigned `upload_url` you PUT the bytes to. Both point at the
//    same fal CDN — no third-party hosting needed.
const slot = await fal.storage.upload.initiate({
  file_name: "man.jpg",
  content_type: "image/jpeg",
});
console.log(slot.file_url);
// → "https://v3b.fal.media/files/b/0a96d564/QR9a1l-E0UuoR6zOHUMlX_man.jpg"
//   (the `cat1.jpg` recording shows the same URL shape with a
//    cat1 suffix; the suffix tracks `file_name` you passed in.)

// 2. PUT the bytes to the presigned URL. fal storage is plain HTTP —
//    no SDK call needed, just `fetch` with a matching Content-Type.
//    The signature on `upload_url` expires after a short window;
//    upload promptly. The resulting `file_url` is durable and
//    fetchable by every fal model endpoint.
const bytes = await readFile("./man.jpg");
const put = await fetch(slot.upload_url, {
  method: "PUT",
  headers: { "Content-Type": "image/jpeg" },
  body: bytes,
});
if (!put.ok) throw new Error(`upload failed: ${put.status}`);

// 3. Hand the now-permanent `file_url` to OpenAI's Sora 2 image-to-
//    video model. fal returns a typed bundle: the MP4, a webp
//    thumbnail, and a horizontal spritesheet — all hosted on the
//    same fal CDN. `duration` accepts 4 | 8 | 12 | 16 | 20 (seconds);
//    `aspect_ratio` is "auto" | "9:16" | "16:9".
const result = await fal.run.sora2.imageToVideo({
  prompt: "the man waves at the camera as the wind blows his hair",
  image_url: slot.file_url,
  aspect_ratio: "16:9",
  duration: 4,
});

console.log(result.video.url);
// → "https://v3b.fal.media/files/b/0a96bf3c/8U5wwkg9EC_eK0Jr3XyiR_Vgq1ZZPm.mp4"
console.log(result.video.file_size);
// → 2009236   // ~2 MB MP4 for a 4-second 720p clip
console.log(result.video_id);
// → "video_69e37804033c8191959194ea8aa8fc6e08bf9f3eb453b1b1"
console.log(result.thumbnail?.url);
// → "https://v3b.fal.media/files/b/0a96bf3c/bsgsaBd5IqdwOuufu_qSx_2yOP4u34.webp"
console.log(result.spritesheet?.url);
// → "https://v3b.fal.media/files/b/0a96bf3c/_9tqG1dEuRCEeegOulGrk_pWsHbiNB.bin"
```

**Notes**

- The recorded sora-2 HAR inlines the image as a
  `data:image/jpeg;base64,…` URL — fal accepts both inline data URLs
  and any `https://` URL it can reach. Uploading via fal storage
  first keeps request bodies tiny (350 KB → <1 KB) and lets you reuse
  the asset across multiple model calls without re-encoding.
- The package re-exports a one-call `uploadFile(provider, { data,
  filename, contentType })` helper that wraps the initiate-then-PUT
  dance and returns the `file_url` directly — use it when you don't
  need granular control over the lifecycle or signed URL.
- Every POST endpoint exposes a Zod schema: call
  `fal.run.sora2.imageToVideo.schema.safeParse(input)` to validate a
  payload before paying for inference.
- WAN 2.7 reference-to-video validates generated duration as 2–10
  seconds. `duration: 0` remains limited to source-clip edit-video
  flows where it means keeping the original clip length.
- Long-running calls accept an `AbortSignal` second argument and
  compose with the package's middleware, e.g.
  `withRetry(fal.run.sora2.imageToVideo, { retries: 3 })` from
  `@apicity/fal` to ride out transient queue / 429s.
- Errors throw `FalError` with `status`, `type`, `request_id`, and the
  parsed `body` attached:
  `try { ... } catch (e) { if (e instanceof FalError) console.error(e.status, e.body); }`.

## API Reference

279 endpoints across 56 groups. Each method mirrors an upstream URL path.

### alibaba

<details>
<summary><code>POST</code> <b><code>fal.alibaba.happyHorse.v1p1.imageToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/happy-horse/v1.1/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/happy-horse/v1.1/image-to-video/api)

```typescript
const res = await fal.run.alibaba.happyHorse.v1p1.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.happyHorse.v1p1.referenceToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/happy-horse/v1.1/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/happy-horse/v1.1/reference-to-video/api)

```typescript
const res = await fal.run.alibaba.happyHorse.v1p1.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.happyHorse.v1p1.textToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/happy-horse/v1.1/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/happy-horse/v1.1/text-to-video/api)

```typescript
const res = await fal.run.alibaba.happyHorse.v1p1.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.qwenAudio3Tts</code></b></summary>

<code>POST https://fal.run/alibaba/qwen-audio-3-tts</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/qwen-audio-3-tts/api)

```typescript
const res = await fal.run.alibaba.qwenAudio3Tts({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.qwenImage3.edit</code></b></summary>

<code>POST https://fal.run/alibaba/qwen-image-3/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/qwen-image-3/edit/api)

```typescript
const res = await fal.run.alibaba.qwenImage3.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.qwenImage3.textToImage</code></b></summary>

<code>POST https://fal.run/alibaba/qwen-image-3/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/qwen-image-3/text-to-image/api)

```typescript
const res = await fal.run.alibaba.qwenImage3.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.wan3p0.imageToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/wan-3.0/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/wan-3.0/image-to-video/api)

```typescript
const res = await fal.run.alibaba.wan3p0.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.wan3p0.referenceToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/wan-3.0/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/wan-3.0/reference-to-video/api)

```typescript
const res = await fal.run.alibaba.wan3p0.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.wan3p0.textToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/wan-3.0/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/wan-3.0/text-to-video/api)

```typescript
const res = await fal.run.alibaba.wan3p0.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.wan3p0Prime.imageToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/wan-3.0-prime/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/wan-3.0-prime/image-to-video/api)

```typescript
const res = await fal.run.alibaba.wan3p0Prime.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.wan3p0Prime.referenceToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/wan-3.0-prime/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/wan-3.0-prime/reference-to-video/api)

```typescript
const res = await fal.run.alibaba.wan3p0Prime.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.alibaba.wan3p0Prime.textToVideo</code></b></summary>

<code>POST https://fal.run/alibaba/wan-3.0-prime/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/alibaba/wan-3.0-prime/text-to-video/api)

```typescript
const res = await fal.run.alibaba.wan3p0Prime.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### blackforestlabs

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.draftEnhance</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/draft-enhance</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/draft-enhance/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.draftEnhance({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.editImage</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/edit-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/edit-image/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.editImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.editVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/edit-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/edit-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.editVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.extendVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/extend-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/extend-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.extendVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.extendVideo.draft</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/extend-video/draft</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/extend-video/draft/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.extendVideo.draft({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.firstLastFrameToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/first-last-frame-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/first-last-frame-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.firstLastFrameToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.firstLastFrameToVideo.draft</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/first-last-frame-to-video/draft</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/first-last-frame-to-video/draft/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.firstLastFrameToVideo.draft({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.imageToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/image-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.imageToVideo.draft</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/image-to-video/draft</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/image-to-video/draft/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.imageToVideo.draft({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.keyframesToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/keyframes-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/keyframes-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.keyframesToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.keyframesToVideo.draft</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/keyframes-to-video/draft</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/keyframes-to-video/draft/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.keyframesToVideo.draft({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.base.editImage.lora</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/base/edit-image/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/base/edit-image/lora/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.base.editImage.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.base.textToImage.lora</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/base/text-to-image/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/base/text-to-image/lora/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.base.textToImage.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.base.trainer</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/base/trainer</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/base/trainer/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.base.trainer({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.base.trainer.edit</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/base/trainer/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/base/trainer/edit/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.base.trainer.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.editImage</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/edit-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/edit-image/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.editImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.editImage.lora</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/edit-image/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/edit-image/lora/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.editImage.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.textToImage</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/text-to-image/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.klein.textToImage.lora</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/klein/text-to-image/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/klein/text-to-image/lora/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.klein.textToImage.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.textToImage</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/text-to-image/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.textToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/text-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3.textToVideo.draft</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3/text-to-video/draft</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3/text-to-video/draft/api)

```typescript
const res = await fal.run.blackforestlabs.flux3.textToVideo.draft({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3Max.imageToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3-max/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3-max/image-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3Max.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3Max.keyframesToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3-max/keyframes-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3-max/keyframes-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3Max.keyframesToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.flux3Max.textToVideo</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-3-max/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-3-max/text-to-video/api)

```typescript
const res = await fal.run.blackforestlabs.flux3Max.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.blackforestlabs.fluxVideoUpscale</code></b></summary>

<code>POST https://fal.run/blackforestlabs/flux-video-upscale</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/blackforestlabs/flux-video-upscale/api)

```typescript
const res = await fal.run.blackforestlabs.fluxVideoUpscale({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### bria

<details>
<summary><code>POST</code> <b><code>fal.bria.fibo2.edit</code></b></summary>

<code>POST https://fal.run/bria/fibo-2/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-2/edit/api)

```typescript
const res = await fal.run.bria.fibo2.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.fibo2.generate</code></b></summary>

<code>POST https://fal.run/bria/fibo-2/generate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-2/generate/api)

```typescript
const res = await fal.run.bria.fibo2.generate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.fiboEdit1p5.edit</code></b></summary>

<code>POST https://fal.run/bria/fibo-edit-1.5/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-edit-1.5/edit/api)

```typescript
const res = await fal.run.bria.fiboEdit1p5.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.fiboEdit1p5.expand</code></b></summary>

<code>POST https://fal.run/bria/fibo-edit-1.5/expand</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-edit-1.5/expand/api)

```typescript
const res = await fal.run.bria.fiboEdit1p5.expand({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.fiboEdit1p5.productHolding</code></b></summary>

<code>POST https://fal.run/bria/fibo-edit-1.5/product-holding</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-edit-1.5/product-holding/api)

```typescript
const res = await fal.run.bria.fiboEdit1p5.productHolding({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.fiboEdit1p5.virtualTryOn</code></b></summary>

<code>POST https://fal.run/bria/fibo-edit-1.5/virtual-try-on</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-edit-1.5/virtual-try-on/api)

```typescript
const res = await fal.run.bria.fiboEdit1p5.virtualTryOn({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.fiboGen1p5.textToImage</code></b></summary>

<code>POST https://fal.run/bria/fibo-gen-1.5/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/fibo-gen-1.5/text-to-image/api)

```typescript
const res = await fal.run.bria.fiboGen1p5.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bria.guidedRemoveBackground</code></b></summary>

<code>POST https://fal.run/bria/guided-remove-background</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bria/guided-remove-background/api)

```typescript
const res = await fal.run.bria.guidedRemoveBackground({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### bytedance

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedSpeech.tts.v2</code></b></summary>

<code>POST https://fal.run/fal-ai/bytedance/seed-speech/tts/v2</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/bytedance/seed-speech/tts/v2/api)

```typescript
const res = await fal.run.bytedance.seedSpeech.tts.v2({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.fast.imageToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/fast/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.bytedance.seedance2p0.fast.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.fast.referenceToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/fast/reference-to-video</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await fal.run.bytedance.seedance2p0.fast.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.fast.textToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/fast/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.bytedance.seedance2p0.fast.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.imageToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.bytedance.seedance2p0.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.referenceToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/reference-to-video</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await fal.run.bytedance.seedance2p0.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.textToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.bytedance.seedance2p0.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.us.imageToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/us/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.0/us/image-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p0.us.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.us.referenceToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/us/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.0/us/reference-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p0.us.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p0.us.textToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.0/us/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.0/us/text-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p0.us.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.draft.complete</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/draft/complete</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/draft/complete/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.draft.complete({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.imageToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/image-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.referenceToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.textToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/text-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.us.imageToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/us/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/us/image-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.us.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.us.referenceToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/us/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/us/reference-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.us.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedance2p5.us.textToVideo</code></b></summary>

<code>POST https://fal.run/bytedance/seedance-2.5/us/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedance-2.5/us/text-to-video/api)

```typescript
const res = await fal.run.bytedance.seedance2p5.us.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.flash.edit</code></b></summary>

<code>POST https://fal.run/bytedance/seedream/v5/flash/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedream/v5/flash/edit/api)

```typescript
const res = await fal.run.bytedance.seedream.v5.flash.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.flash.layerize</code></b></summary>

<code>POST https://fal.run/bytedance/seedream/v5/flash/layerize</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedream/v5/flash/layerize/api)

```typescript
const res = await fal.run.bytedance.seedream.v5.flash.layerize({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.flash.textToImage</code></b></summary>

<code>POST https://fal.run/bytedance/seedream/v5/flash/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedream/v5/flash/text-to-image/api)

```typescript
const res = await fal.run.bytedance.seedream.v5.flash.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.lite.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/bytedance/seedream/v5/lite/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.bytedance.seedream.v5.lite.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.lite.textToImage</code></b></summary>

<code>POST https://fal.run/fal-ai/bytedance/seedream/v5/lite/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.bytedance.seedream.v5.lite.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.pro.edit</code></b></summary>

<code>POST https://fal.run/bytedance/seedream/v5/pro/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedream/v5/pro/edit/api)

```typescript
const res = await fal.run.bytedance.seedream.v5.pro.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.pro.layerize</code></b></summary>

<code>POST https://fal.run/bytedance/seedream/v5/pro/layerize</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedream/v5/pro/layerize/api)

```typescript
const res = await fal.run.bytedance.seedream.v5.pro.layerize({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.bytedance.seedream.v5.pro.textToImage</code></b></summary>

<code>POST https://fal.run/bytedance/seedream/v5/pro/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/bytedance/seedream/v5/pro/text-to-image/api)

```typescript
const res = await fal.run.bytedance.seedream.v5.pro.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### creatify

<details>
<summary><code>POST</code> <b><code>fal.creatify.boreal</code></b></summary>

<code>POST https://fal.run/creatify/boreal</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/creatify/boreal/api)

```typescript
const res = await fal.run.creatify.boreal({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### elevenlabs

<details>
<summary><code>POST</code> <b><code>fal.elevenlabs.music.v2p5</code></b></summary>

<code>POST https://fal.run/elevenlabs/music/v2.5</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/elevenlabs/music/v2.5/api)

```typescript
const res = await fal.run.elevenlabs.music.v2p5({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.elevenlabs.tts.elevenV4</code></b></summary>

<code>POST https://fal.run/elevenlabs/tts/eleven-v4</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/elevenlabs/tts/eleven-v4/api)

```typescript
const res = await fal.run.elevenlabs.tts.elevenV4({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.elevenlabs.tts.elevenV4Turbo</code></b></summary>

<code>POST https://fal.run/elevenlabs/tts/eleven-v4-turbo</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/elevenlabs/tts/eleven-v4-turbo/api)

```typescript
const res = await fal.run.elevenlabs.tts.elevenV4Turbo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### falAi

<details>
<summary><code>POST</code> <b><code>fal.falAi.elevenlabs.speechToText.scribeV2</code></b></summary>

<code>POST https://fal.run/fal-ai/elevenlabs/speech-to-text/scribe-v2</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.falAi.elevenlabs.speechToText.scribeV2({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### flux2Flex

<details>
<summary><code>POST</code> <b><code>fal.flux2Flex</code></b></summary>

<code>POST https://fal.run/fal-ai/flux-2-flex</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/flux-2-flex/api)

```typescript
const res = await fal.run.flux2Flex({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### flux3Action

<details>
<summary><code>POST</code> <b><code>fal.flux3Action.so101</code></b></summary>

<code>POST https://fal.run/fal-ai/flux-3-action/so101</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/flux-3-action/so101/api)

```typescript
const res = await fal.run.flux3Action.so101({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### geminiOmniFlash

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/api)

```typescript
const res = await fal.run.geminiOmniFlash({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.edit</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/edit/api)

```typescript
const res = await fal.run.geminiOmniFlash.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.imageToVideo</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/image-to-video/api)

```typescript
const res = await fal.run.geminiOmniFlash.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.referenceToVideo</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/reference-to-video/api)

```typescript
const res = await fal.run.geminiOmniFlash.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.v1p1.edit</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/v1.1/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/v1.1/edit/api)

```typescript
const res = await fal.run.geminiOmniFlash.v1p1.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.v1p1.imageToVideo</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/v1.1/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/v1.1/image-to-video/api)

```typescript
const res = await fal.run.geminiOmniFlash.v1p1.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.v1p1.referenceToVideo</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/v1.1/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/v1.1/reference-to-video/api)

```typescript
const res = await fal.run.geminiOmniFlash.v1p1.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.geminiOmniFlash.v1p1.textToVideo</code></b></summary>

<code>POST https://fal.run/google/gemini-omni-flash/v1.1/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-omni-flash/v1.1/text-to-video/api)

```typescript
const res = await fal.run.geminiOmniFlash.v1p1.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### google

<details>
<summary><code>POST</code> <b><code>fal.google.gemini3p8FlashLiteTts</code></b></summary>

<code>POST https://fal.run/google/gemini-3.8-flash-lite-tts</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-3.8-flash-lite-tts/api)

```typescript
const res = await fal.run.google.gemini3p8FlashLiteTts({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.google.gemini3p8FlashTts</code></b></summary>

<code>POST https://fal.run/google/gemini-3.8-flash-tts</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/gemini-3.8-flash-tts/api)

```typescript
const res = await fal.run.google.gemini3p8FlashTts({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.google.lyria3p5</code></b></summary>

<code>POST https://fal.run/google/lyria-3.5</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/lyria-3.5/api)

```typescript
const res = await fal.run.google.lyria3p5({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### gptImage1p5

<details>
<summary><code>POST</code> <b><code>fal.gptImage1p5</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/gpt-image-1.5</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.gptImage1p5({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.gptImage1p5.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/gpt-image-1.5/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.gptImage1p5.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### heygen

<details>
<summary><code>POST</code> <b><code>fal.heygen.avatar3.digitalTwin</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/avatar3/digital-twin</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/avatar3/digital-twin/api)

```typescript
const res = await fal.run.heygen.avatar3.digitalTwin({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.avatar4.digitalTwin</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/avatar4/digital-twin</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/avatar4/digital-twin/api)

```typescript
const res = await fal.run.heygen.avatar4.digitalTwin({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.avatar4.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/avatar4/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/avatar4/image-to-video/api)

```typescript
const res = await fal.run.heygen.avatar4.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.avatar5.digitalTwin</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/avatar5/digital-twin</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/avatar5/digital-twin/api)

```typescript
const res = await fal.run.heygen.avatar5.digitalTwin({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.heygenVideo.imageToVideo</code></b></summary>

<code>POST https://fal.run/heygen/heygen-video/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/heygen/heygen-video/image-to-video/api)

```typescript
const res = await fal.run.heygen.heygenVideo.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.heygenVideo.referenceToVideo</code></b></summary>

<code>POST https://fal.run/heygen/heygen-video/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/heygen/heygen-video/reference-to-video/api)

```typescript
const res = await fal.run.heygen.heygenVideo.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.heygenVideo.textToVideo</code></b></summary>

<code>POST https://fal.run/heygen/heygen-video/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/heygen/heygen-video/text-to-video/api)

```typescript
const res = await fal.run.heygen.heygenVideo.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.heygenVoice</code></b></summary>

<code>POST https://fal.run/heygen/heygen-voice</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/heygen/heygen-voice/api)

```typescript
const res = await fal.run.heygen.heygenVoice({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.heygenVoice.turbo</code></b></summary>

<code>POST https://fal.run/heygen/heygen-voice/turbo</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/heygen/heygen-voice/turbo/api)

```typescript
const res = await fal.run.heygen.heygenVoice.turbo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v2.translate.precision</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v2/translate/precision</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v2/translate/precision/api)

```typescript
const res = await fal.run.heygen.v2.translate.precision({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v2.translate.speed</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v2/translate/speed</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v2/translate/speed/api)

```typescript
const res = await fal.run.heygen.v2.translate.speed({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v2.videoAgent</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v2/video-agent</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v2/video-agent/api)

```typescript
const res = await fal.run.heygen.v2.videoAgent({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v3.fillerWordRemoval</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v3/filler-word-removal</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v3/filler-word-removal/api)

```typescript
const res = await fal.run.heygen.v3.fillerWordRemoval({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v3.lipsync.precision</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v3/lipsync/precision</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v3/lipsync/precision/api)

```typescript
const res = await fal.run.heygen.v3.lipsync.precision({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v3.lipsync.speed</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v3/lipsync/speed</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v3/lipsync/speed/api)

```typescript
const res = await fal.run.heygen.v3.lipsync.speed({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.heygen.v3.videoAgent</code></b></summary>

<code>POST https://fal.run/fal-ai/heygen/v3/video-agent</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/heygen/v3/video-agent/api)

```typescript
const res = await fal.run.heygen.v3.videoAgent({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### hunyuan

<details>
<summary><code>POST</code> <b><code>fal.hunyuan.v3.instructEdit</code></b></summary>

<code>POST https://fal.run/fal-ai/hunyuan-image/v3/instruct/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.hunyuan.v3.instructEdit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### ideogram

<details>
<summary><code>POST</code> <b><code>fal.ideogram.v4p5</code></b></summary>

<code>POST https://fal.run/ideogram/v4.5</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/ideogram/v4.5/api)

```typescript
const res = await fal.run.ideogram.v4p5({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.ideogram.v4p5.edit</code></b></summary>

<code>POST https://fal.run/ideogram/v4.5/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/ideogram/v4.5/edit/api)

```typescript
const res = await fal.run.ideogram.v4p5.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.ideogram.vector.imageToVector</code></b></summary>

<code>POST https://fal.run/ideogram/vector/image-to-vector</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/ideogram/vector/image-to-vector/api)

```typescript
const res = await fal.run.ideogram.vector.imageToVector({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.ideogram.vector.textToVector</code></b></summary>

<code>POST https://fal.run/ideogram/vector/text-to-vector</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/ideogram/vector/text-to-vector/api)

```typescript
const res = await fal.run.ideogram.vector.textToVector({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### kandinsky6Lite

<details>
<summary><code>POST</code> <b><code>fal.kandinsky6Lite.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kandinsky6-lite/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kandinsky6-lite/image-to-video/api)

```typescript
const res = await fal.run.kandinsky6Lite.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.kandinsky6Lite.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kandinsky6-lite/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kandinsky6-lite/text-to-video/api)

```typescript
const res = await fal.run.kandinsky6Lite.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### kandinsky6Pro

<details>
<summary><code>POST</code> <b><code>fal.kandinsky6Pro.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kandinsky6-pro/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kandinsky6-pro/image-to-video/api)

```typescript
const res = await fal.run.kandinsky6Pro.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.kandinsky6Pro.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kandinsky6-pro/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kandinsky6-pro/text-to-video/api)

```typescript
const res = await fal.run.kandinsky6Pro.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### kandinsky6Vsr

<details>
<summary><code>POST</code> <b><code>fal.kandinsky6Vsr</code></b></summary>

<code>POST https://fal.run/fal-ai/kandinsky6-vsr</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kandinsky6-vsr/api)

```typescript
const res = await fal.run.kandinsky6Vsr({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.kandinsky6Vsr.lite</code></b></summary>

<code>POST https://fal.run/fal-ai/kandinsky6-vsr/lite</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kandinsky6-vsr/lite/api)

```typescript
const res = await fal.run.kandinsky6Vsr.lite({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### kling

<details>
<summary><code>POST</code> <b><code>fal.kling.v4.imageToVideo</code></b></summary>

<code>POST https://fal.run/kling/v4/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/kling/v4/image-to-video/api)

```typescript
const res = await fal.run.kling.v4.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.kling.v4.referenceToVideo</code></b></summary>

<code>POST https://fal.run/kling/v4/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/kling/v4/reference-to-video/api)

```typescript
const res = await fal.run.kling.v4.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.kling.v4.textToVideo</code></b></summary>

<code>POST https://fal.run/kling/v4/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/kling/v4/text-to-video/api)

```typescript
const res = await fal.run.kling.v4.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.kling.v4.videoToVideo.edit</code></b></summary>

<code>POST https://fal.run/kling/v4/video-to-video/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/kling/v4/video-to-video/edit/api)

```typescript
const res = await fal.run.kling.v4.videoToVideo.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### klingVideo

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3.pro.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/pro/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/o3/pro/image-to-video/api)

```typescript
const res = await fal.run.klingVideo.o3.pro.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3.pro.referenceToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/pro/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/o3/pro/reference-to-video/api)

```typescript
const res = await fal.run.klingVideo.o3.pro.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3.pro.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/pro/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/o3/pro/text-to-video/api)

```typescript
const res = await fal.run.klingVideo.o3.pro.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3.pro.videoToVideo.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/pro/video-to-video/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/edit/api)

```typescript
const res = await fal.run.klingVideo.o3.pro.videoToVideo.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3.pro.videoToVideo.reference</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/pro/video-to-video/reference</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/reference/api)

```typescript
const res = await fal.run.klingVideo.o3.pro.videoToVideo.reference({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3.standard.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/standard/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video/api)

```typescript
const res = await fal.run.klingVideo.o3.standard.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3p4k.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/4k/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.o3p4k.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3p4k.referenceToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/4k/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.o3p4k.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.o3p4k.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/o3/4k/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.o3p4k.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.pro.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/pro/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.v3.pro.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.pro.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/pro/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.v3.pro.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.standard.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/standard/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.v3.standard.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.standard.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/standard/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.klingVideo.v3.standard.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.turbo.pro.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/turbo/pro/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/v3/turbo/pro/image-to-video/api)

```typescript
const res = await fal.run.klingVideo.v3.turbo.pro.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.turbo.pro.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/turbo/pro/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/v3/turbo/pro/text-to-video/api)

```typescript
const res = await fal.run.klingVideo.v3.turbo.pro.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.turbo.standard.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/turbo/standard/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/v3/turbo/standard/image-to-video/api)

```typescript
const res = await fal.run.klingVideo.v3.turbo.standard.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.klingVideo.v3.turbo.standard.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/kling-video/v3/turbo/standard/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/kling-video/v3/turbo/standard/text-to-video/api)

```typescript
const res = await fal.run.klingVideo.v3.turbo.standard.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### krea

<details>
<summary><code>POST</code> <b><code>fal.krea.v3.edit</code></b></summary>

<code>POST https://fal.run/krea/v3/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/krea/v3/edit/api)

```typescript
const res = await fal.run.krea.v3.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.krea.v3.textToImage</code></b></summary>

<code>POST https://fal.run/krea/v3/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/krea/v3/text-to-image/api)

```typescript
const res = await fal.run.krea.v3.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### lightricks

<details>
<summary><code>POST</code> <b><code>fal.lightricks.ltx2p5.audioToVideo.fast</code></b></summary>

<code>POST https://fal.run/lightricks/ltx-2.5/audio-to-video/fast</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/lightricks/ltx-2.5/audio-to-video/fast/api)

```typescript
const res = await fal.run.lightricks.ltx2p5.audioToVideo.fast({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.lightricks.ltx2p5.audioToVideo.pro</code></b></summary>

<code>POST https://fal.run/lightricks/ltx-2.5/audio-to-video/pro</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/lightricks/ltx-2.5/audio-to-video/pro/api)

```typescript
const res = await fal.run.lightricks.ltx2p5.audioToVideo.pro({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.lightricks.ltx2p5.imageToVideo.fast</code></b></summary>

<code>POST https://fal.run/lightricks/ltx-2.5/image-to-video/fast</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/lightricks/ltx-2.5/image-to-video/fast/api)

```typescript
const res = await fal.run.lightricks.ltx2p5.imageToVideo.fast({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.lightricks.ltx2p5.imageToVideo.pro</code></b></summary>

<code>POST https://fal.run/lightricks/ltx-2.5/image-to-video/pro</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/lightricks/ltx-2.5/image-to-video/pro/api)

```typescript
const res = await fal.run.lightricks.ltx2p5.imageToVideo.pro({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.lightricks.ltx2p5.textToVideo.fast</code></b></summary>

<code>POST https://fal.run/lightricks/ltx-2.5/text-to-video/fast</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/lightricks/ltx-2.5/text-to-video/fast/api)

```typescript
const res = await fal.run.lightricks.ltx2p5.textToVideo.fast({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.lightricks.ltx2p5.textToVideo.pro</code></b></summary>

<code>POST https://fal.run/lightricks/ltx-2.5/text-to-video/pro</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/lightricks/ltx-2.5/text-to-video/pro/api)

```typescript
const res = await fal.run.lightricks.ltx2p5.textToVideo.pro({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### luma

<details>
<summary><code>POST</code> <b><code>fal.luma.agent.ray.v3p2.imageToVideo</code></b></summary>

<code>POST https://fal.run/luma/agent/ray/v3.2/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/luma/agent/ray/v3.2/image-to-video/api)

```typescript
const res = await fal.run.luma.agent.ray.v3p2.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.luma.agent.ray.v3p2.reframe</code></b></summary>

<code>POST https://fal.run/luma/agent/ray/v3.2/reframe</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/luma/agent/ray/v3.2/reframe/api)

```typescript
const res = await fal.run.luma.agent.ray.v3p2.reframe({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.luma.agent.ray.v3p2.textToVideo</code></b></summary>

<code>POST https://fal.run/luma/agent/ray/v3.2/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/luma/agent/ray/v3.2/text-to-video/api)

```typescript
const res = await fal.run.luma.agent.ray.v3p2.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.luma.agent.ray.v3p2.videoToVideo</code></b></summary>

<code>POST https://fal.run/luma/agent/ray/v3.2/video-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/luma/agent/ray/v3.2/video-to-video/api)

```typescript
const res = await fal.run.luma.agent.ray.v3p2.videoToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### marigoldV2

<details>
<summary><code>POST</code> <b><code>fal.marigoldV2</code></b></summary>

<code>POST https://fal.run/fal-ai/marigold-v2</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/marigold-v2/api)

```typescript
const res = await fal.run.marigoldV2({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### meshy

<details>
<summary><code>POST</code> <b><code>fal.meshy.v6Lite.retexture</code></b></summary>

<code>POST https://fal.run/meshy/v6-lite/retexture</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meshy/v6-lite/retexture/api)

```typescript
const res = await fal.run.meshy.v6Lite.retexture({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.meshy.v7.imageTo3d</code></b></summary>

<code>POST https://fal.run/meshy/v7/image-to-3d</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meshy/v7/image-to-3d/api)

```typescript
const res = await fal.run.meshy.v7.imageTo3d({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.meshy.v7p1.imageTo3d</code></b></summary>

<code>POST https://fal.run/meshy/v7.1/image-to-3d</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meshy/v7.1/image-to-3d/api)

```typescript
const res = await fal.run.meshy.v7p1.imageTo3d({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.meshy.v7p1.multiImageTo3d</code></b></summary>

<code>POST https://fal.run/meshy/v7.1/multi-image-to-3d</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meshy/v7.1/multi-image-to-3d/api)

```typescript
const res = await fal.run.meshy.v7p1.multiImageTo3d({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.meshy.v7p1.textTo3d</code></b></summary>

<code>POST https://fal.run/meshy/v7.1/text-to-3d</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meshy/v7.1/text-to-3d/api)

```typescript
const res = await fal.run.meshy.v7p1.textTo3d({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### meta

<details>
<summary><code>POST</code> <b><code>fal.meta.museImage.edit</code></b></summary>

<code>POST https://fal.run/meta/muse-image/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meta/muse-image/edit/api)

```typescript
const res = await fal.run.meta.museImage.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.meta.museImage.textToImage</code></b></summary>

<code>POST https://fal.run/meta/muse-image/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/meta/muse-image/text-to-image/api)

```typescript
const res = await fal.run.meta.museImage.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### microsoft

<details>
<summary><code>POST</code> <b><code>fal.microsoft.maiImage2p5Pro</code></b></summary>

<code>POST https://fal.run/microsoft/mai-image-2.5-pro</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/microsoft/mai-image-2.5-pro/api)

```typescript
const res = await fal.run.microsoft.maiImage2p5Pro({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.microsoft.maiImage2p5Pro.edit</code></b></summary>

<code>POST https://fal.run/microsoft/mai-image-2.5-pro/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/microsoft/mai-image-2.5-pro/edit/api)

```typescript
const res = await fal.run.microsoft.maiImage2p5Pro.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### minimax

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.flf2v.trainer</code></b></summary>

<code>POST https://fal.run/minimax/h3/flf2v/trainer</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/flf2v/trainer/api)

```typescript
const res = await fal.run.minimax.h3.flf2v.trainer({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.i2v.trainer</code></b></summary>

<code>POST https://fal.run/minimax/h3/i2v/trainer</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/i2v/trainer/api)

```typescript
const res = await fal.run.minimax.h3.i2v.trainer({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.imageToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/image-to-video/api)

```typescript
const res = await fal.run.minimax.h3.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.imageToVideo.lora</code></b></summary>

<code>POST https://fal.run/minimax/h3/image-to-video/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/image-to-video/lora/api)

```typescript
const res = await fal.run.minimax.h3.imageToVideo.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.ref2va.trainer</code></b></summary>

<code>POST https://fal.run/minimax/h3/ref2va/trainer</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/ref2va/trainer/api)

```typescript
const res = await fal.run.minimax.h3.ref2va.trainer({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.referenceToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/reference-to-video/api)

```typescript
const res = await fal.run.minimax.h3.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.referenceToVideo.lora</code></b></summary>

<code>POST https://fal.run/minimax/h3/reference-to-video/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/reference-to-video/lora/api)

```typescript
const res = await fal.run.minimax.h3.referenceToVideo.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.t2v.trainer</code></b></summary>

<code>POST https://fal.run/minimax/h3/t2v/trainer</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/t2v/trainer/api)

```typescript
const res = await fal.run.minimax.h3.t2v.trainer({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.textToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/text-to-video/api)

```typescript
const res = await fal.run.minimax.h3.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3.textToVideo.lora</code></b></summary>

<code>POST https://fal.run/minimax/h3/text-to-video/lora</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3/text-to-video/lora/api)

```typescript
const res = await fal.run.minimax.h3.textToVideo.lora({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.cameraControls</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/camera-controls</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/camera-controls/api)

```typescript
const res = await fal.run.minimax.h3Max.cameraControls({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.extendVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/extend-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/extend-video/api)

```typescript
const res = await fal.run.minimax.h3Max.extendVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.imageToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/image-to-video/api)

```typescript
const res = await fal.run.minimax.h3Max.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.insertVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/insert-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/insert-video/api)

```typescript
const res = await fal.run.minimax.h3Max.insertVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.lipSync.imageToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/lip-sync/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/lip-sync/image-to-video/api)

```typescript
const res = await fal.run.minimax.h3Max.lipSync.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.recast</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/recast</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/recast/api)

```typescript
const res = await fal.run.minimax.h3Max.recast({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.referenceToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/reference-to-video/api)

```typescript
const res = await fal.run.minimax.h3Max.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.reframeVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/reframe-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/reframe-video/api)

```typescript
const res = await fal.run.minimax.h3Max.reframeVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.relight</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/relight</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/relight/api)

```typescript
const res = await fal.run.minimax.h3Max.relight({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.styles.handDrawn</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/styles/hand-drawn</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/styles/hand-drawn/api)

```typescript
const res = await fal.run.minimax.h3Max.styles.handDrawn({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.styles.lowPoly</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/styles/low-poly</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/styles/low-poly/api)

```typescript
const res = await fal.run.minimax.h3Max.styles.lowPoly({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.styles.retroToon70s</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/styles/retro-toon-70s</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/styles/retro-toon-70s/api)

```typescript
const res = await fal.run.minimax.h3Max.styles.retroToon70s({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.styles.sixteenBitPixel</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/styles/16bit-pixel</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/styles/16bit-pixel/api)

```typescript
const res = await fal.run.minimax.h3Max.styles.sixteenBitPixel({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.styles.vhs</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/styles/vhs</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/styles/vhs/api)

```typescript
const res = await fal.run.minimax.h3Max.styles.vhs({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.textToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/text-to-video/api)

```typescript
const res = await fal.run.minimax.h3Max.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3Max.threeDToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max/3d-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max/3d-to-video/api)

```typescript
const res = await fal.run.minimax.h3Max.threeDToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3MaxTurbo.extendVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max-turbo/extend-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max-turbo/extend-video/api)

```typescript
const res = await fal.run.minimax.h3MaxTurbo.extendVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3MaxTurbo.imageToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max-turbo/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max-turbo/image-to-video/api)

```typescript
const res = await fal.run.minimax.h3MaxTurbo.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.h3MaxTurbo.textToVideo</code></b></summary>

<code>POST https://fal.run/minimax/h3-max-turbo/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/h3-max-turbo/text-to-video/api)

```typescript
const res = await fal.run.minimax.h3MaxTurbo.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.minimax.music3</code></b></summary>

<code>POST https://fal.run/minimax/music-3</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/minimax/music-3/api)

```typescript
const res = await fal.run.minimax.music3({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### mireloAi

<details>
<summary><code>POST</code> <b><code>fal.mireloAi.sfx2p0.textToAudio</code></b></summary>

<code>POST https://fal.run/mirelo-ai/sfx2.0/text-to-audio</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mirelo-ai/sfx2.0/text-to-audio/api)

```typescript
const res = await fal.run.mireloAi.sfx2p0.textToAudio({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.mireloAi.sfx2p0.videoToAudio</code></b></summary>

<code>POST https://fal.run/mirelo-ai/sfx2.0/video-to-audio</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mirelo-ai/sfx2.0/video-to-audio/api)

```typescript
const res = await fal.run.mireloAi.sfx2p0.videoToAudio({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.mireloAi.sfx2p0.videoToVideo</code></b></summary>

<code>POST https://fal.run/mirelo-ai/sfx2.0/video-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mirelo-ai/sfx2.0/video-to-video/api)

```typescript
const res = await fal.run.mireloAi.sfx2p0.videoToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>fal.v1.models.requests.payloads</code></b></summary>

<code>GET https://api.fal.ai/v1/models/requests/{param}/payloads</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.get.v1.models.requests.payloads({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models</code></b></summary>

<code>GET https://api.fal.ai/v1/models</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.analytics</code></b></summary>

<code>GET https://api.fal.ai/v1/models/analytics</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.analytics({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.pricing</code></b></summary>

<code>GET https://api.fal.ai/v1/models/pricing</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.models.pricing.estimate</code></b></summary>

<code>POST https://api.fal.ai/v1/models/pricing/estimate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.pricing.estimate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.requests.byEndpoint</code></b></summary>

<code>GET https://api.fal.ai/v1/models/requests/by-endpoint</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.requests.byEndpoint({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fal.v1.models.requests.payloads</code></b></summary>

<code>DELETE https://api.fal.ai/v1/models/requests/{param}/payloads</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.requests.payloads({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.models.usage</code></b></summary>

<code>GET https://api.fal.ai/v1/models/usage</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.models.usage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### mureka

<details>
<summary><code>POST</code> <b><code>fal.mureka.api.generate.instrumental</code></b></summary>

<code>POST https://fal.run/mureka/api/generate/instrumental</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mureka/api/generate/instrumental/api)

```typescript
const res = await fal.run.mureka.api.generate.instrumental({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.mureka.api.generate.lyrics</code></b></summary>

<code>POST https://fal.run/mureka/api/generate/lyrics</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mureka/api/generate/lyrics/api)

```typescript
const res = await fal.run.mureka.api.generate.lyrics({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.mureka.api.generate.podcast</code></b></summary>

<code>POST https://fal.run/mureka/api/generate/podcast</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mureka/api/generate/podcast/api)

```typescript
const res = await fal.run.mureka.api.generate.podcast({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.mureka.api.generate.song</code></b></summary>

<code>POST https://fal.run/mureka/api/generate/song</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/mureka/api/generate/song/api)

```typescript
const res = await fal.run.mureka.api.generate.song({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBanana

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/nano-banana/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.nanoBanana.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana.textToImage</code></b></summary>

<code>POST https://fal.run/fal-ai/nano-banana</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.nanoBanana.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBanana2

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/nano-banana-2/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.nanoBanana2.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2.textToImage</code></b></summary>

<code>POST https://fal.run/fal-ai/nano-banana-2</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.nanoBanana2.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBanana2Lite

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2Lite.edit</code></b></summary>

<code>POST https://fal.run/google/nano-banana-lite/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/nano-banana-lite/edit/api)

```typescript
const res = await fal.run.nanoBanana2Lite.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2Lite.textToImage</code></b></summary>

<code>POST https://fal.run/google/nano-banana-2-lite</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/nano-banana-2-lite/api)

```typescript
const res = await fal.run.nanoBanana2Lite.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBanana2p1

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2p1.edit</code></b></summary>

<code>POST https://fal.run/google/nano-banana-2.1/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/nano-banana-2.1/edit/api)

```typescript
const res = await fal.run.nanoBanana2p1.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBanana2p1.textToImage</code></b></summary>

<code>POST https://fal.run/google/nano-banana-2.1</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/nano-banana-2.1/api)

```typescript
const res = await fal.run.nanoBanana2p1.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nanoBananaPro

<details>
<summary><code>POST</code> <b><code>fal.nanoBananaPro.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/nano-banana-pro/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.nanoBananaPro.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nanoBananaPro.textToImage</code></b></summary>

<code>POST https://fal.run/fal-ai/nano-banana-pro</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.nanoBananaPro.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### nvidia

<details>
<summary><code>POST</code> <b><code>fal.nvidia.cosmos3Super.imageToVideo</code></b></summary>

<code>POST https://fal.run/nvidia/cosmos-3-super/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/nvidia/cosmos-3-super/image-to-video/api)

```typescript
const res = await fal.run.nvidia.cosmos3Super.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.nvidia.cosmos3Super.textToImage</code></b></summary>

<code>POST https://fal.run/nvidia/cosmos-3-super/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/nvidia/cosmos-3-super/text-to-image/api)

```typescript
const res = await fal.run.nvidia.cosmos3Super.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### openai

<details>
<summary><code>POST</code> <b><code>fal.openai.gptImage2</code></b></summary>

<code>POST https://fal.run/openai/gpt-image-2</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openai/gpt-image-2/api)

```typescript
const res = await fal.run.openai.gptImage2({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.openai.gptImage2.edit</code></b></summary>

<code>POST https://fal.run/openai/gpt-image-2/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openai/gpt-image-2/edit/api)

```typescript
const res = await fal.run.openai.gptImage2.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.openai.gptImage2p5.flare.edit</code></b></summary>

<code>POST https://fal.run/openai/gpt-image-2.5/flare/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openai/gpt-image-2.5/flare/edit/api)

```typescript
const res = await fal.run.openai.gptImage2p5.flare.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.openai.gptImage2p5.flare.textToImage</code></b></summary>

<code>POST https://fal.run/openai/gpt-image-2.5/flare/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openai/gpt-image-2.5/flare/text-to-image/api)

```typescript
const res = await fal.run.openai.gptImage2p5.flare.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.openai.gptImage2p5.sunburst.edit</code></b></summary>

<code>POST https://fal.run/openai/gpt-image-2.5/sunburst/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openai/gpt-image-2.5/sunburst/edit/api)

```typescript
const res = await fal.run.openai.gptImage2p5.sunburst.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.openai.gptImage2p5.sunburst.textToImage</code></b></summary>

<code>POST https://fal.run/openai/gpt-image-2.5/sunburst/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openai/gpt-image-2.5/sunburst/text-to-image/api)

```typescript
const res = await fal.run.openai.gptImage2p5.sunburst.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### openrouter

<details>
<summary><code>POST</code> <b><code>fal.openrouter.router.decisions</code></b></summary>

<code>POST https://fal.run/openrouter/router/decisions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/openrouter/router/decisions/api)

```typescript
const res = await fal.run.openrouter.router.decisions({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### pixelcut

<details>
<summary><code>POST</code> <b><code>fal.pixelcut.loopingVideo</code></b></summary>

<code>POST https://fal.run/pixelcut/looping-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/pixelcut/looping-video/api)

```typescript
const res = await fal.run.pixelcut.loopingVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### pixverse

<details>
<summary><code>POST</code> <b><code>fal.pixverse.musicVideo.vibemv</code></b></summary>

<code>POST https://fal.run/pixverse/music-video/vibemv</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/pixverse/music-video/vibemv/api)

```typescript
const res = await fal.run.pixverse.musicVideo.vibemv({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### queue

<details>
<summary><code>GET</code> <b><code>fal.v1.queue.result</code></b></summary>

<code>GET https://queue.fal.run/{endpoint_id}/requests/{request_id}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/inference-api/queue/result)

```typescript
const res = await fal.v1.queue.result({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.queue.status</code></b></summary>

<code>GET https://queue.fal.run/{endpoint_id}/requests/{request_id}/status</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/inference-api/queue/status)

```typescript
const res = await fal.v1.queue.status({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.queue.submit</code></b></summary>

<code>POST https://queue.fal.run/{endpoint_id}{query}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/inference-api/queue/submit)

```typescript
const res = await fal.v1.queue.submit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### qwenImage

<details>
<summary><code>POST</code> <b><code>fal.qwenImage</code></b></summary>

<code>POST https://api.fal.ai/v1/fal-ai/qwen-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.qwenImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.qwenImage.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/qwen-image-edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.qwenImage.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### recraft

<details>
<summary><code>POST</code> <b><code>fal.recraft.v4p1.flash.textToImage</code></b></summary>

<code>POST https://fal.run/recraft/v4.1/flash/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/recraft/v4.1/flash/text-to-image/api)

```typescript
const res = await fal.run.recraft.v4p1.flash.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### serverless

<details>
<summary><code>POST</code> <b><code>fal.post.stream.v1.serverless.logs.stream</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/logs/stream</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.post.stream.v1.serverless.logs.stream({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.serverless.apps.queue</code></b></summary>

<code>GET https://api.fal.ai/v1/serverless/apps/{owner}/{name}/queue</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/platform-apis/v1/serverless/apps/queue)

```typescript
const res = await fal.v1.serverless.apps.queue({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.serverless.files.list</code></b></summary>

<code>GET https://api.fal.ai/v1/serverless/files/list</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/platform-apis/v1/serverless/files/list)

```typescript
const res = await fal.v1.serverless.files.list({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.files.uploadLocal</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/files/file/local/{param}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.files.uploadLocal({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.files.uploadUrl</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/files/file/url/{param}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.files.uploadUrl({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.v1.serverless.logs</code></b></summary>

<code>POST https://api.fal.ai/v1/serverless/logs/stream</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.serverless.logs.stream({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.serverless.metrics</code></b></summary>

<code>GET https://api.fal.ai/v1/serverless/metrics</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/platform-apis/v1/serverless/metrics)

```typescript
const res = await fal.v1.serverless.metrics();
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### sora2

<details>
<summary><code>POST</code> <b><code>fal.sora2.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/sora-2/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.sora2.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.sora2.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/sora-2/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.sora2.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### storage

<details>
<summary><code>POST</code> <b><code>fal.storage.upload.completeMultipart</code></b></summary>

<code>POST https://rest.fal.ai/storage/upload/complete-multipart</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.storage.upload.completeMultipart({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.storage.upload.initiate</code></b></summary>

<code>POST https://rest.fal.ai/storage/upload/initiate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.storage.upload.initiate({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.storage.upload.initiateMultipart</code></b></summary>

<code>POST https://rest.fal.ai/storage/upload/initiate-multipart</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.storage.upload.initiateMultipart({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### topaz

<details>
<summary><code>POST</code> <b><code>fal.topaz.upscale.image.precision</code></b></summary>

<code>POST https://fal.run/topaz/upscale/image/precision</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/topaz/upscale/image/precision/api)

```typescript
const res = await fal.run.topaz.upscale.image.precision({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.topaz.upscale.video.precision</code></b></summary>

<code>POST https://fal.run/topaz/upscale/video/precision</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/topaz/upscale/video/precision/api)

```typescript
const res = await fal.run.topaz.upscale.video.precision({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### tripo3d

<details>
<summary><code>POST</code> <b><code>fal.tripo3d.p2.imageTo3d</code></b></summary>

<code>POST https://fal.run/tripo3d/p2/image-to-3d</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/tripo3d/p2/image-to-3d/api)

```typescript
const res = await fal.run.tripo3d.p2.imageTo3d({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.tripo3d.p2.textTo3d</code></b></summary>

<code>POST https://fal.run/tripo3d/p2/text-to-3d</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/tripo3d/p2/text-to-3d/api)

```typescript
const res = await fal.run.tripo3d.p2.textTo3d({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### veed

<details>
<summary><code>POST</code> <b><code>fal.veed.cleanAudio</code></b></summary>

<code>POST https://fal.run/veed/clean-audio</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/veed/clean-audio/api)

```typescript
const res = await fal.run.veed.cleanAudio({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### veo3p1

<details>
<summary><code>POST</code> <b><code>fal.veo3p1.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/veo3.1/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.veo3p1.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.veo3p1.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/veo3.1</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.veo3p1.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### vidu

<details>
<summary><code>POST</code> <b><code>fal.vidu.q4.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/vidu/q4/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/vidu/q4/image-to-video/api)

```typescript
const res = await fal.run.vidu.q4.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.vidu.q4.referenceToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/vidu/q4/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/fal-ai/vidu/q4/reference-to-video/api)

```typescript
const res = await fal.run.vidu.q4.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### virtualTryOn

<details>
<summary><code>POST</code> <b><code>fal.virtualTryOn</code></b></summary>

<code>POST https://fal.run/google/virtual-try-on</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/google/virtual-try-on/api)

```typescript
const res = await fal.run.virtualTryOn({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### wan

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.wan.v2p7.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.editVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/edit-video</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await fal.run.wan.v2p7.editVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.imageToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.wan.v2p7.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.pro.edit</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/pro/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.wan.v2p7.pro.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.pro.textToImage</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/pro/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.wan.v2p7.pro.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.referenceToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/reference-to-video</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await fal.run.wan.v2p7.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.textToImage</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.wan.v2p7.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.wan.v2p7.textToVideo</code></b></summary>

<code>POST https://fal.run/fal-ai/wan/v2.7/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.wan.v2p7.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### workflows

<details>
<summary><code>GET</code> <b><code>fal.v1.workflows</code></b></summary>

<code>GET https://api.fal.ai/v1/workflows</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.v1.workflows({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fal.v1.workflows.get</code></b></summary>

<code>GET https://api.fal.ai/v1/workflows/{username}/{workflow_name}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/docs/platform-apis/v1/workflows/get)

```typescript
const res = await fal.v1.workflows.get({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

### xai

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineImage</code></b></summary>

<code>POST https://api.fal.ai/v1/xai/grok-imagine-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.xai.grokImagineImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineImage.edit</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-image/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.xai.grokImagineImage.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineImage.v2p0.edit</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-image/v2.0/edit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-image/v2.0/edit/api)

```typescript
const res = await fal.run.xai.grokImagineImage.v2p0.edit({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineImage.v2p0.textToImage</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-image/v2.0/text-to-image</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-image/v2.0/text-to-image/api)

```typescript
const res = await fal.run.xai.grokImagineImage.v2p0.textToImage({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.editVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/edit-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.xai.grokImagineVideo.editVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.extendVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/extend-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.xai.grokImagineVideo.extendVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.imageToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.xai.grokImagineVideo.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.referenceToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.fal.ai)

```typescript
const res = await fal.run.xai.grokImagineVideo.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.v1p5.imageToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/v1.5/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-video/v1.5/image-to-video/api)

```typescript
const res = await fal.run.xai.grokImagineVideo.v1p5.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.v1p5.lite.imageToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/v1.5/lite/image-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-video/v1.5/lite/image-to-video/api)

```typescript
const res = await fal.run.xai.grokImagineVideo.v1p5.lite.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.v1p5.lite.textToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/v1.5/lite/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-video/v1.5/lite/text-to-video/api)

```typescript
const res = await fal.run.xai.grokImagineVideo.v1p5.lite.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.v1p5.referenceToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/v1.5/reference-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-video/v1.5/reference-to-video/api)

```typescript
const res = await fal.run.xai.grokImagineVideo.v1p5.referenceToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokImagineVideo.v1p5.textToVideo</code></b></summary>

<code>POST https://fal.run/xai/grok-imagine-video/v1.5/text-to-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-imagine-video/v1.5/text-to-video/api)

```typescript
const res = await fal.run.xai.grokImagineVideo.v1p5.textToVideo({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fal.xai.grokVoice</code></b></summary>

<code>POST https://fal.run/xai/grok-voice</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://fal.ai/models/xai/grok-voice/api)

```typescript
const res = await fal.run.xai.grokVoice({ /* ... */ });
```

Source: [`packages/provider/fal/src/fal.ts`](src/fal.ts)

</details>

## Middleware

```typescript
import { createFal, withRetry } from "@apicity/fal";

const fal = createFal({ apiKey: process.env.FAL_API_KEY! });
const models = withRetry(fal.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
