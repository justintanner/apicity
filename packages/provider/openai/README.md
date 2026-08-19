# @apicity/openai

[![npm](https://img.shields.io/npm/v/@apicity/openai?color=cb0000)](https://www.npmjs.com/package/@apicity/openai)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

OpenAI / GPT provider for chat completions.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/openai
# or
pnpm add @apicity/openai
```

## Quick Start

```typescript
import { createOpenAi } from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });
```

## API Reference

60 endpoints across 19 groups. Each method mirrors an upstream URL path.

### audio

<details>
<summary><code>POST</code> <b><code>openai.v1.audio.speech</code></b></summary>

<code>POST https://api.openai.com/v1/audio/speech</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.audio.speech({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.audio.transcriptions</code></b></summary>

<code>POST https://api.openai.com/v1/audio/transcriptions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.audio.transcriptions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.audio.translations</code></b></summary>

<code>POST https://api.openai.com/v1/audio/translations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.audio.translations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### batches

<details>
<summary><code>GET</code> <b><code>openai.v1.batches</code></b></summary>

<code>GET https://api.openai.com/v1/batches/{idOrOpts}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.batches</code></b></summary>

<code>POST https://api.openai.com/v1/batches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.batches({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.batches.cancel</code></b></summary>

<code>POST https://api.openai.com/v1/batches/{id}/cancel</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.batches.cancel({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### chat

<details>
<summary><code>DELETE</code> <b><code>openai.v1.chat.completions</code></b></summary>

<code>DELETE https://api.openai.com/v1/chat/completions/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.chat.completions</code></b></summary>

<code>GET https://api.openai.com/v1/chat/completions/{idOrOpts}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.chat.completions.messages</code></b></summary>

<code>GET https://api.openai.com/v1/chat/completions/{id}/messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions.messages({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.chat.completions</code></b></summary>

<code>POST https://api.openai.com/v1/chat/completions/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### codex

<details>
<summary><code>GET</code> <b><code>openai.codex.usage</code></b></summary>

<code>GET https://chatgpt.com/backend-api/wham/usage</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://developers.openai.com/codex/pricing)

```typescript
const res = await openai.codex.usage({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### completions

<details>
<summary><code>POST</code> <b><code>openai.v1.completions</code></b></summary>

<code>POST https://api.openai.com/v1/completions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/completions/create)

```typescript
const res = await openai.v1.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### containers

<details>
<summary><code>POST</code> <b><code>openai.v1.containers</code></b></summary>

<code>POST https://api.openai.com/v1/containers</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/containers/createContainers)

```typescript
const res = await openai.v1.containers({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### conversations

<details>
<summary><code>GET</code> <b><code>openai.v1.conversations.retrieve</code></b></summary>

<code>GET https://api.openai.com/v1/conversations/{conversationId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/conversations/retrieve)

```typescript
const res = await openai.v1.conversations.retrieve({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.conversations</code></b></summary>

<code>POST https://api.openai.com/v1/conversations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.conversations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### embeddings

<details>
<summary><code>POST</code> <b><code>openai.v1.embeddings</code></b></summary>

<code>POST https://api.openai.com/v1/embeddings</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.embeddings({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### evals

<details>
<summary><code>POST</code> <b><code>openai.v1.evals</code></b></summary>

<code>POST https://api.openai.com/v1/evals</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/evals/create)

```typescript
const res = await openai.v1.evals({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### files

<details>
<summary><code>DELETE</code> <b><code>openai.v1.files</code></b></summary>

<code>DELETE https://api.openai.com/v1/files/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.files</code></b></summary>

<code>GET https://api.openai.com/v1/files/{idOrOpts}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.files.content</code></b></summary>

<code>GET https://api.openai.com/v1/files/{id}/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files.content({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.files</code></b></summary>

<code>POST https://api.openai.com/v1/files</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.files({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### fineTuning

<details>
<summary><code>DELETE</code> <b><code>openai.v1.fineTuning.checkpoints.permissions</code></b></summary>

<code>DELETE https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions/{permissionId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.checkpoints.permissions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fineTuning.checkpoints.permissions</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.checkpoints.permissions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fineTuning.jobs</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/jobs/{idOrOpts}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fineTuning.jobs.checkpoints</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/jobs/{id}/checkpoints</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs.checkpoints({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.fineTuning.jobs.events</code></b></summary>

<code>GET https://api.openai.com/v1/fine_tuning/jobs/{id}/events</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs.events({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fineTuning.checkpoints.permissions</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/checkpoints/{checkpoint}/permissions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.checkpoints.permissions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fineTuning.jobs</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fineTuning.jobs.cancel</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs/{id}/cancel</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs.cancel({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fineTuning.jobs.pause</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs/{id}/pause</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs.pause({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.fineTuning.jobs.resume</code></b></summary>

<code>POST https://api.openai.com/v1/fine_tuning/jobs/{id}/resume</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.fineTuning.jobs.resume({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### images

<details>
<summary><code>POST</code> <b><code>openai.v1.images.edits</code></b></summary>

<code>POST https://api.openai.com/v1/images/edits</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.images.edits({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.images.generations</code></b></summary>

<code>POST https://api.openai.com/v1/images/generations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.images.generations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.images.variations</code></b></summary>

<code>POST https://api.openai.com/v1/images/variations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.images.variations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### models

<details>
<summary><code>DELETE</code> <b><code>openai.v1.models</code></b></summary>

<code>DELETE https://api.openai.com/v1/models/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.models({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.models</code></b></summary>

<code>GET https://api.openai.com/v1/models/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.models({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### moderations

<details>
<summary><code>POST</code> <b><code>openai.v1.moderations</code></b></summary>

<code>POST https://api.openai.com/v1/moderations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.moderations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### organization

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.costs</code></b></summary>

<code>GET https://api.openai.com/v1/organization/costs</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.costs({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.projects</code></b></summary>

<code>GET https://api.openai.com/v1/organization/projects/{idOrOpts}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/projects)

```typescript
const res = await openai.v1.organization.projects({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.projects.rateLimits</code></b></summary>

<code>GET https://api.openai.com/v1/organization/projects/{projectId}/rate_limits</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/project-rate-limits)

```typescript
const res = await openai.v1.organization.projects.rateLimits({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.audioSpeeches</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/audio_speeches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.audioSpeeches({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.audioTranscriptions</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/audio_transcriptions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.audioTranscriptions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.codeInterpreterSessions</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/code_interpreter_sessions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.codeInterpreterSessions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.completions</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/completions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.completions({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.embeddings</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/embeddings</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.embeddings({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.images</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/images</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.images({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.moderations</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/moderations</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.moderations({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.organization.usage.vectorStores</code></b></summary>

<code>GET https://api.openai.com/v1/organization/usage/vector_stores</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/usage)

```typescript
const res = await openai.v1.organization.usage.vectorStores({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### realtime

<details>
<summary><code>POST</code> <b><code>openai.v1.realtime.clientSecrets</code></b></summary>

<code>POST https://api.openai.com/v1/realtime/client_secrets</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/realtime-sessions/create-client-secret)

```typescript
const res = await openai.v1.realtime.clientSecrets({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### responses

<details>
<summary><code>DELETE</code> <b><code>openai.v1.responses</code></b></summary>

<code>DELETE https://api.openai.com/v1/responses/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.responses</code></b></summary>

<code>GET https://api.openai.com/v1/responses/{id}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>GET</code> <b><code>openai.v1.responses.inputItems</code></b></summary>

<code>GET https://api.openai.com/v1/responses/{id}/input_items</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.inputItems({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses</code></b></summary>

<code>POST https://api.openai.com/v1/responses</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses.cancel</code></b></summary>

<code>POST https://api.openai.com/v1/responses/{id}/cancel</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.cancel({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses.compact</code></b></summary>

<code>POST https://api.openai.com/v1/responses/compact</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.compact({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.responses.inputTokens</code></b></summary>

<code>POST https://api.openai.com/v1/responses/input_tokens</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference)

```typescript
const res = await openai.v1.responses.inputTokens({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### uploads

<details>
<summary><code>POST</code> <b><code>openai.v1.uploads</code></b></summary>

<code>POST https://api.openai.com/v1/uploads</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/uploads/create)

```typescript
const res = await openai.v1.uploads({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

### vectorStores

<details>
<summary><code>GET</code> <b><code>openai.v1.vectorStores</code></b></summary>

<code>GET https://api.openai.com/v1/vector_stores/{idOrOpts}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/vector-stores/list)

```typescript
const res = await openai.v1.vectorStores({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.vectorStores</code></b></summary>

<code>POST https://api.openai.com/v1/vector_stores</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/vector-stores/create)

```typescript
const res = await openai.v1.vectorStores({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

<details>
<summary><code>POST</code> <b><code>openai.v1.vectorStores.search</code></b></summary>

<code>POST https://api.openai.com/v1/vector_stores/{vectorStoreId}/search</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://platform.openai.com/docs/api-reference/vector-stores/search)

```typescript
const res = await openai.v1.vectorStores.search({ /* ... */ });
```

Source: [`packages/provider/openai/src/openai.ts`](src/openai.ts)

</details>

## Middleware

```typescript
import { createOpenAi, withRetry } from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });
const models = withRetry(openai.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
