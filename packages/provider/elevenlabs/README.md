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

159 endpoints across 25 groups. Each method mirrors an upstream URL path.

### audioIsolation

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioIsolation</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-isolation</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/convert)

```typescript
const res = await elevenlabs.v1.audioIsolation({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.audioIsolation.history.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/audio-isolation/history/{historyItemId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/delete)

```typescript
const res = await elevenlabs.v1.audioIsolation.history.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.audioIsolation.history.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/audio-isolation/history</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/list)

```typescript
const res = await elevenlabs.v1.audioIsolation.history.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioIsolation.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-isolation/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-isolation/stream)

```typescript
const res = await elevenlabs.v1.audioIsolation.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### audioNative

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioNative</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-native</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/create)

```typescript
const res = await elevenlabs.v1.audioNative({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioNative.content.fromUrl</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-native/content</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/update-content)

```typescript
const res = await elevenlabs.v1.audioNative.content.fromUrl({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.audioNative.content.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/audio-native/{projectId}/content</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/update-content)

```typescript
const res = await elevenlabs.v1.audioNative.content.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.audioNative.settings</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/audio-native/{projectId}/settings</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/audio-native/get-settings)

```typescript
const res = await elevenlabs.v1.audioNative.settings({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### convai

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.branches</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/branches)

```typescript
const res = await elevenlabs.v1.convai.agents.branches({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.agents.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/agents/create</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/create)

```typescript
const res = await elevenlabs.v1.convai.agents.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.agents.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/agents/{agentId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/delete)

```typescript
const res = await elevenlabs.v1.convai.agents.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/get)

```typescript
const res = await elevenlabs.v1.convai.agents.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.link</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/link</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/get-link)

```typescript
const res = await elevenlabs.v1.convai.agents.link({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/list)

```typescript
const res = await elevenlabs.v1.convai.agents.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.agents.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/agents/{agentId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/agents/update)

```typescript
const res = await elevenlabs.v1.convai.agents.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.agents.widget</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/widget</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/widget/get)

```typescript
const res = await elevenlabs.v1.convai.agents.widget({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversation.getSignedUrl</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get-signed-url)

```typescript
const res = await elevenlabs.v1.convai.conversation.getSignedUrl({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/audio</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get-audio)

```typescript
const res = await elevenlabs.v1.convai.conversations.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.conversations.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/delete)

```typescript
const res = await elevenlabs.v1.convai.conversations.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/get)

```typescript
const res = await elevenlabs.v1.convai.conversations.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.conversations.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/conversations</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/conversations/list)

```typescript
const res = await elevenlabs.v1.convai.conversations.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.knowledgeBase.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/delete)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.file</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/file</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-file)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.file({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/get-document)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.knowledgeBase.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/knowledge-base</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/list)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.text</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/text</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-text)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.text({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.knowledgeBase.url</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/knowledge-base/url</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-url)

```typescript
const res = await elevenlabs.v1.convai.knowledgeBase.url({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.phoneNumbers.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/phone-numbers</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/create)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.phoneNumbers.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/delete)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.phoneNumbers.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/get)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.phoneNumbers.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/phone-numbers</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/list)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.phoneNumbers.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/phone-numbers/update)

```typescript
const res = await elevenlabs.v1.convai.phoneNumbers.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.sipTrunk.outboundCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/sip-trunk/outbound-call)

```typescript
const res = await elevenlabs.v1.convai.sipTrunk.outboundCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.tools.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/tools</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/create)

```typescript
const res = await elevenlabs.v1.convai.tools.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.convai.tools.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/convai/tools/{toolId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/delete)

```typescript
const res = await elevenlabs.v1.convai.tools.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tools.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tools/{toolId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/get)

```typescript
const res = await elevenlabs.v1.convai.tools.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.convai.tools.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/convai/tools</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/list)

```typescript
const res = await elevenlabs.v1.convai.tools.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.convai.tools.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/convai/tools/{toolId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tools/update)

```typescript
const res = await elevenlabs.v1.convai.tools.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.convai.twilio.outboundCall</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/twilio/outbound-call)

```typescript
const res = await elevenlabs.v1.convai.twilio.outboundCall({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### docs

<details>
<summary><code>GET</code> <b><code>elevenlabs.docs</code></b></summary>

<code>GET https://api.elevenlabs.io/docs</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech)

```typescript
const res = await elevenlabs.docs();
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### dubbing

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.audio.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/audio/{languageCode}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/audio/get)

```typescript
const res = await elevenlabs.v1.dubbing.audio.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.dubbing.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/dubbing</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/create)

```typescript
const res = await elevenlabs.v1.dubbing.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.dubbing.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/dubbing/{dubbingId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/delete)

```typescript
const res = await elevenlabs.v1.dubbing.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/get)

