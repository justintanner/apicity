# @apicity/elevenlabs

[![npm](https://img.shields.io/npm/v/@apicity/elevenlabs?color=cb0000)](https://www.npmjs.com/package/@apicity/elevenlabs)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

ElevenLabs provider for sound effect generation, text-to-speech, and audio APIs.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/elevenlabs
# or
pnpm add @apicity/elevenlabs
```

## Quick Start

```typescript
import { createElevenLabs } from "@apicity/elevenlabs";

const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY! });
```

## Real-world example: generate a sound effect, then run it through Scribe v2

ElevenLabs' two flagship audio surfaces fit together cleanly: text-to-
sound-effects spits out raw MP3 bytes, and Scribe v2 hands back a typed
transcript with word-level timestamps plus tagged audio events. The
round-trip below — generate a UI click, then transcribe a separate clip
with `tag_audio_events: true` — mirrors what
[`tests/integration/elevenlabs-sound-generation.test.ts`](../../../tests/integration/elevenlabs-sound-generation.test.ts)
and
[`tests/integration/elevenlabs-speech-to-text.test.ts`](../../../tests/integration/elevenlabs-speech-to-text.test.ts)
replay against
[`tests/recordings/elevenlabs_2379486140/`](../../../tests/recordings/elevenlabs_2379486140/),
so every payload, response field, and byte count below comes straight
from the recorded HARs.

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { createElevenLabs } from "@apicity/elevenlabs";
import type { ElevenLabsTranscript } from "@apicity/elevenlabs";

const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY! });

// 1. Generate a 0.5s UI click. soundGeneration returns the raw MP3 as
//    an ArrayBuffer — there's no JSON wrapper, the response body is
//    audio/mpeg straight off the wire. duration_seconds (0.5–30) caps
//    the clip length and prompt_influence (0–1) trades prompt-fidelity
//    for creative variation. The factory also accepts `output_format`
//    on the same request object and silently moves it to the URL query.
const audio = await elevenlabs.v1.soundGeneration({
  text: "soft ui click",
  duration_seconds: 0.5,
  prompt_influence: 0.3,
});

writeFileSync("./click.mp3", new Uint8Array(audio));
console.log(`Generated ${audio.byteLength} bytes of audio/mpeg`);
// → "Generated 11764 bytes of audio/mpeg"
//   ElevenLabs charged 10 characters for this call (visible in the
//   `character-cost` response header on the original request).

// 2. Transcribe a separate audio clip with Scribe v2. The request goes
//    up as multipart/form-data — pass a Blob and the rest as ergonomic
//    fields; the factory packs the form, sets xi-api-key, and parses
//    the JSON response. tag_audio_events: true tells Scribe to surface
//    non-speech events ([phone beeping], [laughter], [applause]) inline
//    with words instead of dropping them.
const phoneBeep = readFileSync("./phone-beeping.mp3"); // 2,528 bytes
const file = new Blob([phoneBeep], { type: "audio/mp3" });

const result = (await elevenlabs.v1.speechToText({
  file,
  model_id: "scribe_v2",
  language_code: "eng",
  tag_audio_events: true,
})) as ElevenLabsTranscript;

// 3. The transcript is rich. `text` is the human-readable form;
//    `words` is the per-token breakdown with absolute timestamps and a
//    `type` discriminator ("word" | "spacing" | "audio_event") plus a
//    `logprob` confidence. `transcription_id` is durable — you can
//    retrieve the same transcript later through the history API.
console.log(
  `${result.language_code} · ${(result.language_probability * 100).toFixed(0)}% confident`,
);
// → "eng · 100% confident"
console.log(
  `${result.audio_duration_secs}s · transcription_id=${result.transcription_id}`,
);
// → "0.5s · transcription_id=CeeidI2QJ8kkN1mcq8HX"
console.log(result.text);
// → "[phone beeping]"

// 4. Walk the words array, splitting audio events from spoken words
//    via the `type` discriminator. On a clip with no speech every
//    entry is an audio_event; on real speech you'll see "word" and
//    "spacing" entries interleaved with bracketed events.
for (const w of result.words) {
  const tag =
    w.type === "audio_event"
      ? "event"
      : w.type === "word"
        ? "word "
        : "space";
  console.log(
    `  ${tag}  [${w.start.toFixed(2)}–${w.end.toFixed(2)}s]  ${w.text}` +
      (w.logprob !== undefined ? ` (logprob ${w.logprob.toFixed(3)})` : ""),
  );
}
// → "  event  [0.00–0.44s]  [phone beeping] (logprob -0.335)"
```

**Notes**

- `soundGeneration` returns binary, not JSON — the provider already
  reads it as `arrayBuffer()` and hands you an `ArrayBuffer`. Pass
  `output_format: "mp3_44100_128"` (or any other ElevenLabs codec
  string) on the request object and the factory will strip it from
  the body and move it to the `?output_format=` URL query.
- `speechToText` accepts either a `file` Blob or a `cloud_storage_url`
  (S3/GCS/HTTP). For long-form audio set `webhook: true` — the call
  returns a small `ElevenLabsWebhookAcknowledgement` instead of the
  transcript, and the finished result is delivered to your registered
  webhook. Type-narrow the union with `"text" in result` before
  reading transcript fields.
