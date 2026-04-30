# @apicity/cost

Cross-provider cost & token estimation for the [apicity](https://github.com/justintanner/apicity) monorepo. Returns a USD figure for a planned API call across **every** apicity provider — using the upstream estimate endpoint where one exists, and a bundled hardcoded rate table otherwise.

This is the only `@apicity/*` package that depends on other workspace packages — it's a deliberate cross-provider helper, not a wrapper for any single upstream API.

## Install

```bash
pnpm add @apicity/cost
```

## Usage

```ts
import { cost } from "@apicity/cost";

const c = cost({
  openai: { apiKey: process.env.OPENAI_API_KEY! },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  fal: { apiKey: process.env.FAL_API_KEY! },
  // fireworks/alibaba/elevenlabs/kie/free need NO opts — pure local math
});

// Token-counting providers — hits upstream count-tokens API, multiplies by bundled rate
const a = await c.usd({
  provider: "openai",
  model: "gpt-5",
  text: "Estimate this prompt's cost.",
  maxOutputTokens: 1000,
});
// → { usd: 0.01..., source: "tokens-api+table", breakdown: { inputTokens: 7, outputTokens: 1000, ... } }

// Skip the network call — use chars/4 heuristic
const a2 = await c.usd({
  provider: "openai",
  model: "gpt-5",
  text: "...",
  maxOutputTokens: 1000,
  useHeuristic: true,
});

// fal — defers to upstream USD endpoint, no rate table involved
const f = await c.usd({
  provider: "fal",
  endpoint_id: "fal-ai/flux/dev",
  payload: { unit_quantity: 100 },
});
// → { usd: ..., source: "upstream-usd", rateAsOf: null }

// Per-unit media providers
const e = await c.usd({
  provider: "elevenlabs",
  model: "eleven_flash_v2_5",
  characters: 1500,
});
const k = await c.usd({ provider: "kie", model: "veo3_fast", seconds: 8 });

// free → always $0
const z = await c.usd({ provider: "free" });
```

## Return shape

```ts
interface CostEstimate {
  usd: number;
  currency: "USD";
  source:
    | "upstream-usd" // fal — exact USD from upstream
    | "tokens-api+table" // openai/anthropic/xai — exact tokens × bundled rate
    | "tokens-heuristic+table" // useHeuristic:true, plus fireworks/alibaba/kimicoding (always heuristic)
    | "per-unit-table" // elevenlabs/kie — caller-supplied units × bundled rate
    | "free";
  breakdown: {
    inputTokens?: number;
    outputTokens?: number;
    units?: number;
    unit?: "tokens" | "characters" | "seconds" | "images" | "songs";
    inputUsdPerMillion?: number;
    outputUsdPerMillion?: number;
    perUnitUsd?: number;
  };
  rateAsOf: string | null; // YYYY-MM-DD; null when source=upstream-usd
  warnings: string[]; // non-empty when fallback fired (unknown model, missing maxOutputTokens, etc.)
}
```

`source` is the load-bearing field: callers who want guarantees check `source === "upstream-usd"`. Callers who tolerate ±20% can accept `tokens-api+table` and `per-unit-table`. Heuristic mode (`tokens-heuristic+table`) is rougher — chars/4 ≈ tokens.

## Bundled pricing

Rates are frozen at `PRICING_AS_OF` (currently `2026-04-30`) and shipped in `src/pricing.ts`. They cover the most common model on each provider; calling `usd()` with an unknown model returns `usd: 0` plus a warning, never throws.

To inspect what's bundled:

```ts
import { TOKEN_RATES, PER_UNIT_RATES, PRICING_AS_OF } from "@apicity/cost";
```

Maintenance is manual: re-fetch each upstream's pricing page, edit `pricing.ts`, bump `PRICING_AS_OF`.

## Per-provider sub-namespaces (raw token counts)

For power users who want raw upstream responses (e.g. exact `input_tokens` from anthropic's `count_tokens`), the original per-provider sub-namespaces are still available:

```ts
const tokens = await c.openai!.estimate({ model: "gpt-5", input: "..." });
// → { input_tokens: 7 } (native upstream shape)
```

## Coverage

| Provider     | source                   | Notes                                                                 |
| ------------ | ------------------------ | --------------------------------------------------------------------- |
| `openai`     | `tokens-api+table`       | wraps `POST /v1/responses/input_tokens`                               |
| `anthropic`  | `tokens-api+table`       | wraps `POST /v1/messages/count_tokens`                                |
| `xai`        | `tokens-api+table`       | wraps `POST /v1/tokenize-text`                                        |
| `kimicoding` | `tokens-heuristic+table` | upstream `/coding/v1/tokens/count` returns 404 — local heuristic only |
| `fireworks`  | `tokens-heuristic+table` | no upstream estimate endpoint                                         |
| `alibaba`    | `tokens-heuristic+table` | no upstream estimate endpoint                                         |
| `fal`        | `upstream-usd`           | wraps `POST /v1/models/pricing/estimate`                              |
| `elevenlabs` | `per-unit-table`         | priced per character                                                  |
| `kie`        | `per-unit-table`         | priced per second of video                                            |
| `free`       | `free`                   | always $0                                                             |

## Out of scope

- Anthropic prompt-cache pricing (rates are in the table but `usd()` ignores them — assumes no caching)
- Batch API discount (50% off across providers)
- Tier-based fallback for fireworks (parameter-count brackets)
- Suno per-song pricing on kie (no stable published rate)
- Caller-side `pricingOverrides`
