# @apicity/cost

Cross-provider cost & token estimation for the
[apicity](https://github.com/justintanner/apicity) monorepo: a USD figure for a
planned API call to the billed providers (openai, anthropic, xai, kimicoding,
fireworks, alibaba, kie, elevenlabs — see [Coverage](#coverage)), computed
purely locally from bundled rate tables — no keys, no network.

Zero dependencies, and not a wrapper for any single upstream API — a deliberate
cross-provider helper. Provider packages keep their runtime pay-gate verifier
bundled locally; this package remains the canonical place to estimate costs,
mint OTPs, and document the shared OTP format.

## Install

```bash
npm install @apicity/cost
# or
pnpm add @apicity/cost
```

## Usage

`c.estimate(req)` takes the **exact JSON body you would POST upstream** and
lightly parses out the price-affecting fields (model, resolution, duration,
message contents, etc.) — the object you build for the real call doubles as
the estimate input. A handful of per-second endpoints bill on a length their
request body does not carry; those take it out-of-band via `costHints`, never
inside `payload` — see [Cost-only hints](#cost-only-hints).

```ts
import { createCost } from "@apicity/cost";

const c = createCost(); // no options, no keys — pure local math

// openai chat — same body you'd POST to /v1/chat/completions
const a = c.estimate({
  provider: "openai",
  payload: {
    model: "gpt-5",
    messages: [{ role: "user", content: "Estimate this prompt's cost." }],
    max_tokens: 1000,
  },
});
// → { usd: 0.01..., source: "tokens-heuristic+table", breakdown: { inputTokens: 8, outputTokens: 1000, ... } }

// kie — same body you'd POST to /api/v1/jobs/createTask
const k = c.estimate({
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
// rate entry reads model + input.resolution + reference-video presence
// + input.duration. A first_frame_url is an image seed, not a video input, so
// this payload prices in the "no video input" column → 720p|no-video × 8 s.
// Pass input.reference_video_urls to reach the cheaper 720p|video rate.

// kie endpoints whose pricing isn't keyed by payload.model (e.g. Suno) take
// an explicit `endpoint` discriminator that wins the pricing lookup
const s = c.estimate({
  provider: "kie",
  endpoint: "suno/generate",
  payload: { model: "V5_5", prompt: "..." },
});

// elevenlabs TTS — payload is the /v1/text-to-speech body
const e = c.estimate({
  provider: "elevenlabs",
  payload: { model_id: "eleven_flash_v2_5", text: "Hello world" },
});

// free → always $0
const z = c.estimate({ provider: "free-media-upload" });
```

`estimate()` is synchronous — nothing to await.

## Return shape

```ts
interface CostEstimate {
  usd: number;
  currency: "USD";
  source:
    | "tokens-heuristic+table" // openai/anthropic/xai/kimicoding/fireworks/alibaba — chars/4 ≈ tokens × bundled rate
    | "declared-tokens+table" // costHints token counts × bundled rate (declared openai usage, kie Gemini TTS)
    | "per-unit-table" // elevenlabs/kie — payload-derived units × bundled rate
    | "free";
  breakdown: {
    inputTokens?: number;
    outputTokens?: number;
    units?: number;
    unit?:
      | "tokens"
      | "characters"
      | "seconds"
      | "images"
      | "songs"
      | "generations";
    inputUsdPerMillion?: number;
    outputUsdPerMillion?: number;
    perUnitUsd?: number;
    // declared openai usage only — see "Declared usage (openai)"
    cacheReadInputTokens?: number;
    cacheWriteInputTokens?: number;
    cacheReadUsdPerMillion?: number;
    cacheWriteUsdPerMillion?: number;
    contextTier?: "short" | "long";
  };
  rateAsOf: string | null; // YYYY-MM-DD — the rate entry's as-of date, falling back to PRICING_AS_OF
  warnings: string[]; // non-empty when fallback fired (unknown model, missing max_tokens, missing duration, etc.)
}
```

`source` is the load-bearing field: `per-unit-table` is exact when the bundled
rate is current; `tokens-heuristic+table` (chars/4 ≈ tokens) is rougher —
treat it as ±20%. Nothing calls upstream.

## How payloads are parsed

Each provider has a small extractor in `src/extract/` that pulls the fields
the rate table discriminates on. Unrecognized payloads return `usd: 0` plus a
warning instead of throwing — a missing `input.resolution` on a kie seedance
payload, or a model not in the bundled table, yields a diagnosable
`CostEstimate`, never an exception.

Text providers (openai / anthropic / xai / kimicoding / fireworks / alibaba):
the extractor flattens the chat `messages` array (or `input` / `prompt` /
`text`) into one string for token counting; non-text content parts (images,
audio, tool calls) are dropped.

Per-unit providers (kie / elevenlabs): payload-shape knowledge lives in each
rate entry's closures in `src/pricing/kie.ts` / `src/pricing/elevenlabs.ts` —
`units(payload)` derives the billable quantity (seconds, characters, images)
and ordered `select` pickers resolve the rate variant from fields like
`input.resolution` and `input.reference_video_urls` (video vs no-video for the
seedance-2 family — an image seed is not a video input). Image models
price per image; resolution-tiered families require `input.resolution`;
endpoint-keyed pricing (e.g. Suno) uses the `EstimateRequest.endpoint`
discriminator instead of `payload.model`. `endpoint` and `costHints` are the
only two estimate inputs that are not read out of `payload` — see
[Cost-only hints](#cost-only-hints) for the second.

## Cost-only hints

Some upstream endpoints bill per second of output while their request schema
carries **no duration field at all** — the length follows a source or driving
asset (a video to lip-sync, an audio track, a model-fixed clip). Upstream
infers it; the caller usually knows it; the payload has nowhere to put it.
`costHints` is that channel:

```ts
interface CostHints {
  durationSeconds?: number;
  inputDurationSeconds?: number;
  aspectRatio?:
    | "21:9"
    | "16:9"
    | "4:3"
    | "1:1"
    | "3:4"
    | "9:16"
    | (string & {});
  googleFlowPlan?: "plus" | "pro" | "ultra-99" | "ultra" | (string & {});
  inputTokens?: number;
  outputTokens?: number;
  cacheReadInputTokens?: number;
  cacheWriteInputTokens?: number;
  serviceTier?: string;
  regionalProcessing?: boolean;
}
```

It is a sibling of `payload` on `EstimateRequest`, not a field inside it:

```ts
const est = c.estimate({
  provider: "kie",
  payload: {
    model: "omnihuman-1-5",
    input: { image_url: "...", audio_url: "..." },
  },
  costHints: { durationSeconds: 8 }, // driving-audio length, known to the caller
});
// → { usd: 1.08, source: "per-unit-table", breakdown: { units: 8, unit: "seconds", perUnitUsd: 0.135 }, ... }
```

Without the hint the same call returns `usd: 0` plus a missing-units warning —
`omnihuman-1-5` has no schema field the estimator could read instead.

**`costHints` is not part of the upstream body.** It is read only by the local
rate tables: never sent upstream, never merged or copied into a request, never
canonicalized, and never hashed. That is the point of keeping it out of
`payload` — see [Hash and OTP guarantee](#hash-and-otp-guarantee) below.

### Precedence

Duration resolves in a fixed order (kie):

1. **`payload.input.duration`** — the upstream wire field, what kie actually
   bills. Present-but-uncoercible stops here rather than falling through, so a
   malformed wire value never silently prices off another tier.
2. **`costHints.durationSeconds`** — this channel. A zero, negative or
   non-numeric hint counts as absent.
3. **`payload.duration`** — the **deprecated** top-level convention from
   0.8.0. Still honoured, so existing callers keep their current estimate, but
   new code should use `costHints.durationSeconds`.

On `xai`, top-level `payload.duration` _is_ the real wire field
(`v1/videos/generations` posts it), so there the order is `payload.duration`
then `costHints.durationSeconds`; only `v1/videos/edits`, which has no
`duration` in its schema, reaches the hint.

### Endpoints that need it

| Provider | Pricing key                             | Length follows                           |
| -------- | --------------------------------------- | ---------------------------------------- |
| `kie`    | `veo3` / `veo3_fast`                    | model-fixed clip                         |
| `kie`    | `happyhorse/video-edit`                 | source `video_url`, billed on both sides |
| `kie`    | `kling-3.0/motion-control`              | motion video                             |
| `kie`    | `omnihuman-1-5`                         | driving audio                            |
| `kie`    | `volcengine/video-to-video-lip-sync`    | source video                             |
| `xai`    | `v1/videos/edits`                       | source video                             |
| `fal`    | `fal-ai/wan/v2.7/edit-video`            | source video                             |
| `fal`    | Seedance 2.0 / 2.5, duration `"auto"`   | the model's pick                         |
| `fal`    | `bytedance/seedance-2.5/draft/complete` | the draft, with `aspectRatio`            |

wan edit-video defaults `duration` to `0` ("match the source clip"). That is
not a length, so it reaches the hint exactly like an omitted field would. The
fal Seedance entries default `duration` to `"auto"`, which lets the model pick
the length, so an omitted or `"auto"` duration prices only through
`costHints.durationSeconds`, as whole seconds in the endpoint's range (4-15 on
the 2.0 series, 4-30 on 2.5). A completed 2.5 draft keeps the draft's
duration and aspect ratio, and its request carries neither: pass both
`durationSeconds` and `aspectRatio` (see
[Output size](#output-size-fal-seedance) below).

Every other per-second entry reads a real wire duration; passing `costHints`
alongside one is harmless — the wire field wins.

### Input video duration (kie, fal Seedance)

Eight kie entries and three fal Seedance entries bill on **both** sides of
the request. For kie: their product pages
print the rule "(input video duration + output video duration) × unit price"
(Wan 3.0 confirmed 2026-09-16; the Seedance 2 family, Seedance 2.5, HappyHorse
video-edit and MiniMax H3 re-read 2026-09-17), and the input side is a clip
whose length the request never carries — for most of them the summed length of
the `reference_video_urls` clips (Wan 3.0: each 1–15 s, at most 15 s in total;
Seedance 2 / 2 Fast / 2 Mini and MiniMax H3: at most 15 s in total; Seedance
2.5: at most 30 s). `costHints.inputDurationSeconds` is how the caller declares
it:

```ts
const payload = {
  model: "wan/3-0-video",
  input: {
    prompt: "...",
    resolution: "720P",
    duration: 5,
    reference_video_urls: ["https://.../clip.mp4"], // a 10 s clip
  },
};

c.estimate({ provider: "kie", payload });
// → usd: 0, warnings: ["kie 'wan/3-0-video': reference_video_urls carry no clip duration in the request and the page bills (input video duration + output video duration) x rate; declare the clips' total length as costHints.inputDurationSeconds"]

c.estimate({
  provider: "kie",
  payload,
  costHints: { inputDurationSeconds: 10 },
});
// → usd: 1.2, breakdown: { units: 15, unit: "seconds", perUnitUsd: 0.08 } — (5 + 10) s × $0.08
```

Without the hint a reference-video request **fails closed** (`usd: 0` and one
warning naming the field and the hint) rather than quoting the output-only
figure the page says is wrong, and a `reference_video_urls` that is not an
array fails closed the same way. With no video input — text, images, audio, a
document or a link — the hint is ignored and the estimate is unchanged, exactly
as `costHints.durationSeconds` is ignored beside a wire `duration`. Output
seconds still resolve as above (the wire `duration` first,
`costHints.durationSeconds` for the `-1` sentinel), so a sentinel request with
clips needs both hints. A zero, negative or non-numeric value counts as absent.
Like every `costHints` field it is cost-only: never merged into `payload`, never
sent upstream, never canonicalized or signed — see [Hash and OTP
guarantee](#hash-and-otp-guarantee) below.

| Provider | Pricing key                                    | Input side follows                                                                            |
| -------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `kie`    | `wan/3-0-video`                                | `reference_video_urls` clip length                                                            |
| `kie`    | `wan/3-0-video-prime`                          | `reference_video_urls` clip length                                                            |
| `kie`    | `bytedance/seedance-2`                         | `reference_video_urls` clip length                                                            |
| `kie`    | `bytedance/seedance-2-fast`                    | `reference_video_urls` clip length                                                            |
| `kie`    | `bytedance/seedance-2-mini`                    | `reference_video_urls` clip length                                                            |
| `kie`    | `bytedance/seedance-2-5`                       | `reference_video_urls` clip length (the "with video" column; audio selects no rate)           |
| `kie`    | `minimax-h3/reference-to-video`                | `reference_video_urls` clip length, plus the image surcharge                                  |
| `kie`    | `happyhorse/video-edit`                        | source `video_url`: the declared `durationSeconds` unless `inputDurationSeconds` overrides it |
| `fal`    | `bytedance/seedance-2.0/us/reference-to-video` | `video_urls` clip length, at least 4 s                                                        |
| `fal`    | `bytedance/seedance-2.5/reference-to-video`    | `video_urls` clip length, at least 4 s                                                        |
| `fal`    | `bytedance/seedance-2.5/us/reference-to-video` | `video_urls` clip length, at least 4 s                                                        |

The fal Seedance entries bill the clips' frames (24 per declared second) at
the output's size, then multiply the whole count by 0.6. A clip length under
4 s fails closed, and an images- or audio-only reference bills the output
alone. `bytedance/seedance-2.5/draft/complete` reads the same field as the
draft's clip length: a valid value prices the completion with video inputs.

`happyhorse/video-edit` needs no second hint in the common case: the output
matches the source clip, so `{ durationSeconds: 6 }` alone prices 12 s
(`(6 + 6) × $0.14 = $1.68` at 720p); pass `inputDurationSeconds` when the two
lengths differ. `bytedance/seedance-2-5`'s "with video" / "no video" columns
follow the same field, so its schema defaults (audio on, no video) price in
the "no video" cell at `5 × $0.315`; the docs' audio surcharge is unpublished
and not modelled.

**Not modelled: `kling-3.0-omni/reference-to-video` and
`kling-3.0-omni/transformation`.** Their page tabs print a "with video input"
per-second tier and no input-duration rule (re-read 2026-09-16 and
2026-09-17), and the committed transformation recording
(`kling-30-omni-transformation_2355785254`: a 5-second source clip, 720p)
billed 100 credits = 5 s × 20 credits/s — the output seconds alone, where the
rule would bill 200. Both entries keep billing output seconds at the
video-input tier, and `inputDurationSeconds` is ignored for them.

### Output size (fal Seedance)

fal bills Seedance 2.0, 2.0 Fast and 2.5 in tokens of the delivered video:
`width x height x frames / 1024` at each card's rate per 1000 tokens. Width
and height come from ByteDance's published output-size table for the model,
resolution and aspect ratio (BytePlus ModelArk video-generation tutorial,
read 2026-10-17), and frames are `24 x duration + 1`, the 97 frames every
recorded "4" s call delivered. So an estimate needs an explicit resolution
(default `720p`), a fixed `aspect_ratio` (`21:9`, `16:9`, `4:3`, `1:1`, `3:4`
or `9:16`) and a digit duration or `costHints.durationSeconds`:

```ts
c.estimate({
  provider: "fal",
  endpoint: "bytedance/seedance-2.0/text-to-video",
  payload: {
    prompt: "...",
    resolution: "720p",
    aspect_ratio: "16:9",
    duration: "5",
  },
});
// → usd: 1.5246, breakdown: { units: 108900, unit: "tokens", perUnitUsd: 0.000014 } — 1280 x 720 x 121 / 1024 tokens at $0.014 / 1000
```

These fail closed (`usd: 0` and one warning naming the cause or the hint):
`aspect_ratio` `"auto"` (the default), duration `"auto"` without the hint,
reference clips without `inputDurationSeconds` or shorter than 4 s, 2.5
reference-to-video `task` `"editing"` or `"extension"`, 2.0 US above 720p
(its card publishes no rate there), 2.0 US reference-to-video without
`video_urls`, and a completed draft without `durationSeconds` or
`aspectRatio`. 2.5's `draft: true` prices as 480p, and audio, bitrate and
codec never change the price.

Four ids stay on `FAL_DYNAMIC_PRICING_ENDPOINTS`: 2.0 and 2.0 Fast
reference-to-video (unrecorded, and 2.0 US reference divides by 1000 where
its card says 1024), and 2.5 and 2.5 US image-to-video, whose output follows
the input image's aspect.

### Plan tier (googleflow)

`googleflow` bills in **Google Flow credits**, not USD, so a USD estimate is
`credits x the plan's credit value`. Four Google AI plan tiers set that value,
and — where upstream documents it — the per-generation credit cost:

| Tier            | Plan                                             | Credit value    | Notes                                                |
| --------------- | ------------------------------------------------ | --------------- | ---------------------------------------------------- |
| `plus`          | Google AI Plus, $7.99/mo, 200 credits            | `$0.04`/credit  | The non-Ultra credit costs.                          |
| `pro` (default) | Google AI Pro, $19.99/mo, 1,000 credits          | `$0.02`/credit  | The non-Ultra credit costs.                          |
| `ultra-99`      | Google AI Ultra $99, $99.99/mo, 10,000 credits   | `$0.01`/credit  | Veo Lite/Fast credit costs are halved (10→5, 20→10). |
| `ultra`         | Google AI Ultra $199, $199.99/mo, 25,000 credits | `$0.008`/credit | Veo Lite/Fast credit costs are halved (10→5, 20→10). |

Each credit value is the plan price divided by its monthly credits, rounded up
as useapi.net rounds it, so the rounding only ever over-estimates. Google's own
credits page calls the two Ultra plans Ultra $100 and Ultra $200; `ultra` keeps
meaning the $199 plan, as it did before `ultra-99` existed.

`costHints.googleFlowPlan` selects the tier. It **defaults to `pro`** when
omitted, so existing callers get byte-for-byte the same estimate as before this
field existed. Pro is not the highest basis: it under-estimates a Plus account
by half, so a Plus caller passes `"plus"`, and a pay-gate that does not know the
plan can pass `"plus"` for the upper bound:

```ts
// default (omitted) — Pro basis
c.estimate({
  provider: "googleflow",
  payload: { model: "veo-3.1-fast", prompt: "a cat" },
}).usd; // → 0.40  (20 credits × $0.02)

// Ultra $199 account
c.estimate({
  provider: "googleflow",
  payload: { model: "veo-3.1-fast", prompt: "a cat" },
  costHints: { googleFlowPlan: "ultra" },
}).usd; // → 0.08  (10 credits × $0.008)
```

Per-model USD by tier (Veo `source.asOf: "2026-07-20"`, `omni-flash` and
images `source.asOf: "2026-10-17"`; the tier credit values were read
2026-10-17):

| Model                             | `plus` USD              | `pro` USD               | `ultra-99` USD          | `ultra` USD                |
| --------------------------------- | ----------------------- | ----------------------- | ----------------------- | -------------------------- |
| `veo-3.1-quality`                 | $4.00                   | $2.00                   | $1.00                   | $0.80                      |
| `veo-3.1-fast`                    | $0.80                   | $0.40                   | $0.10                   | $0.08                      |
| `veo-3.1-lite`                    | $0.40                   | $0.20                   | $0.05                   | $0.04                      |
| `veo-3.1-lite-low-priority`       | $0.00                   | $0.00                   | $0.00                   | $0.00                      |
| `omni-flash` 720p (4/6/8/10s)     | $0.28/$0.40/$0.48/$0.60 | $0.14/$0.20/$0.24/$0.30 | $0.07/$0.10/$0.12/$0.15 | $0.056/$0.08/$0.096/$0.12  |
| `omni-flash` 360p (4/6/8/10s)     | $0.16/$0.20/$0.24/$0.28 | $0.08/$0.10/$0.12/$0.14 | $0.04/$0.05/$0.06/$0.07 | $0.032/$0.04/$0.048/$0.056 |
| `omni-flash` reference-video 720p | $0.80                   | $0.40                   | $0.20                   | $0.16                      |
| `omni-flash` reference-video 360p | $0.40                   | $0.20                   | $0.10                   | $0.08                      |
| image models, per image           | $0.00                   | $0.00                   | $0.00                   | $0.00                      |

`omni-flash` reads `resolution` from the payload: `720p` (the default) or
`360p`, which upstream prices at roughly half the credits. Any other value
fails the estimate with a "no rate for variant" warning, since upstream
rejects it. A reference-video (`referenceVideo_1`) edit is a flat price per
resolution, whatever the duration.

The image models are the `POST /images` ids `nano-banana-2-lite`,
`nano-banana-2`, `nano-banana-pro`, and the deprecated aliases `nano-banana`
and `imagen-4`. Google Flow includes image generation in every plan, so each
image is 0 credits on every tier. `count` (1-4) defaults to 4 images.

For every priced model the tiers are strictly ordered: `plus` > `pro` >
`ultra-99` > `ultra`. The exceptions are the image models and
`veo-3.1-lite-low-priority`, which are `$0` on every tier. That model runs only
on Ultra $199, for zero credits; every other plan is refused upstream before
any credit is drawn.

An **unrecognized** tier falls back to the Plus basis, the highest credit value
(never `$0`, and never an under-charge), and adds a warning naming the value.
Matching is exact, so `"Plus"` or `"ultra-199"` is unrecognized too:

```ts
const est = c.estimate({
  provider: "googleflow",
  payload: { model: "veo-3.1-fast", prompt: "a cat" },
  costHints: { googleFlowPlan: "platinum" },
});
est.usd; // → 0.80  (Plus basis: 20 credits × $0.04)
est.warnings; // → ["googleflow: unknown plan tier 'platinum', using Plus basis"]
```

Like every `costHints` field, `googleFlowPlan` is **cost-only**: it is read only
by the local rate table, never merged into `payload`, never sent upstream, and
never canonicalized or signed — see [Hash and OTP
guarantee](#hash-and-otp-guarantee) below.

### Declared usage (openai)

An OpenAI response reports what it billed in `usage`. Pass those counts as
`costHints` and the openai route prices them exactly, instead of estimating
chars/4 tokens from the payload. Declaring any of `inputTokens`,
`outputTokens`, `cacheReadInputTokens` or `cacheWriteInputTokens` switches an
openai estimate to `source: "declared-tokens+table"`; without them the chars/4
path is unchanged for legacy models. `gpt-5.6-sol` always requires declared
usage.

| `costHints`             | Responses API `usage`                     | Chat Completions `usage`                   |
| ----------------------- | ----------------------------------------- | ------------------------------------------ |
| `inputTokens`           | `input_tokens`                            | `prompt_tokens`                            |
| `cacheReadInputTokens`  | `input_tokens_details.cached_tokens`      | `prompt_tokens_details.cached_tokens`      |
| `cacheWriteInputTokens` | `input_tokens_details.cache_write_tokens` | `prompt_tokens_details.cache_write_tokens` |
| `outputTokens`          | `output_tokens`                           | `completion_tokens`                        |
| `serviceTier`           | `service_tier`                            | `service_tier`                             |

`inputTokens` is the **total** input. The cached and cache-write counts are
subsets of it that never overlap, so the uncached remainder is `inputTokens`
minus both, and no token is billed twice. Do not pass an uncached-only count
as `inputTokens`: subsets larger than the total fail the estimate.
`service_tier` is a top-level response field, outside `usage`.
`outputTokens` already includes reasoning tokens; never add
`reasoning_tokens` on top.

`gpt-5.6-sol` (Standard processing, rates verified 2026-10-19 against
[OpenAI's pricing page](https://developers.openai.com/api/docs/pricing)) is
priced only this way:

| Input tokens in the request | Input | Cached input | Cache writes | Output |
| --------------------------- | ----- | ------------ | ------------ | ------ |
| up to 272,000               | $4.00 | $0.40        | $5.00        | $20.00 |
| more than 272,000           | $8.00 | $0.80        | $10.00       | $30.00 |

USD per million tokens. Above 272,000 total input tokens (cached and
cache-write tokens count toward it) the **whole request** bills at the
long-context rates, and `breakdown.contextTier` says which tier applied. Cache
writes are 1.25x the uncached input rate; GPT-5.6 writes the cache by default,
so both cache counts are required (`0` when the response reports none). These
are OpenAI's promotional prices, available at least through November 21, 2026.

```ts
c.estimate({
  provider: "openai",
  payload: { model: "gpt-5.6-sol", input: "..." },
  costHints: {
    inputTokens: 15_000, // usage.input_tokens
    cacheReadInputTokens: 12_000, // usage.input_tokens_details.cached_tokens
    cacheWriteInputTokens: 3_000, // usage.input_tokens_details.cache_write_tokens
    outputTokens: 500, // usage.output_tokens
  },
}).usd; // → 0.0298  (12,000 × $0.40 + 3,000 × $5 + 500 × $20, per million)
```

Every gap returns `usd: 0` with one warning and no rate in the breakdown, so
`classifyEstimate` reads it as unknown (`prohibitive`), never as cheap:

- `gpt-5.6-sol` with no declared usage: chars/4 cannot see cache writes or
  which side of 272,000 a request falls on.
- A missing count, or one that is not a non-negative integer.
- Cache subsets larger than `inputTokens`.
- A positive cache count on a model with no bundled rate for it (the older
  openai rows carry input and output rates only).
- A service tier other than Standard: `costHints.serviceTier`, else the
  request's `service_tier`, must be absent, `"default"` or `"auto"`. Batch,
  Flex, Fast (`"priority"`/`"fast"`) and Scale prices are not bundled. Pass the
  response's `service_tier`: a project whose default tier is Fast runs
  `"auto"` requests on Fast.
- `regionalProcessing: true`: data-residency (regional processing) and FedRAMP
  endpoints bill a 10% uplift that is not bundled.

### Hash and OTP guarantee

`costHints` lives outside `payload`, so `canonicalHash(payload)` is
byte-identical whether or not you estimate with hints, and an OTP minted for a
payload still verifies after that payload is estimated:

```ts
const payload = {
  model: "omnihuman-1-5",
  input: { image_url: "...", audio_url: "..." },
};
const otp = mintOtp(secret, {
  dotPath: "api.v1.jobs.createTask",
  request: payload,
});

c.estimate({ provider: "kie", payload, costHints: { durationSeconds: 8 } });

// same object, unmodified — the OTP's requestHash still matches
await provider.post.api.v1.jobs.createTask(payload, { otp });
```

One object can safely serve as estimate input, hashed request, and POST body.
Putting the duration inside `payload` instead would either ship a field
upstream never sees or bind the OTP to a hash the real call cannot reproduce.

## Bundled pricing

Rates are frozen at `PRICING_AS_OF` (currently `2026-04-30`; individual
entries may carry their own as-of date) and shipped in `src/pricing/` as
per-provider modules covering each provider's most common models. Unknown
models return `usd: 0` plus a warning, never throw.

```ts
import { PRICING, PRICING_AS_OF } from "@apicity/cost";
```

Maintenance is manual: re-fetch the upstream pricing page, edit the provider's
module in `src/pricing/`, bump `PRICING_AS_OF`.

## Coverage

| Provider                                                           | source                   | Notes                                                                               |
| ------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `openai`, `anthropic`, `xai`, `kimicoding`, `fireworks`, `alibaba` | `tokens-heuristic+table` | chars/4 ≈ tokens — no upstream call                                                 |
| `openai` with declared usage                                       | `declared-tokens+table`  | response `usage` counts; required for `gpt-5.6-sol`                                 |
| `elevenlabs`                                                       | `per-unit-table`         | priced per character                                                                |
| `kie`                                                              | `per-unit-table`         | per second of video / per image / per generation; `endpoint` discriminator for Suno |
| `free`                                                             | `free`                   | always $0                                                                           |

## Dynamically priced fal endpoints

fal endpoints on `FAL_DYNAMIC_PRICING_ENDPOINTS` bill a unit the request does
not fix (compute seconds, output metadata or tokens), so `computeEstimate`
returns `usd: 0` with a warning for them. fal reports the billed units after the
call, in the `x-fal-billable-units` response header. fal's pricing API
(`POST https://api.fal.ai/v1/models/pricing/estimate`, with `FAL_ADMIN_API_KEY`)
prices a quantity, never a request payload. `resolveFalDynamicEstimate` takes
fal's estimator and the quantity to price:

```ts
import { createFal } from "@apicity/fal";
import { resolveFalDynamicEstimate } from "@apicity/cost";

const fal = createFal({ apiKey: process.env.FAL_ADMIN_API_KEY });
const est = await resolveFalDynamicEstimate(
  "alibaba/wan-3.0/text-to-video",
  { prompt: "a red panda", duration: 5 },
  fal.v1.models.pricing.estimate,
  { unitQuantity: 5 } // billed units, e.g. a prior call's x-fal-billable-units
);
```

- `unitQuantity` prices those units at fal's unit price (`unit_price`), with no
  warning.
- `callQuantity` asks for fal's historical average per call
  (`historical_api_price`). It ignores the payload, says so in a warning, and
  can be far from this request's cost.
- With neither, nothing is called: the local `usd: 0` comes back with a warning
  naming both options.

For endpoints whose card and recorded bill have been checked, the
`computeEstimate` warning also names the billed unit and why the request
cannot fix it (`FAL_DYNAMIC_BILLED_UNITS` in `src/pricing/fal.ts`).

Statically priced endpoints never reach the network. `cache` (for example
`createFalEstimateCache({ ttlMs })`) collapses repeat lookups. Its key is the
endpoint, the estimate type and the quantity. A `keyFor` result replaces the
endpoint part, and the estimate type and quantity are always appended.

## Paid endpoint guard (OTP pay gate)

The cost package keeps a small, explicit **paid-endpoint registry** used for
OTP minting and documentation. Provider packages bundle the matching runtime
registry for their own paid endpoints. Endpoints **not** in the registry are
assumed free and need no caller changes.

The gate is **opt-in**. A provider constructed without a pay-gate secret
dispatches its paid endpoints like any other endpoint. Constructing it with a
shared **HMAC secret** arms the gate, and from then on every paid call needs a
**single-use OTP** (one-time password) minted from that secret and bound to the
exact request. An armed gate is fail-closed and does **no** cost estimation —
pure authorization: a paid call cannot fire unless the caller presents a valid,
request-bound OTP. The autonomous caller never holds the secret, so it cannot
self-approve; only the human or code client that holds the secret can mint.
There are **no environment variables and no key files** — the secret is passed
in via factory options (or the CLI's `--paygate-secret-file` /
`APICITY_PAYGATE_SECRET_FILE`).

An OTP presented to a provider built without a secret is refused with
`paygate-not-configured`, never silently dropped: whoever passes one believes a
gate exists. Armed or not, a registry row is the cue to say that a call bills
before making it — it is what `apicity describe` reports as `paid: true`.

### Registry model

- `PAID_ENDPOINTS` is the canonical list: exact `(provider, method, dotPath)`
  triples — no regex, prefix, wildcard, or inferred matching.
- Unlisted endpoints pass through free, with no OTP or configuration.
- Listed endpoints dispatch when the provider was built without a secret, and
  need a valid OTP once a secret arms the gate.

### Token format

OTP tokens are a dependency-free compact envelope:

```text
<base64url(payloadJson)>.<base64url(HMAC-SHA256(payloadSegment, secret))>
```

The signature is HMAC-SHA256 over the exact base64url payload segment bytes,
verified in constant time. Payload schema:

```ts
interface PayGateOtpPayload {
  v: 1; // version
  jti: string; // random 128-bit hex (unique token id)
  provider: string; // e.g. "kie"
  method: string; // e.g. "POST"
  dotPath: string; // e.g. "api.v1.jobs.createTask"
  requestHash: `sha256:${string}`; // sha256 of canonical request JSON
  iat: number; // issued-at unix seconds
  exp: number; // expiration unix seconds
}
```

### Configuration

The code client arms the gate by supplying a `PayGateConfig` via factory
options. Omitting `paygate` leaves the gate off: paid endpoints dispatch with no
OTP, and an OTP passed to one is refused with `paygate-not-configured`. A
config that is supplied but carries an empty `secret` (say
`{ secret: process.env.PAYGATE_SECRET ?? "" }` with the variable unset) does
**not** turn the gate off: every paid call fails closed with
`paygate-not-configured`, with or without an OTP, because whoever supplied the
config meant to arm it.

```ts
interface PayGateConfig {
  secret: string; // shared HMAC secret (the code client holds it)
  replayStore?: ReplayStore; // defaults to an in-process Set, per provider instance
  now?: () => number; // clock injection for tests; defaults to Date.now
}

interface ReplayStore {
  has(jti: string): boolean;
  add(jti: string): void;
}
```

```ts
import { createKie } from "@apicity/kie";

// Gate off: paid endpoints dispatch.
const open = createKie({ apiKey: process.env.KIE_API_KEY! });

// Gate armed: paid endpoints need an OTP minted from this secret.
const provider = createKie({
  apiKey: process.env.KIE_API_KEY!,
  paygate: { secret: loadSecret() }, // from your secret manager / config
});
```

### Minting OTPs

`mintOtp` is pure and env-free — the secret is passed explicitly and the OTP
binds to the exact request via its canonical hash:

```ts
import { mintOtp } from "@apicity/cost";

const otp = mintOtp(secret, {
  dotPath: "api.v1.jobs.createTask", // provider/method resolved from the registry
  request: payload, // bound by canonical hash
  ttl: "10m", // seconds or "10m" / "1h" / "1d"; defaults to 10m
});
```

### Request canonicalization

Before hashing, the payload is canonicalized — serialized to JSON with
recursively **sorted object keys**, array order preserved, non-JSON values
(functions, undefined, circular references) rejected — then SHA-256 hashed and
prefixed `sha256:`. Change any byte of the request and verification fails.

### Replay protection

Each OTP `jti` is single-use. The default `ReplayStore` is an in-process Set
scoped to one provider instance (no files, no `XDG_STATE_HOME`); pass a custom
`replayStore` for cross-process or persistent protection. The `jti` is
consumed **before** dispatch — see [Retry semantics](#retry-semantics).

### Public interface

```ts
interface PayGateApproval {
  otp: string;
}

async function dispatchWithPaidGate<T>(
  provider: string,
  method: string,
  dotPath: string,
  payload: Record<string, unknown>,
  approval: PayGateApproval | undefined,
  dispatch: () => Promise<T>,
  config?: PayGateConfig
): Promise<T>;
```

Paid endpoint APIs accept the approval as a second options object:

```ts
const task = await provider.post.api.v1.jobs.createTask(
  { model: "kling-3.0/video", input: { prompt: "...", duration: "5" } },
  { otp }
);
```

### Guard behavior

Each failed check throws `PayGateError` with the code shown:

1. **Preflight** — endpoints not in `PAID_ENDPOINTS` dispatch immediately.
2. **Configuration** — a provider built without `paygate` has no gate: an OTP
   in `approval` → `paygate-not-configured`; with no OTP the call dispatches
   and no later step runs. A provider built with `paygate` whose `secret` is
   empty → `paygate-not-configured`, with or without an OTP. Every later step
   applies only to an armed gate.
3. **OTP presence** — missing `approval.otp` → `otp-missing`.
4. **Signature** — constant-time HMAC check of the payload segment →
   `otp-invalid-signature` on mismatch.
5. **Expiration** — `exp` in the past → `otp-expired`.
6. **Request binding** — `provider`, `method`, `dotPath`, and `requestHash`
   must match the actual call → `otp-mismatched-request`.
7. **Replay check** — `jti` already in the store → `otp-replayed`.
8. **Consume + dispatch** — the `jti` is recorded, then the HTTP request
   fires.

```ts
import { PayGateError } from "@apicity/cost";

try {
  await provider.post.api.v1.jobs.createTask({ ... }, { otp });
} catch (e) {
  if (e instanceof PayGateError) {
    // e.code: paygate-not-configured | otp-missing | otp-malformed
    //         | otp-invalid-signature | otp-expired
    //         | otp-mismatched-request | otp-replayed
    // paygate-not-configured: an OTP reached a provider built without a
    // secret, or the supplied secret is empty. The rest come from an armed
    // gate.
  } else throw e;
}
```

### Failure modes

| Condition                                       | `PayGateError.code`      |
| ----------------------------------------------- | ------------------------ |
| OTP passed to a provider built without a secret | `paygate-not-configured` |
| Provider built with an empty secret             | `paygate-not-configured` |
| Paid endpoint without OTP (armed)               | `otp-missing`            |
| Malformed envelope                              | `otp-malformed`          |
| Invalid HMAC signature                          | `otp-invalid-signature`  |
| Expired OTP (`exp` < now)                       | `otp-expired`            |
| Mismatched provider/method/dotPath              | `otp-mismatched-request` |
| Mismatched request hash                         | `otp-mismatched-request` |
| Replayed OTP (`jti` seen)                       | `otp-replayed`           |

### CLI: minting OTPs

The `apicity-paygate` binary mints OTPs. The secret is read from a **file**
(never an env var); only the OTP is printed to stdout:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --ttl 10m
```

### Wiring the gate into a custom provider

`@apicity/kie` and `@apicity/xai` bundle their runtime gate locally so the
provider packages stay standalone. This package still exports `withPaidGate`
and `dispatchWithPaidGate` for custom provider trees that want the same
behavior. The walker descends the HTTP-method roots (`post`, `get`, `delete`,
`patch`, `put`) and routes every leaf whose `(provider, method, dotPath)` is in
`PAID_ENDPOINTS` through `dispatchWithPaidGate`; free leaves pass through
unchanged, and schema records and other non-route properties are returned by
reference.

```ts
import { createReplayStore, withPaidGate } from "@apicity/cost";

export function createKie(opts: KieOptions): KieProvider {
  const paygate = opts.paygate
    ? {
        ...opts.paygate,
        replayStore: opts.paygate.replayStore ?? createReplayStore(),
      }
    : undefined;

  // ...build endpoint functions...
  return withPaidGate(
    "kie",
    {
      veo: withPaidGate("kie", createVeoProvider(...), { config: paygate }),
      modelInputSchemas,               // data, untouched
      post: { api: { v1: { jobs: { createTask: Object.assign(createTask, { schema }) } } } },
      get:  { api: { v1: { jobs: { recordInfo } } } },
    },
    { config: paygate }
  );
}
```

The gate is generic for custom trees, but published provider packages should
not depend on `@apicity/cost` for runtime gating.

### Retry semantics

The OTP `jti` is consumed **before** `dispatch()` runs: if dispatch later
fails (network error, upstream 5xx, abort), it stays consumed and the caller
must mint a fresh OTP to retry. This is intentional — otherwise a hostile
caller could replay a single OTP on every transient failure. Each OTP is
single-use authority for one network attempt.

### apicity CLI

`@apicity/cli` is the code client. With no `--paygate-secret-file` and no
`APICITY_PAYGATE_SECRET_FILE`, the gate is off and a paid call goes upstream
directly; an `--otp` on such a host exits 4 `paygate` with
`paygate-not-configured`. Naming a secret file arms the gate: the CLI holds
the secret to **verify** OTPs (it never mints), a human mints an OTP
out-of-band with the same secret, and the caller passes it as `--otp <token>`
on the call — an AI driving the CLI cannot self-approve. A secret file that is
empty is a `usage` error, never a disarmed gate.

### Minimal operator workflow

1. **Arm the gate** (one-time): generate a secret, store it (secret manager /
   file), and pass it as `paygate: { secret }` (or point the CLI's
   `--paygate-secret-file` at it). Skip this step and paid calls dispatch
   without an OTP.
2. **Prepare a request** JSON file.
3. **Mint an OTP** with the [CLI above](#cli-minting-otps).
4. **Pass the OTP to the caller** (copy-paste, secrets manager, etc.).
5. **Caller uses it**:
   ```ts
   await provider.post.api.v1.jobs.createTask({ ... }, { otp: "<paste>" });
   ```

## Out of scope

- Anthropic prompt-cache pricing (rates are in the table but `estimate()` ignores them — assumes no caching)
- Batch API discount (50% off across providers), and OpenAI's Flex, Fast and Scale tiers
- OpenAI's 10% regional-processing (data residency) and FedRAMP uplift
- OpenAI built-in tool fees (web search, file search, containers), billed per call beside tokens
- The `gpt-5.6` alias and `gpt-5.6-terra` / `gpt-5.6-luna`: only the exact `gpt-5.6-sol` id is priced
- The end of a promotional price: the estimator has no clock, so `rateAsOf` dates each rate
- Tier-based fallback for fireworks (parameter-count brackets)
- Suno per-song pricing on kie (no stable published rate)
- Caller-side `pricingOverrides`

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