- Set `diarize: true` and `num_speakers` to label words by speaker;
  the per-word `speaker_id` field gets populated in that mode. Combine
  with `use_multi_channel: true` for stereo audio and the response
  switches to `ElevenLabsMultichannelTranscript` (one transcript per
  channel under `transcripts[]`).
- Errors throw `ElevenLabsError` with `status`, `code`, and the parsed
  body attached. ElevenLabs returns either FastAPI's
  `{ detail: [{msg, ...}] }` shape or `{ detail: { status, message } }`;
  the client normalises both into `error.message`.

## API Reference

303 endpoints across 28 groups. Each method mirrors an upstream URL path.

### audioIsolation

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioIsolation</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-isolation</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/convert)

```typescript
const res = await elevenlabs.v1.audioIsolation({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.audioIsolation.history.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/audio-isolation/history/{historyItemId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/delete)

```typescript
const res = await elevenlabs.v1.audioIsolation.history.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.audioIsolation.history.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/audio-isolation/history</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/list)

```typescript
const res = await elevenlabs.v1.audioIsolation.history.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioIsolation.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-isolation/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/stream)

```typescript
const res = await elevenlabs.v1.audioIsolation.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

### audioNative

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioNative</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-native</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/create)

```typescript
const res = await elevenlabs.v1.audioNative({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioNative.content.fromUrl</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-native/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/update-content)

```typescript
const res = await elevenlabs.v1.audioNative.content.fromUrl({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioNative.content.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-native/{projectId}/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/update-content)

```typescript
const res = await elevenlabs.v1.audioNative.content.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.audioNative.settings</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/audio-native/{projectId}/settings</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/get-settings)

```typescript
const res = await elevenlabs.v1.audioNative.settings({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

### convai

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agent.knowledgeBase.size</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agent/{agentId}/knowledge-base/size</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/size)

```typescript
const res = await elevenlabs.v1.convai.agent.knowledgeBase.size({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agent.llmUsage.calculate</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agent/{agentId}/llm-usage/calculate</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/calculate)

```typescript
const res = await elevenlabs.v1.convai.agent.llmUsage.calculate({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agentTesting.bulkMove</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agent-testing/bulk-move</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/move)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.bulkMove({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agentTesting.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agent-testing/create</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/create)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.agentTesting.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/agent-testing/{testId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/delete)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agentTesting.folders.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agent-testing/folders</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-folders/create)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.folders.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.agentTesting.folders.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/agent-testing/folders/{folderId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-folders/delete)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.folders.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agentTesting.folders.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agent-testing/folders/{folderId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-folders/get)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.folders.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.agentTesting.folders.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/agent-testing/folders/{folderId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-folders/update)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.folders.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agentTesting.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agent-testing/{testId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/get)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agentTesting.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agent-testing</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/list)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agentTesting.summaries</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agent-testing/summaries</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/summaries)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.summaries({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PUT</code> <b><code>elevenlabs.v1.convai.agentTesting.update</code></b></summary>

<code>PUT https://api.elevenlabs.io/v1/convai/agent-testing/{testId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/update)

```typescript
const res = await elevenlabs.v1.convai.agentTesting.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.avatar</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/avatar</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/widget/create)

```typescript
const res = await elevenlabs.v1.convai.agents.avatar({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.branches</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches)

```typescript
const res = await elevenlabs.v1.convai.agents.branches({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.branches.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/create)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.branches.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/get)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.branches.merge</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{sourceBranchId}/merge</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/merge)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.merge({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.branches.mergePreview</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{sourceBranchId}/merge-preview</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/preview)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.mergePreview({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.branches.rebase</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}/rebase</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/rebase)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.rebase({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.branches.rebasePreview</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}/rebase-preview</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/preview)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.rebasePreview({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.agents.branches.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches/{branchId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches/update)

```typescript
const res = await elevenlabs.v1.convai.agents.branches.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/create</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/create)

```typescript
const res = await elevenlabs.v1.convai.agents.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.agents.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/agents/{agentId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/delete)

```typescript
const res = await elevenlabs.v1.convai.agents.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.deployments</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/deployments</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/deployments/create)

```typescript
const res = await elevenlabs.v1.convai.agents.deployments({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.drafts.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/drafts</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/drafts/create)

```typescript
const res = await elevenlabs.v1.convai.agents.drafts.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.agents.drafts.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/agents/{agentId}/drafts</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/drafts/delete)

```typescript
const res = await elevenlabs.v1.convai.agents.drafts.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.duplicate</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/duplicate</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/duplicate)

```typescript
const res = await elevenlabs.v1.convai.agents.duplicate({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/get)

```typescript
const res = await elevenlabs.v1.convai.agents.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.link</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/link</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/get-link)

```typescript
const res = await elevenlabs.v1.convai.agents.link({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/list)

```typescript
const res = await elevenlabs.v1.convai.agents.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.runTests</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/run-tests</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/run-tests)

```typescript
const res = await elevenlabs.v1.convai.agents.runTests({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.simulateConversation</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/simulate-conversation</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/simulate-conversation)

```typescript
const res = await elevenlabs.v1.convai.agents.simulateConversation({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.simulateConversation.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/{agentId}/simulate-conversation/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/simulate-conversation-stream)

```typescript
const res = await elevenlabs.v1.convai.agents.simulateConversation.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.summaries</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/summaries</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/get-summaries)

```typescript
const res = await elevenlabs.v1.convai.agents.summaries({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.topics</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/topics</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/topics/get)

```typescript
const res = await elevenlabs.v1.convai.agents.topics({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.agents.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/agents/{agentId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/update)

```typescript
const res = await elevenlabs.v1.convai.agents.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.versions.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/versions/{versionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/versions/get)

```typescript
const res = await elevenlabs.v1.convai.agents.versions.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.widget</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/widget</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/widget/get)

```typescript
const res = await elevenlabs.v1.convai.agents.widget({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.analytics.liveCount</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/analytics/live-count</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/analytics/get)

```typescript
const res = await elevenlabs.v1.convai.analytics.liveCount({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.batchCalling.cancel</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}/cancel</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/batch-calling/cancel)

```typescript
const res = await elevenlabs.v1.convai.batchCalling.cancel({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.batchCalling.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/batch-calling/delete)

```typescript
const res = await elevenlabs.v1.convai.batchCalling.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.batchCalling.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/batch-calling/get)

```typescript
const res = await elevenlabs.v1.convai.batchCalling.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.batchCalling.retry</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/batch-calling/{batchId}/retry</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/batch-calling/retry)

```typescript
const res = await elevenlabs.v1.convai.batchCalling.retry({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.batchCalling.submit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/batch-calling/submit</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/batch-calling/create)

```typescript
const res = await elevenlabs.v1.convai.batchCalling.submit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.batchCalling.workspace</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/batch-calling/workspace</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/batch-calling/list)

```typescript
const res = await elevenlabs.v1.convai.batchCalling.workspace({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversation.getSignedUrl</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get-signed-url)

```typescript
const res = await elevenlabs.v1.convai.conversation.getSignedUrl({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversation.token</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversation/token</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token)

```typescript
const res = await elevenlabs.v1.convai.conversation.token({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.conversations.analysis</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/analysis/run</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/analysis/run-analysis)

```typescript
const res = await elevenlabs.v1.convai.conversations.analysis({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.conversations.analysis.evaluations</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/analysis/evaluations/run</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/analysis/run-evaluation)

```typescript
const res = await elevenlabs.v1.convai.conversations.analysis.evaluations({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/audio</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get-audio)

```typescript
const res = await elevenlabs.v1.convai.conversations.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.conversations.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/delete)

```typescript
const res = await elevenlabs.v1.convai.conversations.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.conversations.feedback</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/feedback</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/create)

```typescript
const res = await elevenlabs.v1.convai.conversations.feedback({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.conversations.files</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/files</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/upload-file)

```typescript
const res = await elevenlabs.v1.convai.conversations.files({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.conversations.files.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/files/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/delete-file)

```typescript
const res = await elevenlabs.v1.convai.conversations.files.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get)

```typescript
const res = await elevenlabs.v1.convai.conversations.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/list)

```typescript
const res = await elevenlabs.v1.convai.conversations.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.messages.smartSearch</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/messages/smart-search</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/messages/search)

```typescript
const res = await elevenlabs.v1.convai.conversations.messages.smartSearch({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.messages.textSearch</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/messages/text-search</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/messages/text-search)

```typescript
const res = await elevenlabs.v1.convai.conversations.messages.textSearch({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.sipMessages</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/sip-messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get-sip-messages)

```typescript
const res = await elevenlabs.v1.convai.conversations.sipMessages({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.conversations.tags</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/tags</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/assign)

```typescript
const res = await elevenlabs.v1.convai.conversations.tags({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.conversations.tags.unassign</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/tags/{tagId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/unassign)

```typescript
const res = await elevenlabs.v1.convai.conversations.tags.unassign({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.environmentVariables.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/environment-variables</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/environment-variables/create)

```typescript
const res = await elevenlabs.v1.convai.environmentVariables.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.environmentVariables.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/environment-variables/{envVarId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/environment-variables/get)

```typescript
const res = await elevenlabs.v1.convai.environmentVariables.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.environmentVariables.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/environment-variables</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/environment-variables/list)

```typescript
const res = await elevenlabs.v1.convai.environmentVariables.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.environmentVariables.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/environment-variables/{envVarId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/environment-variables/update)

```typescript
const res = await elevenlabs.v1.convai.environmentVariables.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.exotel.outboundCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/exotel/outbound-call</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/exotel/outbound-call)

```typescript
const res = await elevenlabs.v1.convai.exotel.outboundCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.bulkMove</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/bulk-move</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/bulk-move)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.bulkMove({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.chunks</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/chunks</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-chunks)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.chunks({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.chunks.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/chunk/{chunkId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-chunk)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.chunks.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.content</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-content)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.content({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.knowledgeBase.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/delete)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.dependentAgents</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/dependent-agents</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-agents)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.dependentAgents({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.file</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/file</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-file)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.file({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.folder</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/folder</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-folder)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.folder({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-document)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/list)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.move</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/{documentId}/move</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/move-document)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.move({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.ragIndex</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/rag-index</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/rag-index-overview)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.ragIndex({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.ragIndex.batch</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/rag-index</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/compute-rag-index-batch)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.ragIndex.batch({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.ragIndex.compute</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/rag-index</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/compute-rag-index)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.ragIndex.compute({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.knowledgeBase.ragIndex.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/rag-index/{ragIndexId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/delete-rag-index)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.ragIndex.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.ragIndex.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/rag-index</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-rag-index)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.ragIndex.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.refresh</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/refresh</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/refresh)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.refresh({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.search</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/search</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/search)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.search({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.sourceFileUrl</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/source-file-url</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-source-file-url)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.sourceFileUrl({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.summaries</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/summaries</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-summaries)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.summaries({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.text</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/text</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-text)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.text({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.knowledgeBase.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/update)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.knowledgeBase.updateFile</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}/update-file</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/update-file)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.updateFile({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.url</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/url</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-url)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.url({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.llm.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/llm/list</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/llm/list)

```typescript
const res = await elevenlabs.v1.convai.llm.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.llmUsage.calculate</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/llm-usage/calculate</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/llm/calculate)

```typescript
const res = await elevenlabs.v1.convai.llmUsage.calculate({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.mcpServers.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/mcp-servers</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/create)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.mcpServers.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/delete)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.mcpServers.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/get)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.mcpServers.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/mcp-servers</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/list)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.mcpServers.toolApprovals.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-approvals</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/approval-policies/create)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.toolApprovals.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.mcpServers.toolApprovals.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-approvals/{toolName}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/approval-policies/delete)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.toolApprovals.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.mcpServers.toolConfigs.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/create)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.toolConfigs.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.mcpServers.toolConfigs.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs/{toolName}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/delete)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.toolConfigs.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.mcpServers.toolConfigs.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs/{toolName}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/get)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.toolConfigs.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.mcpServers.toolConfigs.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tool-configs/{toolName}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/tool-configuration/update)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.toolConfigs.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.mcpServers.tools</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}/tools</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/list-tools)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.tools({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.mcpServers.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/mcp-servers/{mcpServerId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/mcp/update)

```typescript
const res = await elevenlabs.v1.convai.mcpServers.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.phoneNumbers.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/phone-numbers</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/create)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.phoneNumbers.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/delete)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.phoneNumbers.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/get)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.phoneNumbers.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/phone-numbers</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/list)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.phoneNumbers.sipMessages</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}/sip-messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/get-sip-messages)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.sipMessages({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.phoneNumbers.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/update)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.secrets.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/secrets</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/secrets/create)

