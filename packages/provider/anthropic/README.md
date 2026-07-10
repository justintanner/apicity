# @apicity/anthropic

[![npm](https://img.shields.io/npm/v/@apicity/anthropic?color=cb0000)](https://www.npmjs.com/package/@apicity/anthropic)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Anthropic / Claude provider for messages, batches, models, files, and admin APIs.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/anthropic
# or
pnpm add @apicity/anthropic
```

## Quick Start

```typescript
import { createAnthropic } from "@apicity/anthropic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
```

## Real-world example: multi-turn TypeScript review with system prompt + few-shot priming

The single biggest knob the Anthropic Messages API gives you is the
`messages` array itself: every prior turn is grist for the next one.
Pair that with a strict `system` prompt to lock the output format and
one priming exchange to demonstrate the format, and you get a
deterministic-looking single-line bug reviewer out of `claude-sonnet-4-6`
without any tools, no JSON-mode, no fine-tune. Every token, model id,
and content block below is mined from
[`tests/recordings/anthropic_2966493235/messages-code-review_891889396/`](../../../tests/recordings/anthropic_2966493235/messages-code-review_891889396/),
the HAR replayed by
[`tests/integration/anthropic-messages-code-review.test.ts`](../../../tests/integration/anthropic-messages-code-review.test.ts)
— recorded straight against `https://api.anthropic.com/v1/messages` with
the typed `@apicity/anthropic` client.

````typescript
import { createAnthropic } from "@apicity/anthropic";
import type {
  AnthropicMessageResponse,
  AnthropicTextBlock,
} from "@apicity/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 1. The `system` field is a hard contract for response shape — Claude
//    treats it as higher-priority instruction than anything in
//    `messages`. Spelling out the exact line format here ("BUG: <one
//    sentence>", no preamble, no Markdown) is what stops the model
//    from wrapping the answer in "Sure! Here's the bug:" or fenced
//    code, which it does by default.
//
// 2. The `messages` array is a *transcript*, not a single prompt. The
//    one-shot user→assistant pair below primes the format on a known
//    bug (off-by-one in a loop bound) so the third turn answers in
//    the same shape on a code snippet the model has not seen before.
//    This is few-shot prompting; no fine-tuning required.
const result: AnthropicMessageResponse = await anthropic.v1.messages({
  model: "claude-sonnet-4-6",
  max_tokens: 256,
  system:
    "You are a senior TypeScript reviewer. Reply with exactly one line " +
    "in the form: 'BUG: <one-sentence summary>'. No preamble, no code, " +
    "no Markdown.",
  messages: [
    {
      role: "user",
      content:
        "Review this:\n```ts\nfunction firstNonEmpty(xs: string[]): string {\n" +
        "  for (let i = 0; i <= xs.length; i++) {\n" +
        "    if (xs[i]) return xs[i];\n" +
        "  }\n  return '';\n}\n```",
    },
    {
      role: "assistant",
      content:
        "BUG: The loop condition `i <= xs.length` reads one past the " +
        "last index, so `xs[xs.length]` is dereferenced as undefined.",
    },
    {
      role: "user",
      content:
        "Now review this one the same way:\n```ts\n" +
        "async function readAll(stream: ReadableStream<Uint8Array>): " +
        "Promise<Uint8Array> {\n" +
        "  const reader = stream.getReader();\n" +
        "  const chunks: Uint8Array[] = [];\n" +
        "  while (true) {\n" +
        "    const { done, value } = await reader.read();\n" +
        "    if (done) break;\n    chunks.push(value);\n  }\n" +
        "  return Buffer.concat(chunks);\n}\n```",
    },
  ],
});

// 3. `content` is always an array of typed blocks, never a single
//    string. This is the same shape Claude returns when there are
//    `tool_use`, `thinking`, or `image` blocks in the response —
//    treating it uniformly here means tool-using and thinking
//    workflows drop in without restructuring the read path.
const text = result.content
  .filter((b): b is AnthropicTextBlock => b.type === "text")
  .map((b) => b.text)
  .join("")
  .trim();

console.log(text);
// → "BUG: The reader is never released via `reader.releaseLock()`
//    (especially on error), leaving the stream permanently locked."

console.log(
  `model=${result.model} stop=${result.stop_reason} ` +
    `in=${result.usage.input_tokens} out=${result.usage.output_tokens}`,
);
// → "model=claude-sonnet-4-6 stop=end_turn in=268 out=33"
````

**Notes**

- The `system` prompt is treated as a soft-but-strong constraint on
  every turn, not just the first — Claude re-applies it as the
  conversation lengthens, so the format won't drift after 10 turns
  the way a single user-message instruction will. Pass it as a string
  for short rules; pass it as `[{ type: "text", text, cache_control:
  { type: "ephemeral" } }]` to mark it as cacheable when you reuse
  the same long system prompt across many requests.
- Few-shot priming via a fake `assistant` turn is the cheapest
  reliable way to lock output formatting without `tools` or
  structured-output APIs. Claude does not distinguish between turns
  it actually generated and turns you wrote — both are equally
  authoritative context. Keep priming turns *short and exact*; if
  yours doesn't match the system rule character-for-character (e.g. a
  trailing period the system says shouldn't be there), the model
  will hedge.
- `result.content` is a `(AnthropicTextBlock | AnthropicToolUseBlock |
  AnthropicThinkingBlock | …)[]` discriminated union. Filter on
  `b.type === "text"` before reading `.text`; on `b.type ===
  "tool_use"` before reading `.input`; on `b.type === "thinking"`
  before reading `.thinking`. Claude can interleave them in one
  response — e.g. a leading text block, then a thinking block, then
  a tool_use — so always iterate, never assume `content[0]`.
- `usage.input_tokens` includes the *entire* transcript on every
  turn, so a 10-turn conversation pays for the system prompt + 10
  turns of history every time. To amortize a long system prompt
  (>1024 tokens) across many calls, mark it `cache_control:
  ephemeral` and watch `usage.cache_read_input_tokens` rise on calls
  2–N.
- Errors throw `AnthropicError` with `status`, the parsed `body`, and
  the upstream `errorType` ("authentication_error",
  "rate_limit_error", "overloaded_error", …). Wrap with `withRetry`
  from `@apicity/anthropic` for `429` and `529 overloaded_error`,
  which Claude returns under sustained load. Pair with `withFallback`
  to roll over to `claude-haiku-4-5` for non-critical paths.
- Point the same call at a Claude-compatible gateway by passing
  `baseURL` (and a `fetch` wrapper if the backend uses a different
  auth header than `x-api-key`) to `createAnthropic`. The factory's
  request shape is upstream-faithful, so anything that speaks the
  Anthropic Messages wire format — Bedrock proxies, third-party
  gateways, local mocks — works without touching call sites.

## API Reference

27 endpoints across 5 groups. Each method mirrors an upstream URL path.

### files

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.files.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/files/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.files.content</code></b></summary>

<code>GET https://api.anthropic.com/v1/files/{fileId}/content</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.content({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.files.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/files</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.files.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/files/{fileId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.files</code></b></summary>

<code>POST https://api.anthropic.com/v1/files</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.files({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### messages

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.messages.batches.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/messages/batches/{batchId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.messages.batches.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/messages/batches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.messages.batches.results</code></b></summary>

<code>GET https://api.anthropic.com/v1/messages/batches/{batchId}/results</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.results({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.messages.batches.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/messages/batches/{batchId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.batches</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/batches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.batches.cancel</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/batches/{batchId}/cancel</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches.cancel({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.countTokens</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/count_tokens</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.countTokens({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.batches</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/batches</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.batches({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.messages.countTokens</code></b></summary>

<code>POST https://api.anthropic.com/v1/messages/count_tokens</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.messages.countTokens({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### models

<details>
<summary><code>GET</code> <b><code>anthropic.v1.models.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/models</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.models.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.models.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/models/{modelId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.models.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### oauth

<details>
<summary><code>GET</code> <b><code>anthropic.api.oauth.usage</code></b></summary>

<code>GET https://api.anthropic.com/api/oauth/usage</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.api.oauth.usage({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

### skills

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.skills.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/skills/{skillId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>DELETE</code> <b><code>anthropic.v1.skills.versions.del</code></b></summary>

<code>DELETE https://api.anthropic.com/v1/skills/{skillId}/versions/{version}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.versions.del({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.skills.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/skills</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.skills.retrieve</code></b></summary>

<code>GET https://api.anthropic.com/v1/skills/{skillId}</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.retrieve({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>GET</code> <b><code>anthropic.v1.skills.versions.list</code></b></summary>

<code>GET https://api.anthropic.com/v1/skills/{skillId}/versions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.versions.list({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.skills.create</code></b></summary>

<code>POST https://api.anthropic.com/v1/skills</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.create({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

<details>
<summary><code>POST</code> <b><code>anthropic.v1.skills.versions.create</code></b></summary>

<code>POST https://api.anthropic.com/v1/skills/{skillId}/versions</code>

Cost tier: <code>expensive</code>

[Upstream docs ↗](https://docs.anthropic.com/en/api)

```typescript
const res = await anthropic.v1.skills.versions.create({ /* ... */ });
```

Source: [`packages/provider/anthropic/src/anthropic.ts`](src/anthropic.ts)

</details>

## Middleware

```typescript
import { createAnthropic, withRetry } from "@apicity/anthropic";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const models = withRetry(anthropic.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
