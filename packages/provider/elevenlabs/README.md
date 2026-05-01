# @apicity/elevenlabs

[![npm](https://img.shields.io/npm/v/@apicity/elevenlabs?color=cb0000)](https://www.npmjs.com/package/@apicity/elevenlabs)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

ElevenLabs provider for sound effect generation, text-to-speech, and audio APIs.

## Installation

```bash
npm install @apicity/elevenlabs
# or
pnpm add @apicity/elevenlabs
```

## Quick Start

```typescript
import { elevenlabs as createElevenlabs } from "@apicity/elevenlabs";

const elevenlabs = createElevenlabs({ apiKey: process.env.ELEVENLABS_API_KEY! });
```

## API Reference

2 endpoints across 2 groups. Each method mirrors an upstream URL path.

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

## Middleware

```typescript
import { elevenlabs as createElevenlabs, withRetry } from "@apicity/elevenlabs";

const elevenlabs = createElevenlabs({ apiKey: process.env.ELEVENLABS_API_KEY! });
const models = withRetry(elevenlabs.get.v1.models, { retries: 3 });
```

## License

MIT
