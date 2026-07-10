# @apicity/xai

[![npm](https://img.shields.io/npm/v/@apicity/xai?color=cb0000)](https://www.npmjs.com/package/@apicity/xai)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

X.AI / Grok provider for chat and search.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/xai
# or
pnpm add @apicity/xai
```

## Quick Start

```typescript
import { createXai } from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
```

## Real-world example: structured vision analysis with Grok-4

Hand Grok-4 a portrait, a system prompt that nails down the output schema,
and `text.format.type: "json_object"` — get back a reproduction-ready
JSON description with deterministic shot/pose vocabulary. The flow below
is taken verbatim from
[`tests/integration/xai-vision-json.test.ts`](../../../tests/integration/xai-vision-json.test.ts)
and replays against
[`tests/recordings/xai_3613880225/vision-analysis-json_243984103/recording.har`](../../../tests/recordings/xai_3613880225/vision-analysis-json_243984103/recording.har),
so the response shapes match what xAI actually returns.

```typescript
import { readFile } from "node:fs/promises";
import { createXai } from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });

// 1. Load the image and inline it as a data URL. xAI also accepts
//    https:// URLs, but inlining keeps the call self-contained and
//    works against private hosts.
const image = await readFile("./portrait.jpg");
const base64 = image.toString("base64");

// 2. The system prompt enumerates the legal vocabulary for `shot` and
//    constrains `pose` to body geometry only. Combined with
//    `text.format.type: "json_object"` this gives Grok no room to drift
//    off-schema — temperature 0 keeps the result reproducible.
const SYSTEM_PROMPT = [
  "You are an expert image-to-prompt analyst.",
  "Return only a JSON object with keys prompt, shot, and pose.",
  "prompt: a single-paragraph reproduction-ready image prompt, 1900 characters or fewer, with no line breaks.",
  'shot: exactly "<size>, <angle>" where size is one of extreme close-up, close-up, medium close-up, medium shot, medium long shot, long shot, or extreme long shot, and angle is one of eye-level, low-angle, high-angle, overhead, or dutch.',
  "pose: only body geometry for human figures, with no clothing, hair, background, or lighting details.",
].join(" ");

