# @apicity/elevenlabs

[![npm](https://img.shields.io/npm/v/@apicity/elevenlabs?color=cb0000)](https://www.npmjs.com/package/@apicity/elevenlabs)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

ElevenLabs provider for sound effect generation, text-to-speech, and audio APIs.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to every POST endpoint as `.schema`

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

10 endpoints across 8 groups. Each method mirrors an upstream URL path.

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

## Middleware

```typescript
import { createElevenLabs, withRetry } from "@apicity/elevenlabs";

const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY! });
const models = withRetry(elevenlabs.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