```typescript
const res = await elevenlabs.v1.convai.secrets.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.secrets.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/secrets/{secretId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/secrets/delete)

```typescript
const res = await elevenlabs.v1.convai.secrets.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.secrets.dependencies</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/secrets/{secretId}/dependencies/{resourceType}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/secrets/get-dependencies)

```typescript
const res = await elevenlabs.v1.convai.secrets.dependencies({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.secrets.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/secrets/{secretId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/secrets/get)

```typescript
const res = await elevenlabs.v1.convai.secrets.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.secrets.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/secrets</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/secrets/list)

```typescript
const res = await elevenlabs.v1.convai.secrets.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.secrets.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/secrets/{secretId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/secrets/update)

```typescript
const res = await elevenlabs.v1.convai.secrets.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.settings</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/settings</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/get)

```typescript
const res = await elevenlabs.v1.convai.settings({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.settings.dashboard</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/settings/dashboard</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/dashboard/get)

```typescript
const res = await elevenlabs.v1.convai.settings.dashboard({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.settings.dashboard.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/settings/dashboard</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/dashboard/update)

```typescript
const res = await elevenlabs.v1.convai.settings.dashboard.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.settings.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/settings</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/update)

```typescript
const res = await elevenlabs.v1.convai.settings.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.sipTrunk.outboundCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/sip-trunk/outbound-call)

