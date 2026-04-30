# @apicity/cost

Cross-provider cost & token estimation for the [apicity](https://github.com/justintanner/apicity) monorepo. Wraps each upstream provider's existing **pre-execution** estimate endpoint behind a single factory:

| Provider     | Wraps                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| `openai`     | `POST /v1/responses/input_tokens`                                              |
| `anthropic`  | `POST /v1/messages/count_tokens`                                               |
| `xai`        | `POST /v1/tokenize-text`                                                       |
| `kimicoding` | `POST /coding/v1/tokens/count`                                                 |
| `fal`        | `POST /v1/models/pricing/estimate` (USD), `GET /v1/models/pricing` (rate card) |

This is the only `@apicity/*` package that depends on other workspace packages — it's a deliberate cross-provider helper, not a wrapper for any single upstream API.

## Install

```bash
pnpm add @apicity/cost
```

## Usage

```ts
import { cost } from "@apicity/cost";

const estimator = cost({
  openai: { apiKey: process.env.OPENAI_API_KEY! },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  fal: { apiKey: process.env.FAL_API_KEY! },
});

// Anthropic — exact input token count for a message
const a = await estimator.anthropic!.estimate({
  model: "claude-sonnet-4-5",
  messages: [{ role: "user", content: "Hello" }],
});
console.log(a.input_tokens);

// fal — exact USD estimate for a queued job
const f = await estimator.fal!.estimate({
  endpoint_id: "fal-ai/flux/dev",
  payload: { prompt: "a cat" },
});
console.log(f.total_cost, f.currency);
```

Only providers whose options you pass are populated; the rest are `undefined`.

## Status

**First cut** — methods return each upstream's native response shape. No bundled USD pricing table for token-based providers; multiply token counts by your own rates for now. Unified return shape and rate-card-driven USD math are planned follow-ups.