```typescript
const res = await elevenlabs.v1.dubbing.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/list)

```typescript
const res = await elevenlabs.v1.dubbing.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.dubbing.transcripts.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/transcripts/{languageCode}/format/{formatType}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/dubbing/transcripts/get)

```typescript
const res = await elevenlabs.v1.dubbing.transcripts.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### forcedAlignment

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.forcedAlignment</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/forced-alignment</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/forced-alignment/create)

```typescript
const res = await elevenlabs.v1.forcedAlignment({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### history

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.history.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/history/{historyItemId}/audio</code>

```typescript
const res = await elevenlabs.v1.history.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.history.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/history/{historyItemId}</code>

```typescript
const res = await elevenlabs.v1.history.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.history.download</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/history/download</code>

```typescript
const res = await elevenlabs.v1.history.download({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.history.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/history/{historyItemId}</code>

```typescript
const res = await elevenlabs.v1.history.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.history.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/history</code>

```typescript
const res = await elevenlabs.v1.history.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.models</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/models</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/models/list)

```typescript
const res = await elevenlabs.v1.models();
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### music

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose)

```typescript
const res = await elevenlabs.v1.music({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.detailed</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/detailed</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose-detailed)

```typescript
const res = await elevenlabs.v1.music.detailed({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.plan</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/plan</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose-plan)

```typescript
const res = await elevenlabs.v1.music.plan({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.stemSeparation</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/stem-separation</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/stem-separation)

```typescript
const res = await elevenlabs.v1.music.stemSeparation({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/compose-stream)

```typescript
const res = await elevenlabs.v1.music.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.upload</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/upload</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/upload)

```typescript
const res = await elevenlabs.v1.music.upload({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.music.videoToMusic</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/music/video-to-music</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/music/video-to-music)

```typescript
const res = await elevenlabs.v1.music.videoToMusic({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### productions

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/create)

```typescript
const res = await elevenlabs.v1.productions.orders.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.deliverables</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/deliverables</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/deliverables)

```typescript
const res = await elevenlabs.v1.productions.orders.deliverables({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/{orderId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/get)

```typescript
const res = await elevenlabs.v1.productions.orders.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.productions.orders.items.remove</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/productions/orders/{orderId}/items/{itemId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/items/remove)

```typescript
const res = await elevenlabs.v1.productions.orders.items.remove({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.items.upsert</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/items</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/items/upsert)

```typescript
const res = await elevenlabs.v1.productions.orders.items.upsert({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.languages</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/languages/{orderItemKind}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/languages)

```typescript
const res = await elevenlabs.v1.productions.orders.languages({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/list)

```typescript
const res = await elevenlabs.v1.productions.orders.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.productions.orders.media.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/productions/orders/{orderId}/media/{mediaId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/media/get)

```typescript
const res = await elevenlabs.v1.productions.orders.media.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.media.register</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/media</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/media/register)

```typescript
const res = await elevenlabs.v1.productions.orders.media.register({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.productions.orders.submit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/productions/orders/{orderId}/submit</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/submit)

```typescript
const res = await elevenlabs.v1.productions.orders.submit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.productions.orders.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/productions/orders/{orderId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/productions/orders/update)

```typescript
const res = await elevenlabs.v1.productions.orders.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### pronunciationDictionaries

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.addFromFile</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-file)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.addFromFile({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.addFromRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-rules)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.addFromRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.addRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/add-rules</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/add)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.addRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.pronunciationDictionaries.download</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/{versionId}/download</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/download)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.download({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.pronunciationDictionaries.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/get)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.pronunciationDictionaries.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/pronunciation-dictionaries</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/list)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.removeRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/remove-rules</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/remove)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.removeRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.pronunciationDictionaries.setRules</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/set-rules</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/set)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.setRules({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.pronunciationDictionaries.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/update)

```typescript
const res = await elevenlabs.v1.pronunciationDictionaries.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### sharedVoices

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.sharedVoices</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/shared-voices</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-shared)

```typescript
const res = await elevenlabs.v1.sharedVoices({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### similarVoices

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.similarVoices</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/similar-voices</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/find-similar-voices)

```typescript
const res = await elevenlabs.v1.similarVoices({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### singleUseToken

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.singleUseToken</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/single-use-token/{tokenType}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/tokens/create)

```typescript
const res = await elevenlabs.v1.singleUseToken({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### soundGeneration

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.soundGeneration</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/sound-generation</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert)

```typescript
const res = await elevenlabs.v1.soundGeneration({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### speechEngine

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechEngine.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-engine</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/create)

```typescript
const res = await elevenlabs.v1.speechEngine.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.speechEngine.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/delete)

```typescript
const res = await elevenlabs.v1.speechEngine.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.speechEngine.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/get)

```typescript
const res = await elevenlabs.v1.speechEngine.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.speechEngine.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/speech-engine</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/list)

```typescript
const res = await elevenlabs.v1.speechEngine.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>elevenlabs.v1.speechEngine.update</code></b></summary>

<code>PATCH https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-engine/update)

```typescript
const res = await elevenlabs.v1.speechEngine.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### speechToSpeech

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechToSpeech</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-speech/convert)

```typescript
const res = await elevenlabs.v1.speechToSpeech({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechToSpeech.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-speech/stream)

```typescript
const res = await elevenlabs.v1.speechToSpeech.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### speechToText

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.speechToText</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/speech-to-text</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)