```typescript
const res = await elevenlabs.v1.convai.sipTrunk.outboundCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.tags.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/tags</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/create)

```typescript
const res = await elevenlabs.v1.convai.tags.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.tags.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/tags/{tagId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/delete)

```typescript
const res = await elevenlabs.v1.convai.tags.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tags.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tags/{tagId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/get)

```typescript
const res = await elevenlabs.v1.convai.tags.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tags.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tags</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/list)

```typescript
const res = await elevenlabs.v1.convai.tags.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.tags.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/tags/{tagId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/tags/update)

```typescript
const res = await elevenlabs.v1.convai.tags.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.testInvocations.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/test-invocations/{testInvocationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-invocations/get)

```typescript
const res = await elevenlabs.v1.convai.testInvocations.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.testInvocations.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/test-invocations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-invocations/list)

```typescript
const res = await elevenlabs.v1.convai.testInvocations.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.testInvocations.resubmit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/test-invocations/{testInvocationId}/resubmit</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tests/test-invocations/resubmit)

```typescript
const res = await elevenlabs.v1.convai.testInvocations.resubmit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.tools.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/tools</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/create)

```typescript
const res = await elevenlabs.v1.convai.tools.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.tools.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/tools/{toolId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/delete)

```typescript
const res = await elevenlabs.v1.convai.tools.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tools.dependentAgents</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tools/{toolId}/dependent-agents</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/get-dependent-agents)

```typescript
const res = await elevenlabs.v1.convai.tools.dependentAgents({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tools.executions</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tools/{toolId}/executions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/get-executions)

```typescript
const res = await elevenlabs.v1.convai.tools.executions({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tools.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tools/{toolId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/get)

```typescript
const res = await elevenlabs.v1.convai.tools.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tools.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tools</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/list)

