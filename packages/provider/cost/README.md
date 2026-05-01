# @apicity/cost

Cross-provider cost & token estimation for the [apicity](https://github.com/justintanner/apicity) monorepo. Returns a USD figure for a planned API call across **every** apicity provider — using the upstream estimate endpoint where one exists, and a bundled hardcoded rate table otherwise.

This is the only `@apicity/*` package that depends on other workspace packages — it's a deliberate cross-provider helper, not a wrapper for any single upstream API.

## Install

```bash
pnpm add @apicity/cost
```

## Usage

`c.estimate(req)` accepts the **exact JSON body you would POST to upstream**. The package lightly parses the payload to extract the fields that affect price (model, resolution, duration, message contents, etc.) — so the same object you build for the real generation call doubles as the input to the cost estimate.

```ts
import { cost } from "@apicity/cost";

const c = cost({
  openai: { apiKey: process.env.OPENAI_API_KEY! },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  fal: { apiKey: process.env.FAL_API_KEY! },
  // fireworks / alibaba / elevenlabs / kie / free need NO opts — pure local math
});

// openai chat — same body you'd POST to /v1/chat/completions
const a = await c.estimate({
  provider: "openai",
  payload: {
    model: "gpt-5",
    messages: [{ role: "user", content: "Estimate this prompt's cost." }],
    max_tokens: 1000,
  },
});
// → { usd: 0.01..., source: "tokens-api+table", breakdown: { inputTokens: 7, outputTokens: 1000, ... } }

// Skip the network call — use chars/4 heuristic
const a2 = await c.estimate({
  provider: "openai",
  payload: { model: "gpt-5", messages: [...], max_tokens: 1000 },
  useHeuristic: true,
});

// fal — payload is whatever the chosen endpoint expects; defers to upstream USD endpoint
const f = await c.estimate({
  provider: "fal",
  endpoint_id: "fal-ai/flux/dev",
  payload: { unit_quantity: 100 },
});
// → { usd: ..., source: "upstream-usd", rateAsOf: null }

// kie — the same body you'd POST to /api/v1/jobs/createTask
const k = await c.estimate({
  provider: "kie",
  payload: {
    model: "bytedance/seedance-2",
    input: {
      prompt: "...",
      first_frame_url: "https://...",
      resolution: "720p",
      duration: 8,
      web_search: false,
    },
  },
});
// extractor reads model + input.resolution + first_frame_url presence (i2v)
// + input.duration → seedance-2-720p-i2v rate × 8 seconds

// elevenlabs TTS — payload is the /v1/text-to-speech body
const e = await c.estimate({
  provider: "elevenlabs",
  payload: { model_id: "eleven_flash_v2_5", text: "Hello world" },
});

// free → always $0
const z = await c.estimate({ provider: "free" });
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
    | "per-unit-table" // elevenlabs/kie — payload-derived units × bundled rate
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
  warnings: string[]; // non-empty when fallback fired (unknown model, missing max_tokens, missing duration, etc.)
}
```

`source` is the load-bearing field: callers who want guarantees check `source === "upstream-usd"`. Callers who tolerate ±20% can accept `tokens-api+table` and `per-unit-table`. Heuristic mode (`tokens-heuristic+table`) is rougher — chars/4 ≈ tokens.

## How payloads are parsed

Each provider has a small extractor in `src/extract/` that walks the payload looking for the fields the rate table discriminates on. Unrecognized payloads return `usd: 0` plus a warning rather than throwing — so a missing `input.resolution` on a kie seedance payload, or a model not in the bundled table, produces a diagnosable `CostEstimate` rather than an exception.

For text providers (openai / anthropic / xai / kimicoding / fireworks / alibaba), the extractor flattens the chat `messages` array (or `input` / `prompt` / `text`) into a single string for token counting; non-text content parts (images, audio, tool calls) are dropped.

For kie, the rate table keys are not 1:1 with the payload's `model` field — the extractor rebuilds them from the payload's `input.resolution`, `input.first_frame_url` (i2v vs t2v), and the marketplace model slug. See `src/extract/kie.ts` for the full mapping. Image models (nano-banana-2, gpt-image-2, qwen2, seedream/5-lite, wan/2-7-image) price per image; resolution-tiered families require `input.resolution`.

## Bundled pricing

Rates are frozen at `PRICING_AS_OF` (currently `2026-04-30`) and shipped in `src/pricing.ts`. They cover the most common model on each provider; calling `estimate()` with an unknown model returns `usd: 0` plus a warning, never throws.

To inspect what's bundled:

```ts
import { TOKEN_RATES, PER_UNIT_RATES, PRICING_AS_OF } from "@apicity/cost";
```

Maintenance is manual: re-fetch each upstream's pricing page, edit `pricing.ts`, bump `PRICING_AS_OF`.

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
| `kie`        | `per-unit-table`         | priced per second of video / per image                                |
| `free`       | `free`                   | always $0                                                             |

## Out of scope

- Anthropic prompt-cache pricing (rates are in the table but `estimate()` ignores them — assumes no caching)
- Batch API discount (50% off across providers)
- Tier-based fallback for fireworks (parameter-count brackets)
- Suno per-song pricing on kie (no stable published rate)
- Caller-side `pricingOverrides`
