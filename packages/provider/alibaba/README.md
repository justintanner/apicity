# @apicity/alibaba

[![npm](https://img.shields.io/npm/v/@apicity/alibaba?color=cb0000)](https://www.npmjs.com/package/@apicity/alibaba)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Alibaba Cloud Model Studio provider for chat completions, image generation, and streaming.

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

## Real-world example: Wan 2.7 image-to-video with async task polling

DashScope's `aigc/*` family is async-by-default: every video, image, and
audio generation endpoint returns immediately with a `task_id` and a
`task_status` of `PENDING`, and the actual artifact lives behind a
separate `GET /api/v1/tasks/{taskId}` you poll until it transitions to
`SUCCEEDED`. The provider hides the `X-DashScope-Async: enable` header
plumbing but keeps the two-call shape visible because it lets you
checkpoint the `task_id`, walk away, and resume later from any process.
The example below mines every `task_id`, timestamp, prompt, and resolution
from
[`tests/recordings/alibaba_1329897167/wan-i2v_2196817451/`](../../../tests/recordings/alibaba_1329897167/wan-i2v_2196817451/),
which is the HAR replayed by
[`tests/integration/alibaba-wan-i2v.test.ts`](../../../tests/integration/alibaba-wan-i2v.test.ts).

```typescript
import { readFileSync } from "node:fs";
import { alibaba as createAlibaba, AlibabaError } from "@apicity/alibaba";
import type {
  AlibabaVideoSynthesisSubmitResponse,
  AlibabaTaskStatusResponse,
  AlibabaTaskStatus,
} from "@apicity/alibaba";

const alibaba = createAlibaba({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  // The SUCCEEDED-path round-trip in the recording is ~47s wall-clock;
  // bump the per-request timeout above the default 30s so the submit
  // call doesn't fight a slow scheduling spike.
  timeout: 60_000,
});

// 1. Inline the source frame as a `data:` URL. DashScope also accepts
//    https:// URLs and `oss://` URIs (the latter only when the request
//    carries `X-DashScope-OssResourceResolve: enable`, which the
//    provider sets automatically on every aigc/* call). Inlining is the
//    zero-infra path — no public bucket, no presigned URL — at the cost
//    of paying the upload bytes once per submit.
const frame = readFileSync("./cat.jpg");
const dataUrl = `data:image/jpeg;base64,${frame.toString("base64")}`;

// 2. `media[].type: "first_frame"` is the I2V kick-off — Wan animates
//    forward from the still. Other media types in the same array slot
//    drive different conditioning modes: `last_frame` (animate
//    backward), `first_clip` (continue a video), `reference` (style
//    transfer). The Zod schema enforces that `first_frame` cannot
//    coexist with `first_clip` and that exactly one of each type is
//    present — invalid combinations fail at `.schema.safeParse(...)`
//    before a single byte hits the wire.
//
// 3. `prompt_extend: true` runs the prompt through DashScope's
//    server-side prompt-enhancement model first, which materially
//    improves motion fidelity on terse prompts like the one below.
//    The enhanced prompt is echoed back in the SUCCEEDED response as
//    `actual_prompt` so you can audit what actually got rendered.
//    `watermark: false` removes the corner badge — silently ignored
//    on tiers that don't permit it.
const submit: AlibabaVideoSynthesisSubmitResponse =
  await alibaba.post.api.v1.services.aigc.videoGeneration.videoSynthesis({
    model: "wan2.7-i2v",
    input: {
      prompt:
        "The odd-eyed white cat blinks slowly, whiskers twitching, " +
        "then turns its head toward the camera",
      media: [{ type: "first_frame", url: dataUrl }],
    },
    parameters: {
      resolution: "720P",
      duration: 5,
      prompt_extend: true,
      watermark: false,
    },
  });

console.log(
  `task=${submit.output.task_id} status=${submit.output.task_status}`,
);
// → "task=5a674d6b-6a42-4b07-98bb-147ba79879ea status=PENDING"

// 4. Poll until terminal. The status state machine is
//    PENDING → RUNNING → (SUCCEEDED | FAILED | CANCELED), with
//    SUSPENDED as a transient quota-bound retry state. Treat anything
//    not in TERMINAL as "keep polling." A 5–10s interval matches the
//    server-side scheduling cadence — the recorded run did 8 polls
//    over ~47s, so faster polling just burns rate-limit budget without
//    moving the task forward.
const TERMINAL: ReadonlyArray<AlibabaTaskStatus> = [
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
];
let status: AlibabaTaskStatusResponse = await alibaba.get.api.v1.tasks(
  submit.output.task_id,
);
while (!TERMINAL.includes(status.output.task_status)) {
  await new Promise((r) => setTimeout(r, 5000));
  status = await alibaba.get.api.v1.tasks(submit.output.task_id);
}

// 5. The task-status response shape *grows* as the task progresses —
//    `submit_time` and `scheduled_time` appear once it leaves PENDING;
//    `end_time`, `orig_prompt`, `video_url`, and `usage` only land on
//    SUCCEEDED. `code` and `message` populate on FAILED. Always branch
//    on `task_status` before reading the success-only fields, since
//    they're typed `string | undefined`.
if (status.output.task_status !== "SUCCEEDED") {
  throw new AlibabaError(
    `i2v task ${status.output.task_id} ${status.output.task_status}: ` +
      `${status.output.code ?? "?"}: ${status.output.message ?? "?"}`,
    500,
    status.output,
    status.output.code,
  );
}

console.log(status.output.video_url);
// → "https://dashscope-a717.oss-accelerate.aliyuncs.com/.../70873660-metadata_user_a54afaea6b53dd4e.mp4?Expires=1776489167&..."

const elapsed =
  new Date(status.output.end_time!).getTime() -
  new Date(status.output.submit_time!).getTime();
console.log(
  `model=wan2.7-i2v ${status.usage!.SR}p×${status.usage!.output_video_duration}s ` +
    `elapsed=${(elapsed / 1000).toFixed(1)}s videos=${status.usage!.video_count}`,
);
// → "model=wan2.7-i2v 720p×5s elapsed=47.4s videos=1"
```

**Notes**

- The returned `video_url` is a presigned OSS URL with a short
  `Expires=` window (≈1 hour in the recording above) — download or
  re-host it immediately, don't store the URL itself. The bucket is
  hosted on `oss-accelerate.aliyuncs.com`, which fronts an Alibaba CDN
  that resolves close to the caller; no auth header is required for the
  GET.
- The submit call is *cheap* even when the task later FAILS — billing
  is only charged on SUCCEEDED tasks per `usage.duration` (seconds of
  output video). A failed content-safety screen (`code:
  "DataInspectionFailed"`) on the input frame returns a SUCCEEDED-shape
  HTTP 200 with `task_status: "FAILED"`, not a 4xx — this is why the
  example above always reads `task_status` rather than relying on
  exception flow for content-related rejects.
- The same `videoSynthesis` endpoint dispatches across the entire Wan
  2.7 family by changing `model`: `wan2.7-i2v` for image→video,
  `wan2.7-t2v` for text→video (drop the `media` array), and
  `wan2.7-videoedit` for video-style transfer (use `media[].type:
  "video"`). The Zod schema enforces the per-model media-type
  combinations — `videoedit` requires a `video` entry, `i2v` requires
  `first_frame` or `first_clip`, etc.
- For payloads where the input frame exceeds DashScope's 10MB
  embedded-data-URL ceiling, swap the inline `data:` URL for an
  `oss://{key}` URI obtained via `uploadFile(provider, {...})` — the
  exported helper does the `getPolicy` + multipart OSS PostObject
  dance and returns the URI ready to drop into `media[].url`. The
  `X-DashScope-OssResourceResolve` header is set automatically on
  every aigc/* call so the URI resolves server-side.
- Errors throw `AlibabaError` with `status` and the parsed `body`. The
  native aigc error shape (`{code, message, request_id}`) is surfaced
  in `error.code` — wrap with `withRetry` from `@apicity/alibaba` for
  `429` / `503`, but skip retries on `code === "DataInspectionFailed"`
  / `"InvalidParameter"` since those are deterministic rejects.

## API Reference

7 endpoints across 4 groups. Each method mirrors an upstream URL path.

### compatibleMode

<details>
<summary><code>GET</code> <b><code>alibaba.compatibleMode.v1.models</code></b></summary>

<code>GET https://dashscope.aliyuncs.com/compatible-mode/v1/models</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.compatibleMode.v1.models({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

<details>
<summary><code>POST</code> <b><code>alibaba.compatibleMode.v1.chat.completions</code></b></summary>

<code>POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.compatibleMode.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

### services

<details>
<summary><code>POST</code> <b><code>alibaba.api.v1.services.aigc.imageGeneration.generation</code></b></summary>

<code>POST https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation</code>

```typescript
const res = await alibaba.api.v1.services.aigc.imageGeneration.generation({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

<details>
<summary><code>POST</code> <b><code>alibaba.api.v1.services.aigc.multimodalGeneration.generation</code></b></summary>

<code>POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation</code>

[Upstream docs ↗](https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit)

```typescript
const res = await alibaba.api.v1.services.aigc.multimodalGeneration.generation({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

<details>
<summary><code>POST</code> <b><code>alibaba.api.v1.services.aigc.videoGeneration.videoSynthesis</code></b></summary>

<code>POST https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.api.v1.services.aigc.videoGeneration.videoSynthesis({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

### tasks

<details>
<summary><code>GET</code> <b><code>alibaba.api.v1.tasks</code></b></summary>

<code>GET https://dashscope.aliyuncs.com/api/v1/tasks/{taskId}</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.api.v1.tasks({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

### uploads

<details>
<summary><code>GET</code> <b><code>alibaba.api.v1.uploads</code></b></summary>

<code>GET https://dashscope.aliyuncs.com/api/v1/uploads</code>

[Upstream docs ↗](https://help.aliyun.com/zh/model-studio)

```typescript
const res = await alibaba.api.v1.uploads({ /* ... */ });
```

Source: [`packages/provider/alibaba/src/alibaba.ts`](src/alibaba.ts)

</details>

## Middleware

```typescript
import { alibaba as createAlibaba, withRetry } from "@apicity/alibaba";

const alibaba = createAlibaba({ apiKey: process.env.ALIBABA_API_KEY! });
const models = withRetry(alibaba.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