```typescript
const res = await elevenlabs.v1.convai.tools.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.tools.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/tools/{toolId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/update)

```typescript
const res = await elevenlabs.v1.convai.tools.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.twilio.outboundCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/twilio/outbound-call)

```typescript
const res = await elevenlabs.v1.convai.twilio.outboundCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.twilio.registerCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/twilio/register-call</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/twilio/register-call)

```typescript
const res = await elevenlabs.v1.convai.twilio.registerCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.users.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/users</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/users/list)

```typescript
const res = await elevenlabs.v1.convai.users.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.whatsapp.outboundCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/whatsapp/outbound-call</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/whats-app/outbound-call)

```typescript
const res = await elevenlabs.v1.convai.whatsapp.outboundCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.whatsapp.outboundMessage</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/whatsapp/outbound-message</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/whats-app/outbound-message)

```typescript
const res = await elevenlabs.v1.convai.whatsapp.outboundMessage({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.whatsappAccounts.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/whatsapp-accounts/{phoneNumberId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/whats-app/accounts/delete)

```typescript
const res = await elevenlabs.v1.convai.whatsappAccounts.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.whatsappAccounts.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/whatsapp-accounts/{phoneNumberId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/whats-app/accounts/get)

```typescript
const res = await elevenlabs.v1.convai.whatsappAccounts.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.whatsappAccounts.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/whatsapp-accounts</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/whats-app/accounts/list)

```typescript
const res = await elevenlabs.v1.convai.whatsappAccounts.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.whatsappAccounts.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/whatsapp-accounts/{phoneNumberId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/whats-app/accounts/update)

```typescript
const res = await elevenlabs.v1.convai.whatsappAccounts.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/convai.ts`](src/convai.ts)

</details>

### docs

<details>
<summary><code>GET</code> <b><code>elevenlabs.docs</code></b></summary>

<code>GET https://api.elevenlabs.io/docs</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech)

```typescript
const res = await elevenlabs.docs();
```

Source: [`packages/provider/elevenlabs/src/models.ts`](src/models.ts)

</details>

### dubbing

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.audio.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/audio/{languageCode}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/audio/get)

```typescript
const res = await elevenlabs.v1.dubbing.audio.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.dubbing.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/dubbing</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/create)

```typescript
const res = await elevenlabs.v1.dubbing.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.dubbing.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/dubbing/{dubbingId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/delete)

```typescript
const res = await elevenlabs.v1.dubbing.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/get)

```typescript
const res = await elevenlabs.v1.dubbing.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/list)

```typescript
const res = await elevenlabs.v1.dubbing.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.resource.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/resource/{dubbingId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/resources/get-resource)

```typescript
const res = await elevenlabs.v1.dubbing.resource.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.transcripts.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/transcripts/{languageCode}/format/{formatType}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/transcripts/get)

```typescript
const res = await elevenlabs.v1.dubbing.transcripts.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/dubbing.ts`](src/dubbing.ts)

</details>

### forcedAlignment

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.forcedAlignment</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/forced-alignment</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/forced-alignment/create)

```typescript
const res = await elevenlabs.v1.forcedAlignment({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-to-text.ts`](src/speech-to-text.ts)

</details>

