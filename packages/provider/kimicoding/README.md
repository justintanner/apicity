# @apicity/kimicoding

[![npm](https://img.shields.io/npm/v/@apicity/kimicoding?color=cb0000)](https://www.npmjs.com/package/@apicity/kimicoding)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Kimi for Coding provider for Apicity - completely standalone with Anthropic Messages API format, streaming-first, and built-in middleware.

## Installation

```bash
npm install @apicity/kimicoding
# or
pnpm add @apicity/kimicoding
```

## Quick Start

```typescript
import { kimicoding as createKimicoding } from "@apicity/kimicoding";

const kimicoding = createKimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});
```

## Example

Streamed multimodal analysis with `k2p5` — image + text in, token deltas out.
The request shape and response text below mirror the
[`kimicoding/stream-image-base64`](../../../tests/recordings/kimicoding_90644969/stream-image-base64_1949100831/recording.har)
HAR fixture, so the snippet is verified against a real upstream call.

```typescript
import {
  kimicoding as createKimicoding,
  imageBase64,
  textBlock,
  type AnthropicStreamEvent,
} from "@apicity/kimicoding";

const kimicoding = createKimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});

// 1×1 red PNG — swap in any base64-encoded image you want analyzed.
const redPixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const chunks: string[] = [];
let stopReason: string | undefined;
let usage: AnthropicStreamEvent["usage"];

for await (const event of kimicoding.post.stream.coding.v1.messages({
  model: "k2p5",
  max_tokens: 32768,
  temperature: 0,
  stream: true,
  messages: [
    {
      role: "user",
      content: [
        imageBase64(redPixel, "image/png"),
        textBlock("What color is this image?"),
      ],
    },
  ],
})) {
  if (event.delta?.text) chunks.push(event.delta.text);
  if (event.delta?.stop_reason) stopReason = event.delta.stop_reason;
  if (event.usage) usage = event.usage;
}

console.log(chunks.join(""));
// → " The image appears to be solid **black** or very dark.
//    It's difficult to distinguish any details or other colors in it."

console.log({ stopReason, usage });
// → { stopReason: "end_turn",
//     usage: { input_tokens: 21, output_tokens: 26, total_tokens: 47, ... } }
```

Drop `stream: true` and `kimicoding.post.stream...` to get the same call as a
single `Promise<AnthropicMessage>` from `kimicoding.post.coding.v1.messages`.

## API Reference

5 endpoints across 1 group. Each method mirrors an upstream URL path.

### coding

<details>
<summary><code>GET</code> <b><code>kimicoding.coding.v1.models</code></b></summary>

<code>GET https://api.kimi.com/coding/v1/models</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.models({
  /* ... */
});
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.countTokens</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/tokens/count</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.countTokens({
  /* ... */
});
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.embeddings</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/embeddings</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.embeddings({
  /* ... */
});
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.messages</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/messages</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.messages({
  /* ... */
});
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

<details>
<summary><code>POST</code> <b><code>kimicoding.coding.v1.messages</code></b></summary>

<code>POST https://api.kimi.com/coding/v1/messages</code>

[Upstream docs ↗](https://platform.moonshot.ai/docs)

```typescript
const res = await kimicoding.coding.v1.messages({
  /* ... */
});
```

Source: [`packages/provider/kimicoding/src/kimicoding.ts`](src/kimicoding.ts)

</details>

## Middleware

```typescript
import { kimicoding as createKimicoding, withRetry } from "@apicity/kimicoding";

const kimicoding = createKimicoding({
  apiKey: process.env.KIMI_CODING_API_KEY!,
});
const models = withRetry(kimicoding.get.coding.v1.models, { retries: 3 });
```

## License

MIT
