# @apicity/fireworks

[![npm](https://img.shields.io/npm/v/@apicity/fireworks?color=cb0000)](https://www.npmjs.com/package/@apicity/fireworks)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Fireworks AI provider for chat completions, completions, and embeddings.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/fireworks
# or
pnpm add @apicity/fireworks
```

## Quick Start

```typescript
import { createFireworks } from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });
```

## Real-world example: rerank candidate passages, then stream a Llama 3.3 70B answer

Fireworks ships two inference surfaces that compose cleanly into a
lightweight RAG pipeline: a hosted cross-encoder reranker (`qwen3-reranker-8b`)
that scores a query against N candidate documents, and OpenAI-compatible
streaming chat completions on Llama 3.3 70B Instruct. The rerank is the
hard part — most providers only sell embeddings — and the streaming chat
is the cheap, fast tail. The two-step flow below mirrors
[`tests/integration/fireworks-rerank.test.ts`](../../../tests/integration/fireworks-rerank.test.ts)
and
[`tests/integration/fireworks-stream.test.ts`](../../../tests/integration/fireworks-stream.test.ts),
which replay against
[`tests/recordings/fireworks_626462085/rerank-basic_678261817/`](../../../tests/recordings/fireworks_626462085/rerank-basic_678261817/)
and
[`tests/recordings/fireworks_626462085/chat-stream-hello_2801342443/`](../../../tests/recordings/fireworks_626462085/chat-stream-hello_2801342443/),
so every score, token count, and SSE shape below comes straight from
the recorded HARs.

```typescript
import { createFireworks } from "@apicity/fireworks";
import type {
  FireworksRerankResponse,
  FireworksChatStreamChunk,
} from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });

// 1. Cross-encoder rerank. The model sees the query and each document
//    jointly (unlike embedding-based retrieval, which scores them
//    independently), so it picks up phrasing-level signal that ANN
//    search misses. `top_n` caps the response length; `return_documents:
//    true` echoes the document text back inline so you can hand the
//    top hit straight to a chat model without keeping a parallel
//    id→text map.
const ranked: FireworksRerankResponse =
  await fireworks.inference.v1.rerank({
    model: "fireworks/qwen3-reranker-8b",
    query: "What is the capital of France?",
    documents: [
      "Berlin is the capital of Germany.",
      "Paris is the capital and largest city of France.",
      "Madrid is the capital of Spain.",
    ],
    top_n: 2,
    return_documents: true,
  });

// 2. The response is sorted descending by relevance_score. The score
//    spread is huge — Paris ~0.96, Berlin ~0.0001, Madrid dropped — a
//    near-four-orders-of-magnitude gap that a cosine-similarity
//    retriever could never produce. `index` points back into the
//    original `documents` array.
const top = ranked.data[0];
console.log(`#1: index=${top.index}, score=${top.relevance_score.toFixed(4)}`);
console.log(`    "${top.document}"`);
// → "#1: index=1, score=0.9579"
// →     "Paris is the capital and largest city of France."

console.log(`model=${ranked.model}, tokens=${ranked.usage.prompt_tokens}`);
// → "model=accounts/fireworks/models/qwen3-reranker-8b, tokens=261"

// 3. Stream a chat answer through Llama 3.3 70B Instruct. The recorded
//    call below is a generic 'say hello' smoke test — independent from
//    the rerank above — but the request shape is exactly what you'd
//    send in production: drop `top.document` into a system message and
//    the user's original question into the user turn.
//    `temperature: 0` makes the output deterministic; `max_tokens: 64`
//    caps the response. The streaming surface lives under
//    `post.stream.*` and yields OpenAI-shaped
//    `chat.completion.chunk` objects.
let answer = "";
let finish: string | null = null;
let totals = { prompt: 0, completion: 0 };

const stream = fireworks.post.stream.inference.v1.chat.completions({
  model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  messages: [{ role: "user", content: "Say hello in one sentence." }],
  temperature: 0,
  max_tokens: 64,
});

for await (const chunk of stream) {
  // 4. Each delta carries one or two tokens of `content`. The FIRST
  //    delta carries `delta.role` and no content; the LAST delta has
  //    no content but `finish_reason: "stop"` and final `usage`.
  //    Read defensively — both fields are optional on every chunk.
  const choice: FireworksChatStreamChunk["choices"][number] | undefined =
    chunk.choices[0];
  if (choice?.delta?.content) answer += choice.delta.content;
  if (choice?.finish_reason) finish = choice.finish_reason;
  if (chunk.usage) {
    totals = {
      prompt: chunk.usage.prompt_tokens,
      completion: chunk.usage.completion_tokens,
    };
  }
}

