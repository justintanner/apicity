# Middleware

`withRetry`, `withFallback`, and `withRateLimit` are generic wrappers that
compose over any `(req, signal?) => Promise<T>` function, the shape of a
typical endpoint. You can also pass endpoint functions into your own
orchestration layer.

Eleven packages export `withRetry` and `withFallback`: `@apicity/alibaba`,
`anthropic`, `fal`, `fireworks`, `free-media-upload`, `kie`, `kimicoding`,
`openai`, `s3`, `xai`, and `zaicoding`. All of them but `s3` also export
`withRateLimit` and `createRateLimiter`. The wrappers are not tied to their
package, so one imported from any of these also wraps an endpoint of a package
that ships none, such as `youtube.channels.list`. (`@apicity/kimicoding` also
ships `withStreamRetry` / `withStreamFallback` for streamed async iterables.)

## `withRetry` — exponential backoff

Retries transient errors (HTTP 429 and 5xx) with configurable backoff:

```ts
import { createOpenAi, withRetry } from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });

const respond = withRetry(openai.post.v1.responses, {
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

const chat = withFallback([
  withRetry(primary.post.v1.chat.completions, { retries: 2 }),
  withRetry(backup.post.v1.chat.completions, { retries: 1 }),
]);

const result = await chat({
  model: "grok-4",
  messages: [{ role: "user", content: "Describe a small brass desk lamp." }],
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

const respond = withRateLimit(openai.post.v1.responses, limiter);
```

## Leaves that need an arrow function

The wrappers type their target as `(req, signal?) => Promise<T>`, so an
overloaded leaf can fail to compile when passed directly. One example is
`openai.post.v1.chat.completions`, where create and update share one callable.
Wrap an arrow function that picks the overload:

```ts
import {
  createOpenAi,
  withRetry,
  type OpenAiChatRequest,
} from "@apicity/openai";

const openai = createOpenAi({ apiKey: process.env.OPENAI_API_KEY! });

const chat = withRetry(
  (req: OpenAiChatRequest, signal?: AbortSignal) =>
    openai.post.v1.chat.completions(req, signal),
  { retries: 3 }
);
```

A paid KIE or xAI leaf does not fit the wrapper type either: its second
argument is a pay-gate approval, not a signal.

For opt-in request/response recording, see [HAR capture](har-capture.md).