```typescript
const res = await elevenlabs.v1.speechToText({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.speechToText.transcripts.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/delete)

```typescript
const res = await elevenlabs.v1.speechToText.transcripts.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.speechToText.transcripts.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/get)

```typescript
const res = await elevenlabs.v1.speechToText.transcripts.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### studio

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.podcasts.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/podcasts</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/create-podcast)

```typescript
const res = await elevenlabs.v1.studio.podcasts.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.convert</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/convert</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/convert-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.convert({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/create-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.studio.projects.chapters.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/delete-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapters)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.snapshots.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshot)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.snapshots.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.chapters.snapshots.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-chapter-snapshots)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.snapshots.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.snapshots.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}/snapshots/{chapterSnapshotId}/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/stream-chapter-audio)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.snapshots.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.chapters.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/chapters/{chapterId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/edit-chapter)

```typescript
const res = await elevenlabs.v1.studio.projects.chapters.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.content.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/content</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/edit-project-content)

```typescript
const res = await elevenlabs.v1.studio.projects.content.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.convert</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/convert</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/convert-project)

```typescript
const res = await elevenlabs.v1.studio.projects.convert({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/add-project)

```typescript
const res = await elevenlabs.v1.studio.projects.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.studio.projects.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/studio/projects/{projectId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/delete-project)

```typescript
const res = await elevenlabs.v1.studio.projects.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project)

```typescript
const res = await elevenlabs.v1.studio.projects.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-projects)

```typescript
const res = await elevenlabs.v1.studio.projects.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.mutedTracks.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/muted-tracks</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project-muted-tracks)

```typescript
const res = await elevenlabs.v1.studio.projects.mutedTracks.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.pronunciationDictionaries.create</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/pronunciation-dictionaries</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/create-pronunciation-dictionaries)

```typescript
const res = await elevenlabs.v1.studio.projects.pronunciationDictionaries.create({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.snapshots.archive</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/archive</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/archive-project-snapshot)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.archive({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.snapshots.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project-snapshot)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.get({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.studio.projects.snapshots.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/get-project-snapshots)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.snapshots.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}/snapshots/{snapshotId}/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/stream-project-audio)

```typescript
const res = await elevenlabs.v1.studio.projects.snapshots.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.studio.projects.update</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/studio/projects/{projectId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/studio/edit-project)