// 3. Multimodal Responses request: system turn + a user turn whose
//    content is an array of `input_image` + `input_text` parts.
const result = await xai.post.v1.responses({
  model: "grok-4",
  input: [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${base64}`,
          detail: "high",
        },
        {
          type: "input_text",
          text: 'Analyze this image and produce a reproduction-ready JSON description with keys "prompt", "shot", and "pose".',
        },
      ],
    },
  ],
  text: { format: { type: "json_object" } },
  store: false,
  temperature: 0,
  max_output_tokens: 300,
});

// 4. The Responses API wraps output in a typed item array. Find the
//    assistant message, then the first `output_text` part inside it.
//    Discriminated unions narrow `item.type === "message"` so
//    `item.content` is statically typed.
const message = result.output.find((item) => item.type === "message");
const outputText =
  message?.type === "message"
    ? message.content.find((part) => part.type === "output_text")?.text
    : undefined;

if (!outputText) throw new Error("Grok did not return output_text");

const analysis = JSON.parse(outputText) as {
  prompt: string;
  shot: string;
  pose: string;
};

console.log(analysis.shot);
// → "medium close-up, eye-level"

console.log(analysis.pose);
// → "upright torso facing forward, head straight and centered, shoulders squared, arms relaxed downward (implied)"

// 5. Reasoning-token accounting. Grok-4 spent 623 of its 728 output
//    tokens reasoning before emitting the 105-token JSON answer —
//    surfaced in `usage.output_tokens_details.reasoning_tokens`.
console.log(result.usage);
// → {
//     input_tokens: 2684,
//     input_tokens_details: { cached_tokens: 679 },
//     output_tokens: 728,
//     output_tokens_details: { reasoning_tokens: 623 },
//     total_tokens: 3412,
//   }
```

**Notes**

- `store: false` keeps the response off xAI's history surface. Flip to
  `true` to chain follow-ups via `previous_response_id` — useful for
  multi-turn refinement ("now describe the wardrobe") without re-uploading
  the image each time.
- The Responses output array also carries reasoning items and tool calls
  when present. Always discriminate on `item.type` before reading content;
  TypeScript's narrowing keeps you honest.
- For raw chat-style usage without the Responses wrapping, use
  `xai.post.v1.chat.completions` instead — same auth, same model catalog,
  just OpenAI-compatible request/response shapes.
- Errors surface as `XaiError` with `status` and the parsed body attached,
  so `try { ... } catch (e) { if (e instanceof XaiError) ... }` gives you
  the upstream error directly.

## Imagine Files API integration

xAI Imagine image and video endpoints can reference private Files API
assets directly and can persist generated assets back to Files storage.

- Inputs: anywhere Imagine accepts a public URL or base64 image/video,
  pass a stored `file_id` instead. Apicity accepts the raw REST shape
  (`image: { file_id }`, `images: [{ file_id }]`,
  `video: { file_id }`, `reference_images: [{ file_id }]`) plus
  convenience aliases (`image_file_id`, `image_file_ids`,
  `video_file_id`, and `reference_image_file_ids`) that are normalized
  before the HTTP request.
- Outputs: pass `storage_options` with a required `filename` to persist
  the generated image or video. Omit `public_url` or set it to `false`
  for a private file; set `public_url: true` or
  `public_url: { expires_after: 86400 }` to create a shareable URL.
- Responses still include the default ephemeral `imgen.x.ai` or
  `vidgen.x.ai` generation URL. When storage is requested, the
  persistent Files metadata is returned as `file_output` on the
  generated image or completed video.

### Stored input field map

Use these fields when an image or video already lives in xAI Files
storage. Apicity normalizes the convenience aliases into the REST
`file_id` object shape before sending the request.

| Apicity call | Stored input field | Sent to xAI |
| --- | --- | --- |
| `xai.post.v1.images.edits` | `image_file_id` | `image: { file_id }` |
| `xai.post.v1.images.edits` | `image_file_ids` | `images: [{ file_id }]` |
| `xai.post.v1.videos.generations` | `image_file_id` | `image: { file_id }` |
| `xai.post.v1.videos.generations` | `reference_image_file_ids` | `reference_images: [{ file_id }]` |
| `xai.post.v1.videos.generations.imageToVideo` | `image_file_id` | `image: { file_id }` |
| `xai.post.v1.videos.edits` | `video_file_id` | `video: { file_id }` |
| `xai.post.v1.videos.extensions` | `video_file_id` | `video: { file_id }` |

You can also pass the raw REST fields directly. `images` and
`reference_images` entries can mix `{ file_id }` and `{ url }`
items in the same request, which is useful when only some references
are already private Files assets. Stored images must be PNG, JPEG,
or WebP; stored videos must be MP4; and the file upload must be
complete before it is referenced by an Imagine endpoint.

```typescript
const gen = await xai.post.v1.images.generations({
  prompt: "A futuristic city skyline at night",
  model: "grok-imagine-image-quality",
  storage_options: { filename: "city.jpg" },
});
const city = gen.data[0].file_output!.file_id!;

const edit = await xai.post.v1.images.edits({
  prompt: "Add neon signs to the buildings",
  model: "grok-imagine-image-quality",
  image_file_id: city,
  storage_options: { filename: "city-neon.jpg" },
});
const neonCity = edit.data[0].file_output!.file_id!;

const video = await xai.post.v1.videos.generations({
  prompt: "A camera pulls back through the city",
  model: "grok-imagine-video",
  duration: 5,
  image_file_id: neonCity,
  storage_options: {
    filename: "city-loop.mp4",
    public_url: true,
  },
});

const done = await xai.get.v1.videos(video.request_id);
console.log(done.video?.url);
console.log(done.video?.file_output?.public_url);
```

See xAI's
[Imagine Files API integration](https://docs.x.ai/developers/model-capabilities/imagine/files),
[Referencing Files as Input](https://docs.x.ai/developers/model-capabilities/imagine/files/inputs),
[Persisting Generated Output](https://docs.x.ai/developers/model-capabilities/imagine/files/outputs),
[Managing Files](https://docs.x.ai/developers/files/managing-files),
and [Files Public URLs](https://docs.x.ai/developers/files/public-urls)
docs for uploads, expiration, and public URL lifecycle details.

## Files Public URLs

Files uploaded to xAI storage are private by default. Use
`xai.post.v1.files.publicUrl(fileId)` to create a shareable
xAI CDN URL for an existing file, then revoke that URL independently
with `xai.post.v1.files.publicUrl.revoke(fileId)` when sharing
should stop. Revoking the public URL leaves the private file intact.

```typescript
const file = await xai.post.v1.files(
  new Blob(["diagram"], { type: "image/png" }),
  "diagram.png",
  "assistants"
);

const created = await xai.post.v1.files.publicUrl(file.id, {
  expires_after: 86400,
});
console.log(created.public_url);
console.log(created.expires_at);

const withPublicUrls = await xai.get.v1.files({
  filter: "public_url != null",
});
console.log(withPublicUrls.data[0]?.public_url);

await xai.post.v1.files.publicUrl.revoke(file.id);
```

**Public URL lifecycle**

- Empty create bodies use xAI defaults. Pass `expires_after` in seconds
  to auto-revoke the URL after 1 hour to 30 days.
- A public URL cannot outlive its file. If the file has its own
  `expires_at`, an omitted public URL expiry inherits the file expiry;
  an explicit `expires_after` must fit inside the file's remaining
  lifetime.
- Create is idempotent while a file already has an active public URL:
  repeated calls return the same URL token and can update its expiry.
- `get.v1.files(fileId)` and `get.v1.files({ filter })` preserve
  `public_url` and `public_url_expires_at` metadata so callers can
  audit which files are currently public.

See xAI's
[Files Public URLs](https://docs.x.ai/developers/files/public-urls),
[Managing Files](https://docs.x.ai/developers/files/managing-files),
and [Imagine Files API integration](https://docs.x.ai/developers/model-capabilities/imagine/files)
docs for supported content types, size limits, and the
`storage_options.public_url` generation path.

## API Reference

54 endpoints across 18 groups. Each method mirrors an upstream URL path.

### apiKey

<details>
<summary><code>GET</code> <b><code>xai.v1.apiKey</code></b></summary>

<code>GET https://api.x.ai/v1/api-key</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/inference/other)

```typescript
const res = await xai.v1.apiKey({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### batches

<details>
<summary><code>GET</code> <b><code>xai.v1.batches</code></b></summary>

<code>GET https://api.x.ai/v1/batches/{paramsOrIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.batches.requests</code></b></summary>

<code>GET https://api.x.ai/v1/batches/{batchId}/requests{query}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.requests({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.batches.results</code></b></summary>

<code>GET https://api.x.ai/v1/batches/{batchId}/results{query}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.results({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.batches</code></b></summary>

<code>POST https://api.x.ai/v1/batches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.batches.cancel</code></b></summary>

<code>POST https://api.x.ai/v1/batches/{batchId}:cancel</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.cancel({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.batches.requests</code></b></summary>

<code>POST https://api.x.ai/v1/batches/{batchId}/requests</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.batches.requests({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### chat

<details>
<summary><code>GET</code> <b><code>xai.v1.chat.deferredCompletion</code></b></summary>

<code>GET https://api.x.ai/v1/chat/deferred-completion/{requestId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.chat.deferredCompletion({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.chat.completions</code></b></summary>

<code>POST https://api.x.ai/v1/chat/completions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### customVoices

<details>
<summary><code>DELETE</code> <b><code>xai.v1.customVoices</code></b></summary>

<code>DELETE https://api.x.ai/v1/custom-voices/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/model-capabilities/audio/custom-voices)

```typescript
const res = await xai.v1.customVoices({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.customVoices</code></b></summary>

<code>GET https://api.x.ai/v1/custom-voices/{paramsOrVoiceIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/model-capabilities/audio/custom-voices)

```typescript
const res = await xai.v1.customVoices({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.customVoices.audio</code></b></summary>

<code>GET https://api.x.ai/v1/custom-voices/{voiceId}/audio</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/model-capabilities/audio/custom-voices)

```typescript
const res = await xai.v1.customVoices.audio({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>xai.v1.customVoices</code></b></summary>

<code>PATCH https://api.x.ai/v1/custom-voices/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/model-capabilities/audio/custom-voices)

```typescript
const res = await xai.v1.customVoices({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.customVoices</code></b></summary>

<code>POST https://api.x.ai/v1/custom-voices</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/model-capabilities/audio/custom-voices)

```typescript
const res = await xai.v1.customVoices({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### documents

<details>
<summary><code>POST</code> <b><code>xai.v1.documents.search</code></b></summary>

<code>POST https://api.x.ai/v1/documents/search</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.documents.search({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### files

<details>
<summary><code>DELETE</code> <b><code>xai.v1.files</code></b></summary>

<code>DELETE https://api.x.ai/v1/files/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.files</code></b></summary>

<code>GET https://api.x.ai/v1/files/{paramsOrFileIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.files.content</code></b></summary>

<code>GET https://api.x.ai/v1/files/{fileId}/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files.content({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.files</code></b></summary>

<code>POST https://api.x.ai/v1/files</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.files({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.files.publicUrl</code></b></summary>

<code>POST https://api.x.ai/v1/files/{fileId}/public-url</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/files/public-urls)

```typescript
const res = await xai.v1.files.publicUrl({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.files.publicUrl.revoke</code></b></summary>

<code>POST https://api.x.ai/v1/files/{fileId}/public-url/revoke</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/files/public-urls)

```typescript
const res = await xai.v1.files.publicUrl.revoke({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### imageGenerationModels

<details>
<summary><code>GET</code> <b><code>xai.v1.imageGenerationModels</code></b></summary>

<code>GET https://api.x.ai/v1/image-generation-models/{modelIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.imageGenerationModels({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### images

<details>
<summary><code>POST</code> <b><code>xai.v1.images.edits</code></b></summary>

<code>POST https://api.x.ai/v1/images/edits</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/inference/images)

```typescript
const res = await xai.v1.images.edits({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.images.generations</code></b></summary>

<code>POST https://api.x.ai/v1/images/generations</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/inference/images)

```typescript
const res = await xai.v1.images.generations({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### languageModels

<details>
<summary><code>GET</code> <b><code>xai.v1.languageModels</code></b></summary>

<code>GET https://api.x.ai/v1/language-models/{modelIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.languageModels({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### managementApi

<details>
<summary><code>DELETE</code> <b><code>xai.managementApi.v1.collections</code></b></summary>

<code>DELETE https://management-api.x.ai/v1/collections/{collectionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>xai.managementApi.v1.collections.documents</code></b></summary>

<code>DELETE https://management-api.x.ai/v1/collections/{collectionId}/documents/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.auth.teams.apiKeys</code></b></summary>

<code>GET https://management-api.x.ai/auth/teams/{teamId}/api-keys{query}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/management/auth)

```typescript
const res = await xai.managementApi.auth.teams.apiKeys({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.v1.billing.teams.postpaid.invoice.preview</code></b></summary>

<code>GET https://management-api.x.ai/v1/billing/teams/{teamId}/postpaid/invoice/preview</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/management/billing)

```typescript
const res = await xai.managementApi.v1.billing.teams.postpaid.invoice.preview({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.v1.billing.teams.postpaid.spendingLimits</code></b></summary>

<code>GET https://management-api.x.ai/v1/billing/teams/{teamId}/postpaid/spending-limits</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/management/billing)

```typescript
const res = await xai.managementApi.v1.billing.teams.postpaid.spendingLimits({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.v1.billing.teams.prepaid.balance</code></b></summary>

<code>GET https://management-api.x.ai/v1/billing/teams/{teamId}/prepaid/balance</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/management/billing)

```typescript
const res = await xai.managementApi.v1.billing.teams.prepaid.balance({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.v1.collections</code></b></summary>

<code>GET https://management-api.x.ai/v1/collections/{paramsOrIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.v1.collections.documents</code></b></summary>

<code>GET https://management-api.x.ai/v1/collections/{collectionId}/documents/{paramsOrFileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.managementApi.v1.collections.documents.batchGet</code></b></summary>

<code>GET https://management-api.x.ai/v1/collections/{collectionId}/documents:batchGet{query}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections.documents.batchGet({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>xai.managementApi.v1.collections.documents</code></b></summary>

<code>PATCH https://management-api.x.ai/v1/collections/{collectionId}/documents/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.managementApi.v1.billing.teams.usage</code></b></summary>

<code>POST https://management-api.x.ai/v1/billing/teams/{teamId}/usage</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/developers/rest-api-reference/management/billing)

```typescript
const res = await xai.managementApi.v1.billing.teams.usage({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.managementApi.v1.collections</code></b></summary>

<code>POST https://management-api.x.ai/v1/collections</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.managementApi.v1.collections.documents</code></b></summary>

<code>POST https://management-api.x.ai/v1/collections/{collectionId}/documents/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections.documents({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>xai.managementApi.v1.collections</code></b></summary>

<code>PUT https://management-api.x.ai/v1/collections/{collectionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.managementApi.v1.collections({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>xai.v1.models</code></b></summary>

<code>GET https://api.x.ai/v1/models/{modelIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.models({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### realtime

<details>
<summary><code>POST</code> <b><code>xai.v1.realtime.clientSecrets</code></b></summary>

<code>POST https://api.x.ai/v1/realtime/client_secrets</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.realtime.clientSecrets({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### responses

<details>
<summary><code>DELETE</code> <b><code>xai.v1.responses</code></b></summary>

<code>DELETE https://api.x.ai/v1/responses/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>xai.v1.responses</code></b></summary>

<code>GET https://api.x.ai/v1/responses/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.responses</code></b></summary>

<code>POST https://api.x.ai/v1/responses</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.responses.compact</code></b></summary>

<code>POST https://api.x.ai/v1/responses/compact</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.responses.compact({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### stt

<details>
<summary><code>POST</code> <b><code>xai.v1.stt</code></b></summary>

<code>POST https://api.x.ai/v1/stt</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.stt({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### tokenizeText

<details>
<summary><code>POST</code> <b><code>xai.v1.tokenizeText</code></b></summary>

<code>POST https://api.x.ai/v1/tokenize-text</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.tokenizeText({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### tts

<details>
<summary><code>POST</code> <b><code>xai.v1.tts</code></b></summary>

<code>POST https://api.x.ai/v1/tts</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.tts({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### videoGenerationModels

<details>
<summary><code>GET</code> <b><code>xai.v1.videoGenerationModels</code></b></summary>

<code>GET https://api.x.ai/v1/video-generation-models/{modelIdOrSignal}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videoGenerationModels({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

### videos

<details>
<summary><code>GET</code> <b><code>xai.v1.videos</code></b></summary>

<code>GET https://api.x.ai/v1/videos/{requestId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.edits</code></b></summary>

<code>POST https://api.x.ai/v1/videos/edits</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos.edits({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.extensions</code></b></summary>

<code>POST https://api.x.ai/v1/videos/extensions</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos.extensions({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.generations</code></b></summary>

<code>POST https://api.x.ai/v1/videos/generations</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.x.ai/docs/api-reference)

```typescript
const res = await xai.v1.videos.generations({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>xai.v1.videos.generations.imageToVideo</code></b></summary>

<code>POST https://api.x.ai/v1/videos/generations</code>

Cost tier: <code>prohibitive</code>

[Upstream docs ↗](https://docs.x.ai/developers/model-capabilities/video/image-to-video)

```typescript
const res = await xai.v1.videos.generations.imageToVideo({ /* ... */ });
```

Source: [`packages/provider/xai/src/xai.ts`](src/xai.ts)

</details>

## Middleware

```typescript
import { createXai, withRetry } from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
const models = withRetry(xai.get.v1.models, { retries: 3 });
```

## Rate Limiting

Client-side rate limiting that queues requests to stay within xAI API limits.

```typescript
import {
  createXai,
  withRateLimit,
  withRetry,
  createRateLimiter,
  XAI_RATE_LIMITS,
} from "@apicity/xai";

const xai = createXai({ apiKey: process.env.XAI_API_KEY! });
```

### Using xAI tier presets

```typescript
// Use built-in tier presets (free, tier1, tier2, tier3, tier4)
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);
// => { rpm: 60, concurrent: 10 }

const chat = withRateLimit(xai.post.v1.chat.completions, limiter);
```

### Custom limits

```typescript
const limiter = createRateLimiter({ rpm: 30, concurrent: 5 });
const chat = withRateLimit(xai.post.v1.chat.completions, limiter);
```

### Shared limiter across endpoints

RPM limits apply globally, so share a single limiter across all endpoints:

```typescript
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier2);

const chat = withRateLimit(xai.post.v1.chat.completions, limiter);
const responses = withRateLimit(xai.post.v1.responses, limiter);
const images = withRateLimit(xai.post.v1.images.generations, limiter);
```

### Composing with retry

Place `withRateLimit` innermost so retries count against the limit:

```typescript
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);

const chat = withRetry(
  withRateLimit(xai.post.v1.chat.completions, limiter),
  { retries: 2 }
);
```

### Batch processing

Fire requests in parallel — the limiter handles pacing automatically:

```typescript
const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);
const chat = withRateLimit(xai.post.v1.chat.completions, limiter);

const results = await Promise.all(
  prompts.map((p) =>
    chat({
      model: "grok-3",
      messages: [{ role: "user", content: p }],
    })
  )
);
```

### xAI rate limit tiers

| Preset | RPM | Concurrent | Spend threshold |
|--------|-----|------------|-----------------|
| `free` | 5 | 2 | $0 |
| `tier1` | 60 | 10 | $0+ |
| `tier2` | 200 | 25 | $100+ |
| `tier3` | 500 | 50 | $500+ |
| `tier4` | 1000 | 100 | $1,000+ |

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