### history

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.history.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/history/{historyItemId}/audio</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.history.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/history.ts`](src/history.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.history.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/history/{historyItemId}</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.history.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/history.ts`](src/history.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.history.download</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/history/download</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.history.download({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/history.ts`](src/history.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.history.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/history/{historyItemId}</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.history.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/history.ts`](src/history.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.history.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/history</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.history.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/history.ts`](src/history.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.models</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/models</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/models/list)

```typescript
const res = await elevenlabs.v1.models();
```

Source: [`packages/provider/elevenlabs/src/models.ts`](src/models.ts)

</details>

### music

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose)

```typescript
const res = await elevenlabs.v1.music({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.detailed</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/detailed</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose-detailed)

```typescript
const res = await elevenlabs.v1.music.detailed({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.plan</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/plan</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose-plan)

```typescript
const res = await elevenlabs.v1.music.plan({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.stemSeparation</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/stem-separation</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/stem-separation)

```typescript
const res = await elevenlabs.v1.music.stemSeparation({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose-stream)

```typescript
const res = await elevenlabs.v1.music.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.upload</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/upload</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/upload)

```typescript
const res = await elevenlabs.v1.music.upload({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.videoToMusic</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/video-to-music</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/video-to-music)

```typescript
const res = await elevenlabs.v1.music.videoToMusic({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/music.ts`](src/music.ts)

</details>

### productions

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/create)

```typescript
const res = await elevenlabs.v1.productions.orders.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.deliverables</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/deliverables</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/deliverables)

```typescript
const res = await elevenlabs.v1.productions.orders.deliverables({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/{orderId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/get)

```typescript
const res = await elevenlabs.v1.productions.orders.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.productions.orders.items.remove</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/productions/orders/{orderId}/items/{itemId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/items/remove)

```typescript
const res = await elevenlabs.v1.productions.orders.items.remove({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.items.upsert</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/items</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/items/upsert)

```typescript
const res = await elevenlabs.v1.productions.orders.items.upsert({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.languages</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/languages/{orderItemKind}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/languages)

```typescript
const res = await elevenlabs.v1.productions.orders.languages({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/list)

```typescript
const res = await elevenlabs.v1.productions.orders.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.media.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/media/{mediaId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/media/get)

```typescript
const res = await elevenlabs.v1.productions.orders.media.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.media.register</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/media</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/media/register)

```typescript
const res = await elevenlabs.v1.productions.orders.media.register({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.submit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/submit</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/submit)

```typescript
const res = await elevenlabs.v1.productions.orders.submit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.productions.orders.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/productions/orders/{orderId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/update)

```typescript
const res = await elevenlabs.v1.productions.orders.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/productions.ts`](src/productions.ts)

</details>

### pronunciationDictionaries

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.addFromFile</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-file)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.addFromFile({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.addFromRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-rules)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.addFromRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.addRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/add-rules</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/add)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.addRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.pronunciationDictionaries.download</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/{versionId}/download</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/download)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.download({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.pronunciationDictionaries.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/get)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.pronunciationDictionaries.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/pronunciation-dictionaries</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/list)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.removeRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/remove-rules</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/remove)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.removeRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.setRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/set-rules</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/set)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.setRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.pronunciationDictionaries.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/update)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/pronunciation-dictionaries.ts`](src/pronunciation-dictionaries.ts)

</details>

### serviceAccounts

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.serviceAccounts.apiKeys.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/create)

```typescript
const res = await elevenlabs.v1.serviceAccounts.apiKeys.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/service-accounts.ts`](src/service-accounts.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.serviceAccounts.apiKeys.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys/{apiKeyId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/delete)

```typescript
const res = await elevenlabs.v1.serviceAccounts.apiKeys.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/service-accounts.ts`](src/service-accounts.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.serviceAccounts.apiKeys.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/list)

```typescript
const res = await elevenlabs.v1.serviceAccounts.apiKeys.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/service-accounts.ts`](src/service-accounts.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.serviceAccounts.apiKeys.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys/{apiKeyId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/update)

```typescript
const res = await elevenlabs.v1.serviceAccounts.apiKeys.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/service-accounts.ts`](src/service-accounts.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.serviceAccounts.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/service-accounts</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/service-accounts/list)

```typescript
const res = await elevenlabs.v1.serviceAccounts.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/service-accounts.ts`](src/service-accounts.ts)

</details>

### sharedVoices

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.sharedVoices</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/shared-voices</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-shared)

```typescript
const res = await elevenlabs.v1.sharedVoices({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

### similarVoices

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.similarVoices</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/similar-voices</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/find-similar-voices)

```typescript
const res = await elevenlabs.v1.similarVoices({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

### singleUseToken

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.singleUseToken</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/single-use-token/{tokenType}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tokens/create)

```typescript
const res = await elevenlabs.v1.singleUseToken({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/user.ts`](src/user.ts)

</details>

### soundGeneration

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.soundGeneration</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/sound-generation</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert)

```typescript
const res = await elevenlabs.v1.soundGeneration({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/audio.ts`](src/audio.ts)

</details>

### speechEngine

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechEngine.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-engine</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/create)

```typescript
const res = await elevenlabs.v1.speechEngine.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-engine.ts`](src/speech-engine.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.speechEngine.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/delete)

```typescript
const res = await elevenlabs.v1.speechEngine.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-engine.ts`](src/speech-engine.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.speechEngine.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/get)

```typescript
const res = await elevenlabs.v1.speechEngine.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-engine.ts`](src/speech-engine.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.speechEngine.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/speech-engine</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/list)

```typescript
const res = await elevenlabs.v1.speechEngine.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-engine.ts`](src/speech-engine.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.speechEngine.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/update)

```typescript
const res = await elevenlabs.v1.speechEngine.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-engine.ts`](src/speech-engine.ts)

</details>

### speechToSpeech

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechToSpeech</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-speech/convert)

```typescript
const res = await elevenlabs.v1.speechToSpeech({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-to-speech.ts`](src/speech-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechToSpeech.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-speech/stream)

```typescript
const res = await elevenlabs.v1.speechToSpeech.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-to-speech.ts`](src/speech-to-speech.ts)

</details>

### speechToText

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechToText</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-to-text</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)

```typescript
const res = await elevenlabs.v1.speechToText({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-to-text.ts`](src/speech-to-text.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.speechToText.transcripts.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/delete)

```typescript
const res = await elevenlabs.v1.speechToText.transcripts.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-to-text.ts`](src/speech-to-text.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.speechToText.transcripts.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/get)

