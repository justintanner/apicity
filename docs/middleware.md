# Middleware

Every endpoint is a plain `(req, signal?) => Promise<T>` function, and every
package exports `withRetry`, `withFallback`, and `withRateLimit` — generic
wrappers that compose, or you can pass endpoint functions into your own
orchestration layer. (`@apicity/kimicoding` also ships `withStreamRetry` /
`withStreamFallback` for streamed async iterables.)

## `withRetry` — exponential backoff

Retries transient errors (HTTP 429 and 5xx) with configurable backoff:

```ts
import { createOpenAi, withRetry } from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });

const chat = withRetry(openai.v1.chat.completions, {
  retries: 3, // max attempts (default: 2)
  baseMs: 500, // initial delay in ms (default: 300)
  factor: 2, // exponential multiplier (default: 2)
  jitter: true, // randomize delay ±20% (default: true)
});
```

## `withFallback` — multi-provider failover

Tries each function in order; wrappers keep the same signature, so they nest:

```ts
import { createXai, withFallback, withRetry } from "@apicity/xai";

const primary = createXai({ apiKey: process.env.XAI_API_KEY_PRIMARY! });
const backup = createXai({ apiKey: process.env.XAI_API_KEY_BACKUP! });

const image = withFallback([
  withRetry(primary.v1.images.generations, { retries: 2 }),
  withRetry(backup.v1.images.generations, { retries: 1 }),
]);

const result = await image({
  model: "grok-2-image",
  prompt: "A product photo of a small brass desk lamp",
  n: 1,
});
```

## `withRateLimit` — client-side throttling

Bounds requests-per-minute and concurrency through a shared limiter:

```ts
import {
  createOpenAi,
  withRateLimit,
  createRateLimiter,
} from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });
const limiter = createRateLimiter({ rpm: 60, concurrent: 5 });

const chat = withRateLimit(openai.v1.chat.completions, limiter);
```

For opt-in request/response recording, see [HAR capture](har-capture.md).
