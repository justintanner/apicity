# @apicity/machgen

[![npm](https://img.shields.io/npm/v/@apicity/machgen?color=cb0000)](https://www.npmjs.com/package/@apicity/machgen)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-machgen.ai-blue)](https://www.machgen.ai/docs/rest_api)

MachGen video generation API provider.

Image generation uses the same `api.v0.generate` method: set `task_type` to `T2I` or `I2I` and supply `image_config` with `height` and optional `width`/`aspect_ratio`. The frontier image IDs are `GPT-Image-2`, `GPT-Image-2.5-Sunburst`, `GPT-Image-2.5-Flare`, `Nano-Banana-2` and `Nano-Banana-2.1`. Edits take public HTTP(S) `src_image_urls` or previous image `src_task_ids`. Poll `api.v0.tasks` for `task_output.image`. GPT Image 2 defaults to high quality; `optimization_level: "EXPRESS"` selects low quality. The recorded 1280×544 EXPRESS request billed $0.001385 before Generation Credit. Send `Alibaba-Wan-3.0` requests with MachGen's documented `video_config`: `aspect_ratio: "adaptive"`, `fps: 30` and `audio: true`. On 2026-10-22, seven Wan 3.0 tasks that omitted `aspect_ratio` and `fps` and sent `audio: false` were accepted, then failed upstream with `Request Rejected` at zero charge. With the documented config, 2-second 480p T2V, I2V and R2V requests completed. Which of the three fields MachGen requires has not been isolated.

Runtime dependencies:

- `zod@^4.6.6` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/machgen
# or
pnpm add @apicity/machgen
```

## Quick Start

```typescript
import { createMachGen } from "@apicity/machgen";

const machgen = createMachGen({ apiKey: process.env.MACHGEN_API_KEY! });
```

## Video models

Pass a `model` id with a `task_type` it supports. For the ids below,
`machgen.api.v0.generate.schema` also checks the height, `duration_secs`
and `aspect_ratio` against the model's grid (`MACHGEN_VIDEO_GRIDS`, which
holds each T2V and R2V grid too), the I2V frame rules, the R2V reference
limits, the UPSCALE targets (`MACHGEN_VIDEO_UPSCALE`) and the SHARPEN
heights (`MACHGEN_VIDEO_SHARPEN`); other ids pass unchecked. MachGen
answers an off-grid request with HTTP 400 before it accepts the task, and
does not bill it. The grids were read from those 400 responses on
2026-10-25, and the SHARPEN heights on 2026-10-31. `-1` asks the model for
a Smart length.

| Model | T2V | I2V | R2V | UPSCALE | SHARPEN | I2V frames | I2V heights | I2V seconds | Priced |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Wan2.2-A14B` | ✓ | ✓ |  |  |  |  | 480, 720 | 5 | T2V, I2V |
| `LTX-2.3-Pro` | ✓ | ✓ |  |  |  | start + end | 1080, 1440, 2160 | 6, 8, 10 | T2V, I2V |
| `Vidu-Q3-Turbo` | ✓ | ✓ | ✓ |  |  | start + end | 540, 720 | 1-16 | T2V, I2V, R2V |
| `Vidu-Q3-Pro` | ✓ | ✓ | ✓ |  |  | start + end | 540, 720, 1080 | 1-16 | T2V, I2V, R2V |
| `MiniMax-H3` | ✓ | ✓ | ✓ | ✓ | ✓ | start + end, or end only | 480, 768, 1080, 1440 | 1-30 | T2V, I2V, R2V, UPSCALE, SHARPEN |
| `MiniMax-H3-Turbo` | ✓ | ✓ | ✓ |  |  | start + end, or end only | 480, 768, 1080 | 4-15 | T2V, I2V, R2V |
| `Seedance-2.5` | ✓ | ✓ | ✓ |  |  | start + end | 480, 720, 1080 | -1, 4-30 | T2V, I2V, R2V |
| `Seedance-2.0` | ✓ | ✓ | ✓ |  |  | start + end | 480, 720, 1080, 2160 | -1, 4-15 | T2V, I2V, R2V |
| `Seedance-2.0-Fast` | ✓ | ✓ | ✓ |  |  | start + end | 480, 720 | -1, 4-15 | T2V, I2V, R2V |
| `Seedance-2.0-Mini` | ✓ | ✓ | ✓ |  |  | start + end | 480, 720 | -1, 4-15 | T2V, I2V, R2V |
| `Kling-v3` | ✓ | ✓ |  |  |  | start + end | 720, 1080, 2160 | 3-15 | T2V, I2V |
| `Kling-o3` | ✓ |  | ✓ |  |  |  |  |  | T2V, R2V |
| `Vidu-Q3` |  |  | ✓ |  |  |  |  |  | R2V |
| `Vidu-Q4-Preview` |  | ✓ | ✓ |  |  |  | 540, 720, 1080, 1440, 2160 | 3-16 | I2V, R2V |
| `Vidu-Q3-Pro-Fast` |  | ✓ |  |  |  |  | 720, 1080 | 1-16 | I2V |
| `Alibaba-Wan-3.0` | ✓ | ✓ | ✓ |  |  | start + end | 480, 720, 1080 | -1, 2-30 | T2V, I2V, R2V |
| `Veo-3.1` | ✓ |  |  |  |  |  |  |  | T2V |
| `Veo-3.1-Fast` | ✓ |  |  |  |  |  |  |  | T2V |
| `Pixverse-V6` | ✓ | ✓ | ✓ |  |  |  | 360, 540, 720, 1080 | 1-15 | T2V, I2V, R2V |
| `Pixverse-C1` | ✓ | ✓ | ✓ |  |  |  | 360, 540, 720, 1080 | 1-15 | T2V, I2V, R2V |
| `HappyHorse-1.1` | ✓ | ✓ | ✓ |  |  |  | 720, 1080 | 3-15 | T2V, I2V, R2V |
| `HappyHorse-1.0` | ✓ | ✓ | ✓ |  |  |  | 720, 1080 | 3-15 | T2V, I2V, R2V |
| `Grok-Imagine-Video` | ✓ |  |  |  |  |  |  |  | T2V |
| `Grok-Imagine-Video-1.5` |  | ✓ |  |  |  |  | 480, 720, 1080 | 1-15 | I2V |
| `Topaz-Video-Precision` |  |  |  | ✓ |  |  |  |  |  |
| `Topaz-Video-Precision-Animation` |  |  |  | ✓ |  |  |  |  |  |
| `Topaz-Video-Generative` |  |  |  | ✓ |  |  |  |  |  |
| `Topaz-Video-Generative-Fast` |  |  |  | ✓ |  |  |  |  |  |

An I2V request takes one start frame in `src_image_urls`. Where the table
lists "start + end", entry 1 is the end frame; "end only" means
`keyframe_indices: [-1]` animates toward a single image used as the end
frame. MachGen also accepts `task_type: "F2F"` for two-image I2V; the
schema keeps the documented I2V form. MiniMax-H3 and MiniMax-H3-Turbo list
1080p, but MachGen answers 403 to accounts without access to it, and the
pricebook has no 1080p rate. The pricebook's LTX-2.3-Pro 540p and 720p
tiers are not requestable.

### Reference-to-video

An R2V request takes reference images, videos and audio clips in
`src_image_urls`, `src_video_urls` (public http(s) URLs) and
`src_audio_urls`, or earlier outputs in `src_task_ids`.
`reference_video_start_secs` lists one start second per reference video.
`reference_video_operation` edits or extends the video instead of using
it as a reference; an edit renders at the video's own length, so MachGen
ignores `duration_secs`.

| Model | R2V heights | R2V seconds | References | Reference video |
| --- | --- | --- | --- | --- |
| `Vidu-Q3-Turbo` | 540, 720 | 1-16 | up to 7 images; no videos or audio | none |
| `Vidu-Q3-Pro` | 540, 720 | 1-16 | up to 7 images; no videos or audio | none |
| `MiniMax-H3` | 480, 768, 1080, 1440 | 1-30 | up to 9 images, 3 videos, 3 audio; 15 in all | reference; start offsets |
| `MiniMax-H3-Turbo` | 480, 768, 1080 | 4-15 | up to 9 images, 3 videos, 3 audio; 15 in all | reference; start offsets |
| `Seedance-2.5` | 480, 720, 1080 | -1, 4-30 | not checked | reference, edit, extend |
| `Seedance-2.0` | 480, 720, 1080, 2160 | -1, 4-15 | up to 9 images, 3 videos, 3 audio; audio needs an image or video | reference |
| `Seedance-2.0-Fast` | 480, 720 | -1, 4-15 | up to 9 images, 3 videos, 3 audio; 12 in all; audio needs an image or video | reference |
| `Seedance-2.0-Mini` | 480, 720 | -1, 4-15 | up to 9 images, 3 videos, 3 audio; 12 in all; audio needs an image or video | reference |
| `Kling-o3` | 720, 1080, 2160 | 3-15 | up to 7 images; no videos or audio | none |
| `Vidu-Q3` | 540, 720, 1080 | 3-16 | up to 7 images; no videos or audio | none |
| `Vidu-Q4-Preview` | 540, 720, 1080, 1440, 2160 | 3-16 | up to 3 audio; no videos; images not checked | none |
| `Alibaba-Wan-3.0` | 480, 720, 1080 | -1, 2-30 | not checked | not checked |
| `Pixverse-V6` | 360, 540, 720, 1080 | 1-15 | up to 3 images; no videos or audio | none |
| `Pixverse-C1` | 360, 540, 720, 1080 | 1-15 | up to 3 images; no videos or audio | none |
| `HappyHorse-1.1` | 720, 1080 | 3-15 | not checked | not checked |
| `HappyHorse-1.0` | 720, 1080 | 3-15 | not checked | not checked |

### Upscale and sharpen

An `UPSCALE` task re-renders a finished video, named in `src_task_ids` or
`src_video_urls`, at the target `video_config.height`; set
`duration_secs` to the source's length. MiniMax-H3 upscales only its own
768p outputs of 5 s or more. MachGen also rejects a target at or below the
source's height, and a `gaia-2` target above twice it; those depend on the
source, so the schema cannot check them.

| Model | Target heights | Engines | Priced |
| --- | --- | --- | --- |
| `MiniMax-H3` | 1440 |  | ✓ |
| `Topaz-Video-Precision` | 1080, 1440, 2160, 4320 | `artemis-hq`, `artemis-lq`, `artemis-mq`, `gaia-cg`, `gaia-hq`, `proteus` |  |
| `Topaz-Video-Precision-Animation` | 720, 960, 1080, 1440, 2160, 4320 | `gaia-2` |  |
| `Topaz-Video-Generative` | 1080, 1440, 2160 | `starlight-hq`, `starlight-mini`, `starlight-precise-2-5`, `starlight-sharp` |  |
| `Topaz-Video-Generative-Fast` | 1080, 1440, 2160 | `starlight-fast-2` |  |

A `SHARPEN` task sharpens one owned video and keeps its length: a MachGen
output named in `src_task_ids`, or an upload referenced as
`@input/<artifact_path>` in `src_video_urls`. MachGen refuses a public
URL. It takes `duration_secs`, not `num_frames`. MachGen's quote prices
the source's height and seconds, whatever the request's height or
`duration_secs`, so set `video_config.height` to the source's height.

| Model | Heights | Priced |
| --- | --- | --- |
| `MiniMax-H3` | 480, 768 | ✓ |

**Priced** lists the task types `computeEstimate` from `@apicity/cost`
prices per output second. An R2V reference video also bills the seconds
MachGen reads from it, after any start offset, so pass their total as
`costHints.inputDurationSeconds`; an edit's output is that long too. An
upscale bills by its source's length, so it needs the same hint;
MiniMax-H3 bills those seconds in and out. A sharpen needs the hint too
and bills the seconds once. Topaz bills vendor credits that
depend on the source's frames and resolution, so `computeEstimate` does
not price it; `api.v0.upscale.quote` asks MachGen for the exact price, and
`resolveMachGenUpscaleEstimate` turns that quote into an estimate.
Kling-v3, Kling-o3 and the Pixverse models price audio on
and off apart, so set `video_config.audio`. `api.v0.tasks.billing`
returns a finished task's actual charge in micro-USD.

```typescript
import { createMachGen } from "@apicity/machgen";

const machgen = createMachGen({ apiKey: process.env.MACHGEN_API_KEY! });

const task = await machgen.api.v0.generate({
  model: "MiniMax-H3-Turbo",
  task_type: "I2V",
  prompt: "The cat slowly blinks and turns its head toward the window.",
  video_config: { height: 480, duration_secs: 4 },
  src_image_urls: [
    "https://example.com/start.jpg",
    "https://example.com/end.jpg",
  ],
});

let status = await machgen.api.v0.tasks(task.task_id);
while (status.status === "PENDING" || status.status === "RUNNING") {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  status = await machgen.api.v0.tasks(task.task_id);
}
const bill = await machgen.api.v0.tasks.billing(task.task_id);
console.log(bill.generation_cost_micros / 1e6); // 0.04
```

## API Reference

5 endpoints across 4 groups. Each method mirrors an upstream URL path.

### assets

<details>
<summary><code>GET</code> <b><code>machgen.api.v0.assets</code></b></summary>

<code>GET https://api.machgen.ai/api/v0/assets/{taskId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/rest_api#check-status-and-download)

```typescript
const res = await machgen.api.v0.assets({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

### generate

<details>
<summary><code>POST</code> <b><code>machgen.api.v0.generate</code></b></summary>

<code>POST https://api.machgen.ai/api/v0/generate</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/rest_api#submit-a-task)

```typescript
const res = await machgen.api.v0.generate({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

### tasks

<details>
<summary><code>GET</code> <b><code>machgen.api.v0.tasks</code></b></summary>

<code>GET https://api.machgen.ai/api/v0/tasks/{taskId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/reference#taskstatusresponse)

```typescript
const res = await machgen.api.v0.tasks({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

<details>
<summary><code>GET</code> <b><code>machgen.api.v0.tasks.billing</code></b></summary>

<code>GET https://api.machgen.ai/api/v0/tasks/{taskId}/billing</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://www.machgen.ai/docs/rest_api#check-what-a-task-cost)

```typescript
const res = await machgen.api.v0.tasks.billing({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

### upscale

<details>
<summary><code>POST</code> <b><code>machgen.api.v0.upscale.quote</code></b></summary>

<code>POST https://api.machgen.ai/api/v0/upscale/quote</code>

Cost tier: <code>expensive</code>

> **Undocumented upstream:** MachGen's REST docs do not list this endpoint (read 2026-10-26), so MachGen may change or remove it without notice. MachGen's web app prices an upscale with it before submitting, and the MCP server's `quote_video_upscale` tool ([docs](https://www.machgen.ai/docs/mcp#tools)) is the documented form of the same check. The quote is free, creates no task and answers `{ cost_micros }`, the micro-USD the upscale of a source you own would bill; a recorded Topaz upscale billed exactly its quote. On 2026-10-26 a 2160p Topaz Video Generative Fast upscale of a 4 s 480p task quoted 596000 micros (recording `machgen/topaz-video-generative-fast-upscale-quote`). `resolveMachGenUpscaleEstimate` in `@apicity/cost` turns a quote into an estimate.

```typescript
const res = await machgen.api.v0.upscale.quote({ /* ... */ });
```

Source: [`packages/provider/machgen/src/machgen.ts`](src/machgen.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