```typescript
const res = await elevenlabs.v1.speechToText.transcripts.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/speech-to-text.ts`](src/speech-to-text.ts)

</details>

### studio

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.podcasts.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/podcasts</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/create-podcast)

```typescript
const res = await elevenlabs.v1.studio.podcasts.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.convert</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/convert</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/convert-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.convert({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/create-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.studio.projects.chapters.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/delete-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapters)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.snapshots.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshot)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.snapshots.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.snapshots.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshots)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.snapshots.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.snapshots.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/stream-chapter-audio)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.snapshots.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/edit-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.content.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/edit-project-content)

```typescript
const res = await elevenlabs.v1.studio.projects.content.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.convert</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/convert</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/convert-project)

```typescript
const res = await elevenlabs.v1.studio.projects.convert({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/add-project)

```typescript
const res = await elevenlabs.v1.studio.projects.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.studio.projects.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/delete-project)

```typescript
const res = await elevenlabs.v1.studio.projects.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project)

```typescript
const res = await elevenlabs.v1.studio.projects.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-projects)

```typescript
const res = await elevenlabs.v1.studio.projects.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.mutedTracks.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/muted-tracks</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project-muted-tracks)

```typescript
const res = await elevenlabs.v1.studio.projects.mutedTracks.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.pronunciationDictionaries.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/pronunciation-dictionaries</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/create-pronunciation-dictionaries)

```typescript
const res = await elevenlabs.v1.studio.projects.pronunciationDictionaries.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.snapshots.archive</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/archive</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/archive-project-snapshot)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.archive({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.snapshots.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project-snapshot)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.snapshots.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project-snapshots)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.snapshots.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/stream-project-audio)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/edit-project)

```typescript
const res = await elevenlabs.v1.studio.projects.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/studio.ts`](src/studio.ts)

</details>

### textToDialogue

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)

```typescript
const res = await elevenlabs.v1.textToDialogue({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)

```typescript
const res = await elevenlabs.v1.textToDialogue.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/stream/with-timestamps</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.textToDialogue.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.textToDialogue.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

### textToSpeech

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

```typescript
const res = await elevenlabs.v1.textToSpeech("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/stream)

```typescript
const res = await elevenlabs.v1.textToSpeech.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream/with-timestamps</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)

```typescript
const res = await elevenlabs.v1.textToSpeech.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/with-timestamps</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)

```typescript
const res = await elevenlabs.v1.textToSpeech.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

### textToVoice

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToVoice</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-voice</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/create)

```typescript
const res = await elevenlabs.v1.textToVoice({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToVoice.design</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-voice/design</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/design)

```typescript
const res = await elevenlabs.v1.textToVoice.design({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToVoice.remix</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-voice/{voiceId}/remix</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/remix)

```typescript
const res = await elevenlabs.v1.textToVoice.remix({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.textToVoice.stream</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/text-to-voice/{generatedVoiceId}/stream</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/stream)

```typescript
const res = await elevenlabs.v1.textToVoice.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/text-to-speech.ts`](src/text-to-speech.ts)

</details>

### usage

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.usage.characterStats</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/usage/character-stats</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/usage/get)

```typescript
const res = await elevenlabs.v1.usage.characterStats({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/models.ts`](src/models.ts)

</details>

### user

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.user</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/user</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/user/get)

```typescript
const res = await elevenlabs.v1.user({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/user.ts`](src/user.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.user.subscription</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/user/subscription</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/user/subscription/get)

```typescript
const res = await elevenlabs.v1.user.subscription();
```

Source: [`packages/provider/elevenlabs/src/user.ts`](src/user.ts)

</details>

### voices

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get)

```typescript
const res = await elevenlabs.v1.voices("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.add</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/add</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/ivc/create)

```typescript
const res = await elevenlabs.v1.voices.add({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.add.share</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/add/{publicUserId}/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/share)

```typescript
const res = await elevenlabs.v1.voices.add.share({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.voices.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/voices/{voiceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/delete)

```typescript
const res = await elevenlabs.v1.voices.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.edit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/{voiceId}/edit</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/edit)

```typescript
const res = await elevenlabs.v1.voices.edit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-all)

```typescript
const res = await elevenlabs.v1.voices.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/create)

```typescript
const res = await elevenlabs.v1.voices.pvc({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.captcha</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha/verify)

```typescript
const res = await elevenlabs.v1.voices.pvc.captcha("voice_id", { recording });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.captcha.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha)

```typescript
const res = await elevenlabs.v1.voices.pvc.captcha.get("voice_id");
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.edit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.edit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/update)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples("voice_id", "sample_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples.add</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.add({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/audio</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.voices.pvc.samples.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/delete)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.delete("voice_id", "sample_id");
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples.separateSpeakers</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/separate-speakers</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/separate-speakers)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.separateSpeakers("voice_id", "sample_id");
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.speakers</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers</code>

Cost tier: <code>prohibitive</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.speakers({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.speakers.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers/{speakerId}/audio</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-separated-speaker-audio)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.speakers.audio("voice_id", "sample_id", "speaker_id");
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.waveform</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/waveform</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-waveform)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.waveform("voice_id", "sample_id");
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.train</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/train</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/train)

```typescript
const res = await elevenlabs.v1.voices.pvc.train("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.verification</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/verification</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/verification/request)

```typescript
const res = await elevenlabs.v1.voices.pvc.verification("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.samples.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}/audio</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/samples/audio)

```typescript
const res = await elevenlabs.v1.voices.samples.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.voices.samples.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/samples/delete)

