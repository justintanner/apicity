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
import { createKie } from "@apicity/kie";

const kie = createKie({ apiKey: process.env.KIE_API_KEY! });
```

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

## API Reference

27 endpoints across 16 groups. Each method mirrors an upstream URL path.

### chat

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.chat.credit</code></b></summary>

<code>GET https://api.kie.ai/api/v1/chat/credit</code>

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

[Upstream docs ↗](https://docs.kie.ai/market/claude/claude-sonnet-4-6)

```typescript
const res = await kie.claude.post.v1.messages({ /* ... */ });
```

Source: [`packages/provider/kie/src/claude.ts`](src/claude.ts)

</details>

### common

<details>
<summary><code>POST</code> <b><code>kie.post.api.v1.common.downloadUrl</code></b></summary>

<code>POST https://api.kie.ai/api/v1/common/download-url</code>

[Upstream docs ↗](https://docs.kie.ai/common-api/download-url)

```typescript
const res = await kie.post.api.v1.common.downloadUrl({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### fileBase64Upload

<details>
<summary><code>POST</code> <b><code>kie.post.api.fileBase64Upload</code></b></summary>

<code>POST https://api.kie.ai/api/file-base64-upload</code>

[Upstream docs ↗](https://docs.kie.ai/file-upload-api/upload-file-base-64)

```typescript
const res = await kie.post.api.fileBase64Upload({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### fileStreamUpload

<details>
<summary><code>POST</code> <b><code>kie.post.api.fileStreamUpload</code></b></summary>

<code>POST https://api.kie.ai/api/file-stream-upload</code>

[Upstream docs ↗](https://docs.kie.ai/file-upload-api/upload-file-stream)

```typescript
const res = await kie.post.api.fileStreamUpload({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### fileUrlUpload

<details>
<summary><code>POST</code> <b><code>kie.post.api.fileUrlUpload</code></b></summary>

<code>POST https://api.kie.ai/api/file-url-upload</code>

[Upstream docs ↗](https://docs.kie.ai/file-upload-api/upload-file-url)

```typescript
const res = await kie.post.api.fileUrlUpload({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### generate

<details>
<summary><code>GET</code> <b><code>kie.suno.get.api.v1.generate.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/generate/record-info?taskId={taskId}</code>

```typescript
const res = await kie.suno.get.api.v1.generate.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-music)

```typescript
const res = await kie.suno.post.api.v1.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.addInstrumental</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/add-instrumental</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/add-instrumental)

```typescript
const res = await kie.suno.post.api.v1.generate.addInstrumental({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.addVocals</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/add-vocals</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/add-vocals)

```typescript
const res = await kie.suno.post.api.v1.generate.addVocals({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.extend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/extend</code>

```typescript
const res = await kie.suno.post.api.v1.generate.extend({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.mashup</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/mashup</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-mashup)

```typescript
const res = await kie.suno.post.api.v1.generate.mashup({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.replaceSection</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/replace-section</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/replace-section)

```typescript
const res = await kie.suno.post.api.v1.generate.replaceSection({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.sounds</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/sounds</code>

[Upstream docs ↗](https://docs.kie.ai/suno-api/generate-sounds)

```typescript
const res = await kie.suno.post.api.v1.generate.sounds({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.uploadCover</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/upload-cover</code>

```typescript
const res = await kie.suno.post.api.v1.generate.uploadCover({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.generate.uploadExtend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/generate/upload-extend</code>

```typescript
const res = await kie.suno.post.api.v1.generate.uploadExtend({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### jobs

<details>
<summary><code>GET</code> <b><code>kie.get.api.v1.jobs.recordInfo</code></b></summary>

<code>GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}</code>

[Upstream docs ↗](https://docs.kie.ai/market/common/get-task-detail)

```typescript
const res = await kie.get.api.v1.jobs.recordInfo({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.post.api.v1.jobs.createTask</code></b></summary>

<code>POST https://api.kie.ai/api/v1/jobs/createTask</code>

[Upstream docs ↗](https://docs.kie.ai/market/quickstart)

```typescript
const res = await kie.post.api.v1.jobs.createTask({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### lyrics

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.lyrics</code></b></summary>

<code>POST https://api.kie.ai/api/v1/lyrics</code>

```typescript
const res = await kie.suno.post.api.v1.lyrics({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### midi

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.midi.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/midi/generate</code>

```typescript
const res = await kie.suno.post.api.v1.midi.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### mp4

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.mp4.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/mp4/generate</code>

```typescript
const res = await kie.suno.post.api.v1.mp4.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### omni

<details>
<summary><code>POST</code> <b><code>kie.post.api.v1.omni.audio.create</code></b></summary>

<code>POST https://api.kie.ai/api/v1/omni/audio/create</code>

[Upstream docs ↗](https://docs.kie.ai/market/gemini-omni-audio)

```typescript
const res = await kie.post.api.v1.omni.audio.create({ /* ... */ });
```

Source: [`packages/provider/kie/src/kie.ts`](src/kie.ts)

</details>

### style

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.style.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/style/generate</code>

```typescript
const res = await kie.suno.post.api.v1.style.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### veo

<details>
<summary><code>POST</code> <b><code>kie.veo.post.api.v1.veo.extend</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/extend</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/extend-video)

```typescript
const res = await kie.veo.post.api.v1.veo.extend({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kie.veo.post.api.v1.veo.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/veo/generate</code>

[Upstream docs ↗](https://docs.kie.ai/veo3-api/generate-veo-3-video)

```typescript
const res = await kie.veo.post.api.v1.veo.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/veo.ts`](src/veo.ts)

</details>

### vocalRemoval

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.vocalRemoval.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/vocal-removal/generate</code>

```typescript
const res = await kie.suno.post.api.v1.vocalRemoval.generate({ /* ... */ });
```

Source: [`packages/provider/kie/src/suno.ts`](src/suno.ts)

</details>

### wav

<details>
<summary><code>POST</code> <b><code>kie.suno.post.api.v1.wav.generate</code></b></summary>

<code>POST https://api.kie.ai/api/v1/wav/generate</code>

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
