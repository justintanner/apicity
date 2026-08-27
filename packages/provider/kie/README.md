# @apicity/kie

[![npm](https://img.shields.io/npm/v/@apicity/kie?color=cb0000)](https://www.npmjs.com/package/@apicity/kie)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Kie provider for video and image generation (Kling 3.0, Grok Imagine, Omnihuman 1.5, Nano Banana Pro).

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/kie
# or
pnpm add @apicity/kie
```

## Quick Start

```typescript
import { createKie } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
```

Resolve `KIE_API_KEY` only in server-side code or trusted job runners.
Do not expose KIE API keys to browsers, mobile clients, public logs, or
frontend bundles.

## Media URLs

Request schemas validate the construction boundary and accept any string
in media input fields — including local slugs such as `@img-ref-1` or
`@asset/photo.png` for assets that have not been uploaded yet. kie.ai
fetches media from the public internet at task-creation time, so before
calling `createTask` you must upload local assets and substitute publicly
reachable URLs (e.g. `https://example.com/image.png`).

## Omnihuman 1.5 model slug

KIE's Omnihuman 1.5 model uses the shared
`kie.post.api.v1.jobs.createTask` endpoint. Send the
`omnihuman-1-5` model slug with a portrait image URL and a driving
audio URL; KIE returns `{ code, msg, data: { taskId } }`, and final
video results are retrieved through
`kie.get.api.v1.jobs.recordInfo(taskId)` or delivered to
`callBackUrl`.

```typescript
const task = await kie.post.api.v1.jobs.createTask({
  model: "omnihuman-1-5",
  input: {
    image_url: "https://example.com/portrait.png",
    mask_url: ["https://example.com/mask.png"],
    audio_url: "https://example.com/speech.mp3",
    prompt: "A person speaking naturally with gentle expressions.",
    output_resolution: "1080",
    pe_fast_mode: false,
    seed: -1,
  },
  callBackUrl: "https://example.com/api/callback",
});
```

`image_url` accepts JPEG, PNG, or WEBP portrait images up to 10 MB.
`mask_url` is optional and accepts at most 5 subject mask image URLs.
`audio_url` accepts MP3, WAV, AAC, OGG, or MP4 audio up to 10 MB and
less than 60 seconds. Use `output_resolution: "720"` or `"1080"`;
defaults are `"1080"` for resolution, `false` for `pe_fast_mode`, and
`-1` for a random seed.

## Gemini Omni Character endpoint

Gemini Omni Character has its own direct endpoint:
`kie.post.api.v1.omni.character.create`. Use it to create a reusable
character reference for `gemini-omni-video`; the returned
`data.characterId` can be passed in that model's `character_ids` array.
If you already created voice traits through Gemini Omni Audio, pass those
`audio_ids` to guide the character's tone or persona.

```typescript
const character = await kie.post.api.v1.omni.character.create({
  descriptions: "A confident presenter in a blue blazer.",
  image_urls: ["https://example.com/presenter.png"],
  audio_ids: ["audio_01hx8p0demo"],
  character_name: "Presenter",
});

const video = await kie.post.api.v1.jobs.createTask({
  model: "gemini-omni-video",
  input: {
    prompt: "Presenter explains the product in a bright studio.",
    character_ids: [character.data!.characterId],
    duration: "4",
  },
});
```

The request field is `descriptions` (plural). `image_urls` is required
and accepts exactly one public reference image, up to KIE's 20 MB
upstream limit. See https://docs.kie.ai/market/gemini-omni-character
for the full upstream contract.

## Grok Imagine 1.5 model slugs

KIE's current Grok Imagine Quick Start markets Grok Imagine 1.5 through
the existing `grok-imagine/text-to-video` and
`grok-imagine/image-to-video` createTask slugs rather than a new stable
`grok-imagine-video-1-5` slug. The package keeps
`grok-imagine-video-1-5-preview` for older recordings and callers, but
new 1.5 integrations should start with the suite slugs shown at
https://kie.ai/grok-imagine.

```typescript
const textVideo = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine/text-to-video",
  input: {
    prompt: "A golden sunset over calm ocean waves",
    aspect_ratio: "16:9",
    mode: "normal",
    duration: 6,
    resolution: "480p",
    nsfw_checker: true,
  },
});

declare const referenceImageUrl: string;

const imageVideo = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine/image-to-video",
  input: {
    image_urls: [referenceImageUrl],
    prompt: "@image1 smiles and waves at the camera",
    aspect_ratio: "16:9",
    mode: "fun",
    duration: "6",
    resolution: "720p",
    nsfw_checker: true,
  },
});
```

For image-to-video, send either `image_urls` or `task_id` plus `index`
from an earlier Grok image generation. Do not send both in one request.
External `image_urls` must point to JPEG, PNG, or WEBP images; KIE's
upstream limit is 7 images and 10 MB per image. `mode: "spicy"` is
only available when sourcing the image from a previous Grok `task_id`,
not from external image URLs.
Active image-to-video prompts are capped at 4096 characters, and
both Grok video models accept `duration` as either a JSON integer or a
canonical decimal integer string from 6 through 30. Values such as `6` and
`"6"` are forwarded in the representation supplied by the caller; Apicity
does not coerce between them. Whitespace, signs, decimals, leading zeroes, and
out-of-range values remain invalid. See KIE's current
[text-to-video](https://docs.kie.ai/market/grok-imagine/text-to-video.md) and
[image-to-video](https://docs.kie.ai/market/grok-imagine/image-to-video.md)
sources and the repository's
[numeric-input compatibility audit](../../../docs/kie-numeric-input-compatibility.md)
for the evidence and field-specific decisions.

## Grok Imagine Extend numeric contract

`grok-imagine/extend` requires a completed source task and preserves
both contract fields exactly as supplied. `extend_at` is a required JSON
number with minimum `0`; fractional positions are accepted, omission is
rejected, and Apicity does not inject KIE's advertised default. The
`extend_times` field is the required string enum `"6" | "10"`; JSON
numbers and malformed strings are rejected rather than coerced.

```typescript
declare const completed480pTaskId: string;

const extended = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine/extend",
  resolution: "480p", // Pricing hint for the source resolution.
  input: {
    task_id: completed480pTaskId,
    prompt: "Continue the scene with a gentle camera drift.",
    extend_at: 2.5,
    extend_times: "6",
  },
});
```

The current contract comes from the repository's bounded compatibility
matrix. See the
[numeric-input compatibility audit](../../../docs/kie-numeric-input-compatibility.md)
for the official-source conflict, historical observation, live results,
and no-coercion decision.

## ElevenLabs numeric contracts

The two KIE text-to-speech models share the same inclusive numeric contract:

| Models | Field | Minimum | Maximum | Default |
| --- | --- | ---: | ---: | ---: |
| `elevenlabs/text-to-speech-multilingual-v2`, `elevenlabs/text-to-speech-turbo-2-5` | `stability` | 0 | 1 | 0.5 |
| same | `similarity_boost` | 0 | 1 | 0.75 |
| same | `style` | 0 | 1 | 0 |
| same | `speed` | 0.7 | 1.2 | 1 |

For `elevenlabs/text-to-dialogue-v3`, `stability` accepts only the discrete
values `0`, `0.5`, and `1`, and defaults to `0.5`.

Parsing with the exported Zod request schemas materializes these defaults in
the parsed result. Calling `kie.post.api.v1.jobs.createTask` is intentionally
different: it validates the request but serializes the original caller object,
so omitted settings remain omitted on the wire. Explicit valid values are
preserved in both direct parsing and transport.

See KIE's official pages for
[dialogue v3](https://docs.kie.ai/market/elevenlabs/text-to-dialogue-v3.md),
[multilingual v2](https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2.md),
and [turbo 2.5](https://docs.kie.ai/market/elevenlabs/text-to-speech-turbo-2-5.md).

`createTask` returns `{ code, msg, data: { taskId } }`. For production
workloads, pass `callBackUrl` so KIE can notify you when the job
finishes. Without a callback, poll
`kie.get.api.v1.jobs.recordInfo(taskId)` until `state` is `success` or
`fail`; successful responses carry generated media URLs in the
`resultJson` string.

## HappyHorse 1.1 model slugs

KIE exposes Alibaba HappyHorse 1.1 through the same shared
`kie.post.api.v1.jobs.createTask` endpoint. Use the 1.1 model slugs
`happyhorse-1-1/text-to-video`, `happyhorse-1-1/image-to-video`, and
`happyhorse-1-1/reference-to-video` with the input shapes shown in
KIE's docs at https://docs.kie.ai/market/happyhorse-1-1/text-to-video,
https://docs.kie.ai/market/happyhorse-1-1/image-to-video, and
https://docs.kie.ai/market/happyhorse-1-1/reference-to-video.

```typescript
const textTask = await kie.post.api.v1.jobs.createTask({
  model: "happyhorse-1-1/text-to-video",
  input: {
    prompt: "A dog running on the earth",
    resolution: "1080p",
    aspect_ratio: "16:9",
    duration: 5,
  },
  callBackUrl: "https://example.com/api/callback",
});

const imageTask = await kie.post.api.v1.jobs.createTask({
  model: "happyhorse-1-1/image-to-video",
  input: {
    image_urls: ["https://example.com/first-frame.png"],
    prompt: "A cat running on the grass",
    resolution: "1080p",
    duration: 5,
  },
});

const referenceTask = await kie.post.api.v1.jobs.createTask({
  model: "happyhorse-1-1/reference-to-video",
  input: {
    reference_image: ["https://example.com/reference.png"],
    prompt: "A cat running on the grass",
    resolution: "1080p",
    aspect_ratio: "16:9",
    duration: 5,
  },
});

console.log(
  textTask.data?.taskId,
  imageTask.data?.taskId,
  referenceTask.data?.taskId,
);
```

For 1.1 image-to-video, `image_urls` is required and accepts exactly
one first-frame image URL. For 1.1 reference-to-video,
`reference_image` accepts 1-9 image URLs and prompts can refer to
the images by position. All three generation modes use `resolution`
(`"720p"` or `"1080p"`) and integer `duration` from 3 to 15 seconds;
text-to-video and reference-to-video also expose the wider 1.1
aspect-ratio set including `"21:9"` and `"9:21"`.

## Seedance 2 Mini createTask flow

Seedance 2 Mini also uses the shared KIE jobs endpoints. Submit
`model: "bytedance/seedance-2-mini"` to
`kie.post.api.v1.jobs.createTask`, then poll
`kie.get.api.v1.jobs.recordInfo(taskId)` or pass `callBackUrl` for
completion notifications.

```typescript
const miniTask = await kie.post.api.v1.jobs.createTask({
  model: "bytedance/seedance-2-mini",
  input: {
    prompt: "A compact launch video with crisp product details.",
    reference_image_urls: ["https://example.com/product.png"],
    reference_video_urls: ["https://example.com/source.mp4"],
    reference_audio_urls: ["https://example.com/voice.wav"],
    generate_audio: false,
    resolution: "720p",
    aspect_ratio: "16:9",
    duration: 15,
    web_search: false,
    nsfw_checker: true,
  },
  callBackUrl: "https://example.com/api/kie-callback",
});

const miniInfo = await kie.get.api.v1.jobs.recordInfo(
  miniTask.data!.taskId
);
const miniResult = miniInfo.data?.resultJson
  ? JSON.parse(miniInfo.data.resultJson)
  : null;
console.log(miniInfo.data?.state, miniResult?.resultUrls);
```

The example explicitly sets `duration: 15` as an upper-bound override.
When `duration` is omitted, the exported schema applies its 5-second
default.

`prompt` is optional and capped at 20000 characters. Media references
default to empty arrays when using the exported Zod schema. `duration`
is an integer from 4 to 15 seconds, `resolution` is `480p` or `720p`,
and `aspect_ratio` is one of `16:9`, `4:3`, `1:1`, `3:4`, `9:16`,
`21:9`, or `adaptive`. The schema defaults are `generate_audio: true`,
`resolution: "720p"`, `aspect_ratio: "16:9"`, `duration: 5`,
`web_search: false`, and `nsfw_checker: true`.

## Real-world example: Kling 3.0 Turbo createTask payloads

KIE's Kling 3.0 Turbo Quick Start exposes two createTask slugs:
`kling/v3-turbo-text-to-video` and
`kling/v3-turbo-image-to-video`. Both use the same
`kie.post.api.v1.jobs.createTask` endpoint as the rest of the KIE
media models; only the `model` and `input` block change.

```typescript
import { createKie } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });

const textTask = await kie.post.api.v1.jobs.createTask({
  model: "kling/v3-turbo-text-to-video",
  input: {
    prompt: "A cinematic drone shot over glass towers at sunrise.",
    duration: 5,
    aspect_ratio: "16:9",
    resolution: "720p",
  },
});

const imageTask = await kie.post.api.v1.jobs.createTask({
  model: "kling/v3-turbo-image-to-video",
  input: {
    prompt: "Animate the product photo with a slow studio turntable move.",
    image_urls: ["https://example.com/product.png"],
    duration: 5,
    resolution: "1080p",
  },
});

console.log(textTask.data?.taskId, imageTask.data?.taskId);
```

The image-to-video shape accepts exactly one `image_urls` entry. Both
Turbo shapes require `prompt`, numeric `duration`, and `resolution`
(`720p` or `1080p`); text-to-video additionally requires
`aspect_ratio` (`1:1`, `9:16`, or `16:9`).

## Real-world example: Kling 3.0 video with named element references

Kling 3.0/video has a feature most upstream video models lack — **named
element references**. You upload reference images for each subject, give
the subject a `name` and `description`, and refer back to it from the
prompt with `[name]` placeholders. The result preserves identity across
frames without prompt-engineering gymnastics.

The flow below is taken verbatim from
[`tests/integration/kie-kling-30-reference-bakeoff.test.ts`](../../../tests/integration/kie-kling-30-reference-bakeoff.test.ts)
and replays against
[`tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/recording.har`](../../../tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/recording.har),
so the response shapes match what Kie actually returns.

```typescript
import { readFileSync } from "node:fs";
import { createKie } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });

// 1. Upload each reference image. Kie returns a CDN-hosted
//    `downloadUrl` you'll thread through the job request — the bytes
//    themselves never live in the createTask payload.
async function upload(filename: string, mimeType: string): Promise<string> {
  const blob = new Blob([readFileSync(filename)], { type: mimeType });
  const res = await kie.post.api.fileStreamUpload({
    file: blob,
    filename,
    uploadPath: "images/test-uploads",
  });
  if (!res.data?.downloadUrl) throw new Error("upload failed");
  return res.data.downloadUrl;
}

// Two angles of the cat satisfy Kling's "2-4 images per element"
// minimum. The man only has one fixture, so we pass it twice.
const cat1  = await upload("cat1.jpg",  "image/jpeg");
const cat2  = await upload("cat2.jpg",  "image/jpeg");
const man   = await upload("man.jpg",   "image/jpeg");
const beach = await upload("beach.png", "image/png");

// 2. Submit the job. Each `kling_elements` entry binds a `name` to a
//    set of reference images; the prompt then refers to that subject
//    via `[name]`. `image_urls` carries general/setting references —
//    the beach plate here — that aren't tied to a named subject.
const task = await kie.post.api.v1.jobs.createTask({
  model: "kling-3.0/video",
  input: {
    prompt:
      "On a sandy beach with the ocean behind, [blue_suit_man] sits " +
      "cross-legged on the sand. [white_cat] climbs onto his lap, " +
      "purrs, and lifts a paw to bat playfully at his blue tie. " +
      "[blue_suit_man] smiles and waves at the camera with his free hand.",
    image_urls: [beach],
    kling_elements: [
      {
        name: "white_cat",
        description: "A white cat with mismatched yellow and blue eyes",
        element_input_urls: [cat1, cat2],
      },
      {
        name: "blue_suit_man",
        description: "A man wearing a blue suit and a blue tie",
        element_input_urls: [man, man],
      },
    ],
    sound: false,
    duration: "5",
    aspect_ratio: "16:9",
    mode: "std",
    multi_shots: false,
  },
});

if (!task.data?.taskId) throw new Error("createTask returned no taskId");
const taskId = task.data.taskId;
// → "56074f12319c68b246e5a03e05608f31"

// 3. Poll recordInfo until the job leaves the `generating` state.
//    Kie's terminal states are `success` and `fail` — anything else
//    (`waiting`, `queuing`, `generating`) means keep waiting.
let state: string = "waiting";
let resultJson: string | undefined;
for (let i = 0; i < 200; i++) {
  const info = await kie.get.api.v1.jobs.recordInfo(taskId);
  state = info.data?.state ?? "waiting";
  if (state === "success" || state === "fail") {
    resultJson = info.data?.resultJson;
    break;
  }
  await new Promise((r) => setTimeout(r, 10_000));
}
if (state !== "success" || !resultJson) throw new Error(`job ${state}`);

// 4. `resultJson` is a JSON-encoded string — parse it to get the
//    delivered media URLs. The shape is consistent across every kie
//    media model (single `resultUrls: string[]`).
const result = JSON.parse(resultJson) as { resultUrls: string[] };
console.log(result.resultUrls[0]);
// → "https://tempfile.aiquickdraw.com/k/56074f12319c68b246e5a03e05608f31_1_1777540551_7969.mp4"
```

**Notes**

- `kling_elements` accepts at most 3 named subjects, and each
  `element_input_urls` array must hold **2–4 images**. If you only have
  one reference per subject, repeat it (as the example does for `man`)
  to satisfy the minimum.
- The poll loop watches for the terminal states `success` and `fail` —
  anything else (`waiting`, `queuing`, `generating`) means keep going.
  There's no `check_after_secs` hint as on some other providers, so a
  10s cadence is conservative; in the recorded fixture the job
  completed after ~127s of generating (14 polls).
- `kie.post.api.v1.jobs.createTask` is the unified entry point for every
  media model in this provider — Kling, Wan, Seedance, Grok Imagine,
  GPT-Image-2, Qwen2, and others. Swap the `model` and `input` block;
  the rest of the flow (upload → createTask → poll → parse `resultJson`)
  is identical.
- For convenience, `submitMediaJob(provider, request)` and
  `uploadFile(provider, blob, filename, uploadPath)` re-export the same
  calls but throw `KieError` directly when the upstream envelope is
  missing the expected fields.
- Errors surface as `KieError` with `status`, `body`, and an upstream
  `code` attached, so
  `try { ... } catch (e) { if (e instanceof KieError) ... }` gives you
  the upstream error directly.

## Qwen2 image edit createTask flow

Qwen2 image edit uses the shared KIE jobs endpoint. Submit
`model: "qwen2/image-edit"` to `kie.post.api.v1.jobs.createTask`, then
poll `kie.get.api.v1.jobs.recordInfo(taskId)` or pass `callBackUrl`.

```typescript
const task = await kie.post.api.v1.jobs.createTask({
  model: "qwen2/image-edit",
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt: "Add sunglasses to the subject",
    image_url: "https://example.com/source.png",
    image_size: "16:9",
    seed: 0,
    output_format: "png",
    nsfw_checker: false,
  },
});
```

`prompt` is required and capped at 800 characters. `image_url` is a
single source image URL, not file content; upload local images first and
pass the returned URL. KIE accepts JPEG, PNG, and WEBP images up to
10 MB. `image_size` defaults to `16:9` and accepts `1:1`, `2:3`, `3:2`,
`3:4`, `4:3`, `9:16`, `16:9`, and `21:9`. `output_format` defaults to
`png` and accepts `jpeg` or `png`. When supplied, `seed` must be an
integer; an omitted seed remains absent, and KIE publishes no bounds or
default. `nsfw_checker` defaults to `false`.

## Qwen2 text-to-image createTask flow

Qwen2 text-to-image uses the same shared KIE jobs endpoint. Submit
`model: "qwen2/text-to-image"` to `kie.post.api.v1.jobs.createTask`,
then poll `kie.get.api.v1.jobs.recordInfo(taskId)` or pass
`callBackUrl`.

```typescript
const task = await kie.post.api.v1.jobs.createTask({
  model: "qwen2/text-to-image",
  callBackUrl: "https://your-domain.com/api/callback",
  input: {
    prompt: "A serene mountain landscape at sunrise",
    image_size: "16:9",
    seed: 0,
    output_format: "png",
    nsfw_checker: false,
  },
});
```

`prompt` is required and capped at 800 characters. `image_size`
defaults to `16:9` and accepts `1:1`, `3:4`, `4:3`, `9:16`, and
`16:9`. `output_format` defaults to `png` and accepts `jpeg` or
`png`; `seed` must be an integer when provided; `nsfw_checker`
defaults to `false`.

## Wan 2.2 auxiliary model operations

Wan 2.2 speech-to-video, image-to-video, animate move, and animate replace
are four model operations on the same
`kie.post.api.v1.jobs.createTask` endpoint, not four endpoint methods. Type
the request at the package boundary, submit it, then read `data.taskId` and
poll the shared `kie.get.api.v1.jobs.recordInfo(taskId)` endpoint.

```typescript
import {
  createKie,
  type TaskResponse,
  type Wan22A14bImageToVideoTurboRequest,
  type Wan22A14bSpeechToVideoTurboRequest,
  type Wan22AnimateMoveRequest,
  type Wan22AnimateReplaceRequest,
} from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });

const imageToVideo = {
  model: "wan/2-2-a14b-image-to-video-turbo",
  input: {
    image_url: "https://example.com/first-frame.png",
    prompt: "A slow camera push toward the subject",
  },
} satisfies Wan22A14bImageToVideoTurboRequest;

const speechToVideo = {
  model: "wan/2-2-a14b-speech-to-video-turbo",
  input: {
    prompt: "The presenter explains the product",
    image_url: "https://example.com/presenter.png",
    audio_url: "https://example.com/presenter.mp3",
  },
} satisfies Wan22A14bSpeechToVideoTurboRequest;

const animateMove = {
  model: "wan/2-2-animate-move",
  input: {
    video_url: "https://example.com/source.mp4",
    image_url: "https://example.com/subject.png",
  },
} satisfies Wan22AnimateMoveRequest;

const animateReplace = {
  model: "wan/2-2-animate-replace",
  input: {
    video_url: "https://example.com/source.mp4",
    image_url: "https://example.com/replacement.png",
  },
} satisfies Wan22AnimateReplaceRequest;

const task: TaskResponse = await kie.post.api.v1.jobs.createTask(imageToVideo);
const taskId = task.data?.taskId;
if (!taskId) throw new Error("KIE did not return a taskId");

const details = await kie.get.api.v1.jobs.recordInfo(taskId);
console.log(details.data?.state, details.data?.resultJson);
```

Use the same `createTask` call with `speechToVideo`, `animateMove`, or
`animateReplace` for the other operations. The required media fields are
public URLs; upload local assets before submission. A `callBackUrl` can be
provided instead of polling. See the
[Wan 2.2 auxiliary-media evidence matrix](../../../docs/kie-wan-22-auxiliary-media.md)
for the exact documented fields, defaults, response envelope, and evidence
boundary.
## Qwen Image 3 createTask flow

Qwen Image 3 has four exact Kie model ids: `qwen3/text-to-image`,
`qwen3/image-to-image`, `qwen3/pro-text-to-image`, and
`qwen3/pro-image-to-image`. See the official model pages for
[`qwen3/text-to-image`](https://docs.kie.ai/market/qwen3/text-to-image),
[`qwen3/image-to-image`](https://docs.kie.ai/market/qwen3/image-to-image),
[`qwen3/pro-text-to-image`](https://docs.kie.ai/market/qwen3-pro/text-to-image),
and
[`qwen3/pro-image-to-image`](https://docs.kie.ai/market/qwen3-pro/image-to-image).

Text-to-image accepts an optional `resolution`; there is no documented
default, so set it explicitly when constructing a request:

```typescript
const textTask = await kie.post.api.v1.jobs.createTask({
  model: "qwen3/text-to-image",
  input: {
    prompt: "A quiet alpine lake beneath the Milky Way",
    resolution: "2K",
    image_size: "16:9",
    output_format: "png",
    prompt_extend: true,
    nsfw_checker: false,
    seed: 1,
  },
});
```

Image-to-image uses the same shared fields plus `image_urls`, an array
of one to three public source-image URLs. Its `resolution` defaults to
`1K` when omitted:

```typescript
const imageTask = await kie.post.api.v1.jobs.createTask({
  model: "qwen3/pro-image-to-image",
  input: {
    prompt: "Turn this product photo into a watercolor illustration",
    image_urls: ["https://example.com/product.png"],
    image_size: "4:3",
    output_format: "jpeg",
    prompt_extend: true,
    nsfw_checker: false,
    seed: 1,
  },
});
```

## Grok Imagine Image 2.0 createTask flow

Grok Imagine Image 2.0 has three exact Kie model ids:
`grok-imagine-image-2-0/text-to-image`,
`grok-imagine-image-2-0/segment-map`, and
`grok-imagine-image-2-0/image-edit`. See the official model pages for
[`grok-imagine-image-2-0/text-to-image`](https://docs.kie.ai/market/grok-imagine-image-2-0/text-to-image),
[`grok-imagine-image-2-0/segment-map`](https://docs.kie.ai/market/grok-imagine-image-2-0/segment-map),
and
[`grok-imagine-image-2-0/image-edit`](https://docs.kie.ai/market/grok-imagine-image-2-0/image-edit).

Text-to-image requires both a prompt and an `aspect_ratio`:

```typescript
async function waitForSuccess(taskId: string): Promise<string> {
  for (let attempt = 0; attempt < 180; attempt++) {
    const details = await kie.get.api.v1.jobs.recordInfo(taskId);
    const state = details.data?.state ?? "waiting";
    if (state === "success") return details.data?.resultJson ?? "{}";
    if (state === "fail") throw new Error(`KIE task ${taskId} failed`);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`KIE task ${taskId} timed out`);
}

const textTask = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine-image-2-0/text-to-image",
  input: {
    prompt: "A white cat with mismatched yellow and blue eyes",
    aspect_ratio: "1:1",
  },
});
const sourceTaskId = textTask.data?.taskId;
if (!sourceTaskId) throw new Error("KIE did not return a taskId");
await waitForSuccess(sourceTaskId);
```

Segment-map consumes that source task. After polling the segment task to
`success`, select an index of 1 or greater from its `segments` output and
pass it to image-edit using Kie's upstream `mask_indexs` spelling:

```typescript
const segmentTask = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine-image-2-0/segment-map",
  input: { task_id: sourceTaskId },
});
const segmentTaskId = segmentTask.data?.taskId;
if (!segmentTaskId) throw new Error("KIE did not return a taskId");

const segmentResultJson = await waitForSuccess(segmentTaskId);
const segmentResult = JSON.parse(segmentResultJson) as {
  resultObject?: { segments?: Array<{ index: number }> };
};
const maskIndex = segmentResult.resultObject?.segments?.find(
  ({ index }) => index >= 1,
)?.index;
if (maskIndex === undefined) throw new Error("No editable segment");

const editTask = await kie.post.api.v1.jobs.createTask({
  model: "grok-imagine-image-2-0/image-edit",
  input: {
    prompt: "Give the cat a red bow tie",
    task_id: sourceTaskId,
    mask_indexs: [maskIndex],
  },
});
console.log(editTask.data?.taskId);
```

## API Reference

57 endpoints across 29 groups. Each method mirrors an upstream URL path.

### chat

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.chat.credit</code></b></summary>

<code>GET https://api.kie.ai/api/v1/chat/credit</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/common-api/get-account-credits)

```typescript
const res = await kie.get.api.v1.chat.credit({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### claude

<details>
<summary><code>POST</code> <b><code>kie.claude.post.v1.messages</code></b></summary>

<code>POST https://api.kie.ai/claude/v1/messages</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/claude/claude-sonnet-4-6)

```typescript
const res = await kie.claude.post.v1.messages({ /* ... */ });
```

Source: [`packages/provider/kie/src/claude.ts`](src/claude.ts)

</details>

### codex

<details>
<summary><code>POST</code> <b><code>kie.codex.v1.responses</code></b></summary>

<code>POST https://api.kie.ai/codex/v1/responses</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/chat/gpt-5-5)

```typescript
const res = await kie.codex.v1.responses({ /* ... */ });
```

Source: [`packages/provider/kie/src/responses.ts`](src/responses.ts)

</details>

### flux

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.flux.kontext.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/flux/kontext/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/flux-kontext-api/get-image-details)

```typescript
const res = await kie.get.api.v1.flux.kontext.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### gemini

<details>
<summary><code>POST</code> <b><code>kie.gemini.post.v1.models.gemini35Flash.streamGenerateContent</code></b></summary>

<code>POST https://api.kie.ai/gemini/v1/models/gemini-3-5-flash:streamGenerateContent</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-5-flash)

```typescript
const res = await kie.gemini.post.v1.models.gemini35Flash.streamGenerateContent({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini.ts`](src/gemini.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.gemini.post.v1.models.gemini36Flash.streamGenerateContent</code></b></summary>

<code>POST https://api.kie.ai/gemini/v1/models/gemini-3-6-flash:streamGenerateContent</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-6-flash)

```typescript
const res = await kie.gemini.post.v1.models.gemini36Flash.streamGenerateContent({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini.ts`](src/gemini.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.gemini.post.v1.models.gemini3FlashV1betamodels.streamGenerateContent</code></b></summary>

<code>POST https://api.kie.ai/gemini/v1/models/gemini-3-flash-v1betamodels:streamGenerateContent</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-flash-v1beta)

```typescript
const res = await kie.gemini.post.v1.models.gemini3FlashV1betamodels.streamGenerateContent({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini.ts`](src/gemini.ts)

</details>

### gemini25Flash

<details>
<summary><code>POST</code> <b><code>kie.gemini25Flash.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-2.5-flash/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-2-5-flash)

```typescript
const res = await kie.gemini25Flash.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-25-flash.ts`](src/gemini-25-flash.ts)

</details>

### gemini25Pro

<details>
<summary><code>POST</code> <b><code>kie.gemini25Pro.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-2.5-pro/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-2-5-pro)

```typescript
const res = await kie.gemini25Pro.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-25-pro.ts`](src/gemini-25-pro.ts)

</details>

### gemini31Pro

<details>
<summary><code>POST</code> <b><code>kie.gemini31Pro.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-3.1-pro/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-1-pro)

```typescript
const res = await kie.gemini31Pro.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-31-pro.ts`](src/gemini-31-pro.ts)

</details>

### gemini35FlashOpenai

<details>
<summary><code>POST</code> <b><code>kie.gemini35FlashOpenai.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-3-5-flash-openai/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-5-flash-openai)

```typescript
const res = await kie.gemini35FlashOpenai.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-35-flash-openai.ts`](src/gemini-35-flash-openai.ts)

</details>

### gemini36FlashOpenai

<details>
<summary><code>POST</code> <b><code>kie.gemini36FlashOpenai.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-3-6-flash-openai/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-6-flash-openai)

```typescript
const res = await kie.gemini36FlashOpenai.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-36-flash-openai.ts`](src/gemini-36-flash-openai.ts)

</details>

### gemini37FlashOpenai

<details>
<summary><code>POST</code> <b><code>kie.gemini37FlashOpenai.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-3-7-flash-openai/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-7-flash-openai)

```typescript
const res = await kie.gemini37FlashOpenai.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-37-flash-openai.ts`](src/gemini-37-flash-openai.ts)