```typescript
const res = await elevenlabs.v1.voices.samples.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.settings</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}/settings</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-settings)

```typescript
const res = await elevenlabs.v1.voices.settings("voice_id");
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.settings.default</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/settings/default</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/settings/get-default)

```typescript
const res = await elevenlabs.v1.voices.settings.default({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.settings.edit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/{voiceId}/settings/edit</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/settings/update)

```typescript
const res = await elevenlabs.v1.voices.settings.edit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v2.voices</code></b></summary>

<code>GET https://api.elevenlabs.io/v2/voices</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/search)

```typescript
const res = await elevenlabs.v2.voices({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/voices.ts`](src/voices.ts)

</details>

### workspace

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.analytics.query.usageByProductOverTime</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/analytics/query/usage-by-product-over-time</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/usage/get-usage-by-product-over-time)

```typescript
const res = await elevenlabs.v1.workspace.analytics.query.usageByProductOverTime({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.analytics.requests</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/analytics/requests</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/analytics/requests/get)

```typescript
const res = await elevenlabs.v1.workspace.analytics.requests({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.workspace.auditLogs</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/workspace/audit-logs</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/audit-logs/list)

```typescript
const res = await elevenlabs.v1.workspace.auditLogs({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.authConnections.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/auth-connections</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/auth-connections/create)

```typescript
const res = await elevenlabs.v1.workspace.authConnections.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.workspace.authConnections.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/workspace/auth-connections/{authConnectionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/auth-connections/delete)

```typescript
const res = await elevenlabs.v1.workspace.authConnections.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.workspace.authConnections.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/workspace/auth-connections</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/auth-connections/list)

```typescript
const res = await elevenlabs.v1.workspace.authConnections.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.workspace.authConnections.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/workspace/auth-connections/{authConnectionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/auth-connections/update)

```typescript
const res = await elevenlabs.v1.workspace.authConnections.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.workspace.groups.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/workspace/groups</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/groups/list)

```typescript
const res = await elevenlabs.v1.workspace.groups.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.groups.members.add</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/groups/{groupId}/members</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/groups/members/add)

```typescript
const res = await elevenlabs.v1.workspace.groups.members.add({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.groups.members.remove</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/groups/{groupId}/members/remove</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/groups/members/remove)

```typescript
const res = await elevenlabs.v1.workspace.groups.members.remove({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.workspace.groups.search</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/workspace/groups/search</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/groups/search)

```typescript
const res = await elevenlabs.v1.workspace.groups.search({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.invites.add</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/invites/add</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/invites/create)

```typescript
const res = await elevenlabs.v1.workspace.invites.add({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.invites.addBulk</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/invites/add-bulk</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/invites/create-batch)

```typescript
const res = await elevenlabs.v1.workspace.invites.addBulk({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.workspace.invites.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/workspace/invites</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/invites/delete)

```typescript
const res = await elevenlabs.v1.workspace.invites.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.members.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/members</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/members/update)

```typescript
const res = await elevenlabs.v1.workspace.members.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.workspace.resources.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/workspace/resources/{resourceId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/resources/get)

```typescript
const res = await elevenlabs.v1.workspace.resources.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.resources.share</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/resources/{resourceId}/share</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/resources/share)

```typescript
const res = await elevenlabs.v1.workspace.resources.share({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.resources.unshare</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/resources/{resourceId}/unshare</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/resources/unshare)

```typescript
const res = await elevenlabs.v1.workspace.resources.unshare({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.webhooks.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/webhooks</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/webhooks/create)

```typescript
const res = await elevenlabs.v1.workspace.webhooks.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.workspace.webhooks.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/workspace/webhooks/{webhookId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/webhooks/delete)

```typescript
const res = await elevenlabs.v1.workspace.webhooks.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.workspace.webhooks.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/workspace/webhooks</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/webhooks/list)

```typescript
const res = await elevenlabs.v1.workspace.webhooks.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.workspace.webhooks.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/workspace/webhooks/{webhookId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/webhooks/update)

```typescript
const res = await elevenlabs.v1.workspace.webhooks.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

### workspaces

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspaces.apiKeys.disable</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspaces/api-keys/disable</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspaces/api-keys/disable)

```typescript
const res = await elevenlabs.v1.workspaces.apiKeys.disable({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspaces.apiKeys.thirdPartyDisabling</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspaces/api-keys/third-party-disabling</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspaces/api-keys/third-party-disabling)

```typescript
const res = await elevenlabs.v1.workspaces.apiKeys.thirdPartyDisabling({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/workspace.ts`](src/workspace.ts)

</details>

## Middleware

```typescript
import { createElevenLabs, withRetry } from "@apicity/elevenlabs";

const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY! });
const models = withRetry(elevenlabs.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
