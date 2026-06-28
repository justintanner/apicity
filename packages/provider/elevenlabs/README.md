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

59 endpoints across 10 groups. Each method mirrors an upstream URL path.

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
<summary><code>POST</code> <b><code>elevenlabs.v1.textToDialogue</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-dialogue/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert)

```typescript
const res = await elevenlabs.v1.textToDialogue({ /* ... */ });
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
<summary><code>POST</code> <b><code>elevenlabs.v1.textToSpeech</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

```typescript
const res = await elevenlabs.v1.textToSpeech("voice_id", { /* ... */ });
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

### user

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
<summary><code>POST</code> <b><code>elevenlabs.v1.voices.pvc.samples</code></b></summary>

<code>POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/pvc/samples/update)

```typescript
const res = await elevenlabs.v1.voices.pvc.samples("voice_id", "sample_id", { /* ... */ });
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
<summary><code>GET</code> <b><code>elevenlabs.v1.voices.settings</code></b></summary>

<code>GET https://api.elevenlabs.io/v1/voices/{voiceId}/settings</code>

[Upstream docs ↗](https://elevenlabs.io/docs/api-reference/voices/get-settings)

```typescript
const res = await elevenlabs.v1.voices.settings("voice_id");
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