console.log(answer);
// → "Hello, it's nice to meet you and I'm here to help with any questions or topics you'd like to discuss."
console.log(
  `finish=${finish}, prompt=${totals.prompt}, completion=${totals.completion}`,
);
// → "finish=stop, prompt=41, completion=26"
```

**Notes**

- The reranker is a cross-encoder, not an embedding model — it
  computes query-document interaction directly, so it's substantially
  more accurate than cosine similarity over independent embeddings,
  but it doesn't scale to millions of candidates. The standard hybrid
  is embedding-based ANN to fetch a top-100, then `qwen3-reranker-8b`
  to refine to a top-3. Fireworks hosts both halves on the same
  domain (`/v1/embeddings` for the first stage, `/v1/rerank` for the
  second).
- Streaming chat chunks are OpenAI-compatible: `chat.completion.chunk`
  with `choices[].delta` carrying incremental content. Watch
  `finish_reason` to know whether you hit `"stop"`, `"length"`, or
  `"content_filter"`. Only the **final** chunk has `usage` populated;
  intermediate chunks have `usage: null`. Fireworks also surfaces a
  per-call `fireworks-cached-prompt-tokens` response header — at 40
  of 41 cached above, the prefix paid for itself almost entirely,
  visible without parsing the body.
- For Anthropic-shaped responses against the same Llama catalog, swap
  to `fireworks.inference.v1.messages({...})`. The model id and pricing
  match, but the response is `{ role, content: [{ type: "text", text }], ... }`
  instead of `{ choices: [{ message: { content }}] }` — useful when
  porting code already written against `@apicity/anthropic`.
- For non-streaming completions, drop the `post.stream.` prefix:
  `fireworks.inference.v1.chat.completions({...})` returns a single
  `FireworksChatResponse` with `choices[0].message.content` populated
  and full `usage` in one shot. Same payload schema, exposed at
  `fireworks.inference.v1.chat.completions.schema` for runtime
  validation before the call.
- Errors throw `FireworksError` with `status` and the parsed body
  attached. `400` from rerank usually means an empty/missing
  `documents` array; `429` is rate-limit; `503` is a deployment cold
  start. Wrap with `withRetry({ retries: 3 })` from `@apicity/fireworks`
  to ride out cold deployments without bespoke retry code.

## API Reference

101 endpoints across 1 group. Each method mirrors an upstream URL path.

### inference

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.apiKeys.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/users/{userId}/apiKeys</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.apiKeys.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.apiKeys</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/users/{userId}/apiKeys:delete</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.apiKeys({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.apiKeys.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/users/{userId}/apiKeys</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.apiKeys.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/batchInferenceJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/batchInferenceJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/batchInferenceJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.batchInferenceJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/batchInferenceJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.batchInferenceJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.datasets.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/datasets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.datasets</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/datasets/{datasetId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.datasets</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/datasets/{datasetId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.datasets.getDownloadEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/datasets/{datasetId}:getDownloadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.getDownloadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.datasets.getUploadEndpoint</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/datasets/{datasetId}:getUploadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.getUploadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.datasets.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/datasets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.datasets.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/datasets/{datasetId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.datasets.validateUpload</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/datasets/{datasetId}:validateUpload</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.datasets.validateUpload({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.deployedModels.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/deployedModels</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.deployedModels</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/deployedModels/{deployedModelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployedModels</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deployedModels/{deployedModelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployedModels.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deployedModels</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.deployedModels.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/deployedModels/{deployedModelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployedModels.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deploymentShapes</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deploymentShapes/{shapeId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deploymentShapes({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deploymentShapes.versions</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deploymentShapes/{shapeId}/versions/{versionId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deploymentShapes.versions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deploymentShapes.versions.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deploymentShapes/{shapeId}/versions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deploymentShapes.versions.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.deployments.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/deployments</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.deployments</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/deployments/{deploymentId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployments</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deployments/{deploymentId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.deployments.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/deployments</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.deployments.scale</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/deployments/{deploymentId}:scale</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.scale({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.deployments.undelete</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/deployments/{deploymentId}:undelete</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.undelete({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.deployments.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/deployments/{deploymentId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.deployments.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/dpoJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.dpoJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/dpoJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.dpoJobs</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/dpoJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.getMetricsFileEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/dpoJobs/{jobId}:getMetricsFileEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.getMetricsFileEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/dpoJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.dpoJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/dpoJobs/{jobId}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.dpoJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/evaluationJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs.getExecutionLogEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluationJobs/{evaluationJobId}:getExecutionLogEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs.getExecutionLogEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluationJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluationJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluationJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluators.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/evaluatorsV2</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.evaluators</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators.getBuildLogEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}:getBuildLogEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.getBuildLogEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators.getSourceCodeSignedUrl</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}:getSourceCodeSignedUrl</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.getSourceCodeSignedUrl({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluators.getUploadEndpoint</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}:getUploadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.getUploadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.evaluators.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/evaluators</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.evaluators.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.evaluators.validateUpload</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/evaluators/{evaluatorId}:validateUpload</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.evaluators.validateUpload({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.models.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/models</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.models</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models.getDownloadEndpoint</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}:getDownloadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.getDownloadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.models.getUploadEndpoint</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}:getUploadEndpoint</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.getUploadEndpoint({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/models</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.models.prepare</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}:prepare</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.prepare({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.models.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.models.validateUpload</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/models/{modelId}:validateUpload</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.models.validateUpload({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/reinforcementFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/reinforcementFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.reinforcementFineTuningJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/reinforcementFineTuningJobs/{jobId}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.reinforcementFineTuningJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.executeTrainStep</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}:executeTrainStep</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.executeTrainStep({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.rlorTrainerJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs/{jobId}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.rlorTrainerJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.secrets.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/secrets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.secrets</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{accountId}/secrets/{secretId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.secrets</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/secrets/{secretId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.secrets.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/secrets</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.secrets.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/secrets/{secretId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.secrets.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/supervisedFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs</code></b></summary>

<code>DELETE https://api.fireworks.ai/v1/accounts/{param}/supervisedFineTuningJobs/{param}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{param}/supervisedFineTuningJobs/{param}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/supervisedFineTuningJobs</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.supervisedFineTuningJobs.resume</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{param}/supervisedFineTuningJobs/{param}:resume</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.supervisedFineTuningJobs.resume({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.users.create</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/users</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.create({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.users</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/users/{userId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.accounts.users.list</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/users</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.list({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>PATCH</code> <b><code>fireworks.inference.v1.accounts.users.update</code></b></summary>

<code>PATCH https://api.fireworks.ai/v1/accounts/{accountId}/users/{userId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>GET</code> <b><code>fireworks.inference.v1.audio.batch</code></b></summary>

<code>GET https://api.fireworks.ai/v1/accounts/{accountId}/batch_job/{batchId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.batch({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.batch.transcriptions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/transcriptions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.batch.transcriptions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.batch.translations</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/translations</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.batch.translations({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.transcriptions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/transcriptions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.transcriptions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.audio.translations</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/audio/translations</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.audio.translations({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.chat.completions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/chat/completions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.chat.completions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.completions</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/completions</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.completions({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.embeddings</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/embeddings</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.embeddings({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.rerank</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/rerank</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.rerank({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.accounts.users.update</code></b></summary>

<code>POST https://api.fireworks.ai/v1/accounts/{accountId}/users/{userId}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.accounts.users.update({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.messages</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/messages</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.messages({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.workflows.getResult</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/{model}/get_result</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.workflows.getResult({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.workflows.kontext</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/{model}</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.workflows.kontext({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.workflows.textToImage</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/{model}/text_to_image</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.workflows.textToImage({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

<details>
<summary><code>POST</code> <b><code>fireworks.inference.v1.messages</code></b></summary>

<code>POST https://api.fireworks.ai/inference/v1/messages</code>

[Upstream docs ↗](https://docs.fireworks.ai/api-reference)

```typescript
const res = await fireworks.inference.v1.messages({ /* ... */ });
```

Source: [`packages/provider/fireworks/src/fireworks.ts`](src/fireworks.ts)

</details>

## Middleware

```typescript
import { createFireworks, withRetry } from "@apicity/fireworks";

const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });
const models = withRetry(fireworks.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