</details>

### gemini3Flash

<details>
<summary><code>POST</code> <b><code>kie.gemini3Flash.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-3-flash/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-flash)

```typescript
const res = await kie.gemini3Flash.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-3-flash.ts`](src/gemini-3-flash.ts)

</details>

### gemini3Pro

<details>
<summary><code>POST</code> <b><code>kie.gemini3Pro.post.v1.chat.completions</code></b></summary>

<code>POST https://api.kie.ai/gemini-3-pro/v1/chat/completions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini/gemini-3-pro)

```typescript
const res = await kie.gemini3Pro.post.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/kie/src/gemini-3-pro.ts`](src/gemini-3-pro.ts)

</details>

### generate

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.generate.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/generate/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.get.api.v1.generate.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-music)

```typescript
const res = await kie.suno.post.api.v1.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.addInstrumental</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/add-instrumental</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/add-instrumental)

```typescript
const res = await kie.suno.post.api.v1.generate.addInstrumental({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.addVocals</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/add-vocals</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/add-vocals)

```typescript
const res = await kie.suno.post.api.v1.generate.addVocals({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.extend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/extend</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.generate.extend({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.generatePersona</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/generate-persona</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-persona)

```typescript
const res = await kie.suno.post.api.v1.generate.generatePersona({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.getTimestampedLyrics</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/get-timestamped-lyrics</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-timestamped-lyrics)

```typescript
const res = await kie.suno.post.api.v1.generate.getTimestampedLyrics({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.mashup</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/mashup</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-mashup)

```typescript
const res = await kie.suno.post.api.v1.generate.mashup({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.replaceSection</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/replace-section</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/replace-section)

```typescript
const res = await kie.suno.post.api.v1.generate.replaceSection({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.sounds</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/sounds</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-sounds)

```typescript
const res = await kie.suno.post.api.v1.generate.sounds({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.uploadCover</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/upload-cover</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.generate.uploadCover({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.uploadExtend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/upload-extend</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.generate.uploadExtend({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### gpt4oImage

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.gpt4oImage.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/4o-image-api/get-4-o-image-details)

```typescript
const res = await kie.get.api.v1.gpt4oImage.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### grok

<details>
<summary><code>POST</code> <b><code>kie.grok.v1.responses</code></b></summary>

<code>POST https://api.kie.ai/grok/v1/responses</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/grok/grok-4-6)

```typescript
const res = await kie.grok.v1.responses({ /* ... */ });
```

Source: [`packages/provider/kie/src/responses.ts`](src/responses.ts)

</details>

### jobs

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.jobs.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/common/get-task-detail)

```typescript
const res = await kie.get.api.v1.jobs.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### lyrics

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.lyrics.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/lyrics/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-lyrics-details)

```typescript
const res = await kie.suno.get.api.v1.lyrics.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.lyrics</code></b></summary>

<code>POST https://api.kie.ai/api/v1/lyrics</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.lyrics({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### midi

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.midi.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/midi/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-midi-details)

```typescript
const res = await kie.suno.get.api.v1.midi.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.midi.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/midi/generate</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.midi.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### mj

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.mj.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/mj/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/mj-api/get-mj-task-details)

```typescript
const res = await kie.get.api.v1.mj.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### mp4

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.mp4.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/mp4/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-music-video-details)

```typescript
const res = await kie.suno.get.api.v1.mp4.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.mp4.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/mp4/generate</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.mp4.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### responses

<details>
<summary><code>POST</code> <b><code>kie.api.v1.responses</code></b></summary>

<code>POST https://api.kie.ai/api/v1/responses</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/market/codex/gpt-codex)

```typescript
const res = await kie.api.v1.responses({ /* ... */ });
```

Source: [`packages/provider/kie/src/responses.ts`](src/responses.ts)

</details>

### runway

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.runway.recordDetail</code></b></summary>

<code>GET https://api.kie.ai/api/v1/runway/record-detail?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/runway-api/get-ai-video-details)

```typescript
const res = await kie.get.api.v1.runway.recordDetail({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### style

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.style.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/style/generate</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.style.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### suno

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.suno.cover.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/suno/cover/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-cover-suno-details)

```typescript
const res = await kie.suno.get.api.v1.suno.cover.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.suno.cover.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/suno/cover/generate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/cover-suno)

```typescript
const res = await kie.suno.post.api.v1.suno.cover.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### veo

<details>
<summary><code>GET</code> <b><code>kie.veo.get.api.v1.veo.get1080pVideo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/veo/get-1080p-video?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/get-veo-3-1080-p-video)

```typescript
const res = await kie.veo.get.api.v1.veo.get1080pVideo({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

<details>
<summary><code>GET</code> <b><code>kie.veo.get.api.v1.veo.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/veo/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/get-veo-3-video-details)

```typescript
const res = await kie.veo.get.api.v1.veo.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.veo.post.api.v1.veo.extend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/extend</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/extend-video)

```typescript
const res = await kie.veo.post.api.v1.veo.extend({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.veo.post.api.v1.veo.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/generate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/generate-veo-3-video)

```typescript
const res = await kie.veo.post.api.v1.veo.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.veo.post.api.v1.veo.get4kVideo</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/get-4k-video</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/get-veo-3-4k-video)

```typescript
const res = await kie.veo.post.api.v1.veo.get4kVideo({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

### vocalRemoval

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.vocalRemoval.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/vocal-removal/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-vocal-separation-details)

```typescript
const res = await kie.suno.get.api.v1.vocalRemoval.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.vocalRemoval.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/vocal-removal/generate</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.vocalRemoval.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### voice

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.voice.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/voice/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/suno-voice-record-info)

```typescript
const res = await kie.suno.get.api.v1.voice.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.voice.validateInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/voice/validate-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/suno-voice-validate-info)

```typescript
const res = await kie.suno.get.api.v1.voice.validateInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.voice.checkVoice</code></b></summary>

<code>POST https://api.kie.ai/api/v1/voice/check-voice</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/suno-voice-check-voice)

```typescript
const res = await kie.suno.post.api.v1.voice.checkVoice({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.voice.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/voice/generate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/suno-voice-generate)

```typescript
const res = await kie.suno.post.api.v1.voice.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.voice.regenerate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/voice/regenerate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/suno-voice-regenerate)

```typescript
const res = await kie.suno.post.api.v1.voice.regenerate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.voice.validate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/voice/validate</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/suno-voice-validate)

```typescript
const res = await kie.suno.post.api.v1.voice.validate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### wav

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.wav.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/wav/record-info?taskId={taskId}</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/get-wav-details)

```typescript
const res = await kie.suno.get.api.v1.wav.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.wav.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/wav/generate</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await kie.suno.post.api.v1.wav.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

## Middleware

```typescript
import { createKie, withRetry } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
const models = withRetry(kie.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