```typescript
const res = await elevenlabs.v1.studio.projects.update({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### textToDialogue

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)

```typescript
const res = await elevenlabs.v1.textToDialogue({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)

```typescript
const res = await elevenlabs.v1.textToDialogue.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/stream/with-timestamps</code>

```typescript
const res = await elevenlabs.v1.textToDialogue.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps</code>

```typescript
const res = await elevenlabs.v1.textToDialogue.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### textToSpeech

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

```typescript
const res = await elevenlabs.v1.textToSpeech("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech.stream</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/stream)

```typescript
const res = await elevenlabs.v1.textToSpeech.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream/with-timestamps</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)

```typescript
const res = await elevenlabs.v1.textToSpeech.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech.withTimestamps</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/with-timestamps</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)

```typescript
const res = await elevenlabs.v1.textToSpeech.withTimestamps({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### textToVoice

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToVoice</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-voice</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/create)

```typescript
const res = await elevenlabs.v1.textToVoice({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToVoice.design</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-voice/design</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/design)

```typescript
const res = await elevenlabs.v1.textToVoice.design({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.textToVoice.remix</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-voice/{voiceId}/remix</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/remix)

```typescript
const res = await elevenlabs.v1.textToVoice.remix({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.textToVoice.stream</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/text-to-voice/{generatedVoiceId}/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-voice/stream)

```typescript
const res = await elevenlabs.v1.textToVoice.stream({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### user

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.user</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/user</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/user/get)

```typescript
const res = await elevenlabs.v1.user({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.user.subscription</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/user/subscription</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/user/subscription/get)

```typescript
const res = await elevenlabs.v1.user.subscription();
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### voices

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get)

```typescript
const res = await elevenlabs.v1.voices("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.add</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/add</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/ivc/create)

```typescript
const res = await elevenlabs.v1.voices.add({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.add.share</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/add/{publicUserId}/{voiceId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/share)

```typescript
const res = await elevenlabs.v1.voices.add.share({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.voices.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/voices/{voiceId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/delete)

```typescript
const res = await elevenlabs.v1.voices.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.edit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/{voiceId}/edit</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/edit)

```typescript
const res = await elevenlabs.v1.voices.edit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.list</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-all)

```typescript
const res = await elevenlabs.v1.voices.list({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/create)

```typescript
const res = await elevenlabs.v1.voices.pvc({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.captcha</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha/verify)

```typescript
const res = await elevenlabs.v1.voices.pvc.captcha("voice_id", { recording });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.captcha.get</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha)

```typescript
const res = await elevenlabs.v1.voices.pvc.captcha.get("voice_id");
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.edit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.edit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/update)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples("voice_id", "sample_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples.add</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.add({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/audio</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.voices.pvc.samples.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/delete)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.delete("voice_id", "sample_id");
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples.separateSpeakers</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/separate-speakers</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/separate-speakers)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.separateSpeakers("voice_id", "sample_id");
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.speakers</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers</code>

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.speakers({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.speakers.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers/{speakerId}/audio</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-separated-speaker-audio)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.speakers.audio("voice_id", "sample_id", "speaker_id");
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.pvc.samples.waveform</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/waveform</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-waveform)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples.waveform("voice_id", "sample_id");
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.train</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/train</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/train)

```typescript
const res = await elevenlabs.v1.voices.pvc.train("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.verification</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/verification</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/verification/request)

```typescript
const res = await elevenlabs.v1.voices.pvc.verification("voice_id", { /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.samples.audio</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}/audio</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/samples/audio)

```typescript
const res = await elevenlabs.v1.voices.samples.audio({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>elevenlabs.v1.voices.samples.delete</code></b></summary>

<code>DELETE https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/samples/delete)

```typescript
const res = await elevenlabs.v1.voices.samples.delete({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.settings</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}/settings</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-settings)

```typescript
const res = await elevenlabs.v1.voices.settings("voice_id");
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.settings.default</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/settings/default</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/settings/get-default)

```typescript
const res = await elevenlabs.v1.voices.settings.default({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.settings.edit</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/{voiceId}/settings/edit</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/settings/update)

```typescript
const res = await elevenlabs.v1.voices.settings.edit({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>GET</code> <b><code>elevenlabs.v2.voices</code></b></summary>

<code>GET https://api.elevenlabs.io/v2/voices</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/search)

```typescript
const res = await elevenlabs.v2.voices({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

### workspace

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.analytics.query.usageByProductOverTime</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/analytics/query/usage-by-product-over-time</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/usage/get-usage-by-product-over-time)

```typescript
const res = await elevenlabs.v1.workspace.analytics.query.usageByProductOverTime({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

</details>

<details>
<summary><code>POST</code> <b><code>elevenlabs.v1.workspace.analytics.requests</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/workspace/analytics/requests</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/workspace/analytics/requests/get)

```typescript
const res = await elevenlabs.v1.workspace.analytics.requests({ /* ... */ });
```

Source: [`packages/provider/elevenlabs/src/elevenlabs.ts`](src/elevenlabs.ts)

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
