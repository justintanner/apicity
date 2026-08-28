import type { CostHints } from "../types";
import type { ModelPricing } from "./types";
import { asNumber, asObject, asString, hintSeconds } from "./helpers";

// fal bills image generation per generated image, not per token. Unlike the
// other per-unit providers, the payload carries no model field — the model
// *is* the endpoint path ("fal-ai/nano-banana"), so callers must pass the
// `endpoint` discriminator on the estimate request. Keys below are those
// endpoint ids verbatim.
//
// Two billing shapes appear upstream:
//
//   - per image      — a flat (or resolution-tiered) price per output image.
//   - per megapixel  — price scales with output area, rounded up to the next
//                      whole megapixel per image.
//
// Rates were read from each model's own fal.ai page on the `asOf` date; the
// flux/dev rate additionally matches the recorded
// GET /v1/models/pricing response in tests/recordings/fal_*/pricing_*.

const asOf = "2026-07-20";

// Entries from the ac-h7kvm.7 pricing sweep were read on this later date
// (evidence recorded on bead ac-rx647: page pricingInfoOverride +
// endpointBilling JSON, corroborated by live GET /v1/models/pricing).
const sweepAsOf = "2026-07-22";

// FLUX 3 family, read from each model's fal.ai page pricingInfoOverride and
// its OpenAPI input schema on this date.
const flux3AsOf = "2026-08-21";

// Audio endpoints were read directly from each model's fal.ai pricing card on
// this date.
const audioAsOf = "2026-08-22";

// Seedance 2.5 pricing was re-pulled from fal's pricing API on this date.
const seedance25AsOf = "2026-08-23";

// Wan 3.0 pricing was pulled from fal's pricing API
// (GET /v1/models/pricing?endpoint_id=...) on this date.
const wan30AsOf = "2026-08-25";

// Grok Imagine v1 image pricing was re-pulled from fal's pricing API on this
// date, which is when the folded input component was found to be gone.
const grokImagineV1AsOf = "2026-08-25";

// Google Virtual Try-On pricing was pulled from fal's pricing API
// (GET /v1/models/pricing?endpoint_id=google/virtual-try-on) on this date.
const virtualTryOnAsOf = "2026-08-27";

// Grok Imagine video edit was rechecked against its fal.ai pricing card on
// this date. Both the source-video input and edited output bill for the same
// hinted clip length, so their per-second components can be summed exactly.
const grokEditAsOf = "2026-08-22";

const source = (endpointId: string, on: string = asOf) => ({
  url: `https://fal.ai/models/${endpointId}`,
  asOf: on,
});

// fal's `image_size` is either a named preset or an explicit
// { width, height }. Presets are the documented fal defaults.
const PRESET_DIMENSIONS: Record<string, readonly [number, number]> = {
  square_hd: [1024, 1024],
  square: [512, 512],
  portrait_4_3: [768, 1024],
  portrait_16_9: [576, 1024],
  landscape_4_3: [1024, 768],
  landscape_16_9: [1024, 576],
};

function imageCount(p: Record<string, unknown>): number {
  return asNumber(p.num_images) ?? 1;
}

// Wan 2.7 text-to-image (base and pro) has no `num_images` field — its
// schema caps output with `max_images` instead, so that is the payload's
// only image-count signal.
function maxImageCount(p: Record<string, unknown>): number {
  return asNumber(p.max_images) ?? 1;
}

// Billable megapixels across the whole request. fal rounds each image up to
// the next whole megapixel before charging, so the ceil is applied per image
// and then multiplied by the image count.
//
// When `image_size` is absent, use only an endpoint default verified from that
// endpoint's own fal.ai page. An endpoint with no documented fixed default
// leaves `defaultPreset` undefined and warns instead of silently guessing.
// An `image_size` that is present but unrecognized follows the same warning
// path.
function megapixels(
  p: Record<string, unknown>,
  defaultPreset?: string
): number | undefined {
  const size = p.image_size ?? defaultPreset;
  if (size === undefined) return undefined;

  const preset = asString(size);
  const dims = preset ? PRESET_DIMENSIONS[preset] : undefined;
  const explicit = preset ? undefined : asObject(size);
  const width = dims ? dims[0] : asNumber(explicit?.width);
  const height = dims ? dims[1] : asNumber(explicit?.height);
  if (width === undefined || height === undefined) return undefined;

  return Math.ceil((width * height) / 1_000_000) * imageCount(p);
}

// Resolution tier for models whose per-image price scales with output
// resolution. fal defaults to 1K when the field is omitted.
const resolution = {
  name: "resolution",
  pick: (p: Record<string, unknown>) => asString(p.resolution) ?? "1K",
};

const perImage = (
  endpointId: string,
  usd: number,
  on?: string,
  units: (p: Record<string, unknown>) => number | undefined = imageCount
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units,
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

const perImageByResolution = (
  endpointId: string,
  rates: Record<string, number>,
  on?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [resolution],
  rates,
  source: source(endpointId, on),
});

const perMegapixel = (
  endpointId: string,
  usd: number,
  on?: string,
  defaultPreset?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "megapixels",
  units: (p) => megapixels(p, defaultPreset),
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

const perCharacter = (
  endpointId: string,
  usd: number,
  on: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "characters",
  units: (p) => asString(p.text)?.length,
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------
//
// Every fal video family bills per output second, flat or tiered on payload
// fields (resolution / generate_audio) whose rate keys mirror the upstream
// values verbatim. Duration shapes differ per family — number, digit string,
// "8s"-style enum — so each family gets its own reader rather than one
// guessing parser: an absent optional field falls back to fal's documented
// schema default, while a present-but-unrecognized value returns undefined /
// selects no rate so the estimate warns instead of silently mispricing (the
// megapixels() contract).
//
// Input-media billing components (wan/seedance reference-to-video input
// seconds, grok extend's $0.01/s source-video seconds, grok's $0.002
// image-input surcharge) depend on source media not present in the payload;
// estimates cover the output component only.

// Whole digit-string seconds ("5" → 5). Kling publishes duration as a bare
// string, seedance as a digit-string enum; anything else — "5s", numbers,
// seedance's "auto" — is unrecognized here.
function digitSeconds(d: unknown): number | undefined {
  const s = asString(d);
  return s !== undefined && /^\d+$/.test(s) ? Number(s) : undefined;
}

// Seedance's duration default is "auto" — the model picks the output length —
// so an omitted (or explicit "auto") duration has no billed default to
// assume. A caller who knows the clip length declares it through the
// cost-only hint channel; without either, this still warns.
const seedanceSeconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => digitSeconds(p.duration) ?? hintSeconds(hints);

// Kling duration is a digit string defaulting to "5".
const klingSeconds = (p: Record<string, unknown>): number | undefined =>
  p.duration === undefined ? 5 : digitSeconds(p.duration);

// Veo 3.1 duration is "4s" | "6s" | "8s", defaulting to "8s".
const VEO_SECONDS: Record<string, number> = { "4s": 4, "6s": 6, "8s": 8 };
const veoSeconds = (p: Record<string, unknown>): number | undefined =>
  p.duration === undefined ? 8 : VEO_SECONDS[asString(p.duration) ?? ""];

// Numeric duration (wan, sora 2, grok imagine) with the endpoint's
// documented schema default when omitted.
const numericSeconds =
  (defaultSeconds: number) =>
  (p: Record<string, unknown>): number | undefined =>
    p.duration === undefined ? defaultSeconds : asNumber(p.duration);

// wan edit-video's duration defaults to 0, meaning "match the source
// video" — a length that is not in the payload, so it can only come from the
// caller's cost-only hint channel.
const wanEditSeconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => {
  const n = asNumber(p.duration);
  return n === undefined || n === 0 ? hintSeconds(hints) : n;
};

// FLUX 3 defaults duration to "auto" for text/image/extend variants. Use a
// caller-provided duration hint when the payload has no numeric duration.
const flux3Seconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => asNumber(p.duration) ?? hintSeconds(hints);

// Audio/video operations whose source duration is not part of the request use
// the shared cost-only channel. A missing hint still fails closed.
const hintedSeconds = (
  _p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => hintSeconds(hints);

const resolutionTier = (defaultTier: string) => ({
  name: "resolution",
  pick: (p: Record<string, unknown>) => asString(p.resolution) ?? defaultTier,
});

// Kling v3 and Veo 3.1 bill higher with audio; fal defaults generate_audio
// to true, so an omitted flag selects the audio-on rate.
const generateAudio = {
  name: "generate_audio",
  pick: (p: Record<string, unknown>) =>
    typeof p.generate_audio === "boolean" ? String(p.generate_audio) : "true",
};

const perSecond = (
  endpointId: string,
  usd: number,
  seconds: (
    p: Record<string, unknown>,
    hints?: CostHints
  ) => number | undefined,
  on: string = sweepAsOf
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

const perSecondTiered = (
  endpointId: string,
  select: ReadonlyArray<{
    name: string;
    pick: (payload: Record<string, unknown>) => string | undefined;
  }>,
  rates: Record<string, number>,
  seconds: (
    p: Record<string, unknown>,
    hints?: CostHints
  ) => number | undefined,
  on: string = sweepAsOf
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select,
  rates,
  source: source(endpointId, on),
});

// Seedance 2.0 bills tokens — height × width × 24 / 1024 per output second —
// at $0.014/1000 tokens ($0.0112 fast). The rates below are the page's own
// per-second simplification at 16:9 output: 480p (864×480) → 9720 tokens/s,
// 720p (1280×720) → 21600 tokens/s.
const seedanceRates = (usdPerThousandTokens: number) => ({
  "480p": (9720 / 1000) * usdPerThousandTokens,
  "720p": (21600 / 1000) * usdPerThousandTokens,
});

// Seedance 2.5 bills output tokens at a flat $0.0214/1000 tokens according to
// GET https://api.fal.ai/v1/models/pricing, freshly pulled 2026-08-23.
// tokens/s = width × height × 24 / 1024 at 16:9: 480p (864×480) → 9720,
// 720p (1280×720) → 21600, and 1080p (1920×1080) → 48600 tokens/s.
// A 2026-08-22 observation of ≈$0.0234/1000 tokens at 1080p is superseded by
// that authoritative flat-price pull. Reference-clip input tokens are metered
// upstream but their duration is not a request field, so estimates cover only
// the output component. The published token formula has no audio term; all
// observed fal Seedance recordings are audio-off, so equal audio-on billing is
// an explicit but unverified assumption rather than a separate invented axis.
const seedance25Rates = (usdPerThousandTokens: number) => ({
  "480p": (9720 / 1000) * usdPerThousandTokens,
  "720p": (21600 / 1000) * usdPerThousandTokens,
  "1080p": (48600 / 1000) * usdPerThousandTokens,
});

// Reference-to-video applies a ×0.6 price multiplier when video inputs are
// present. The input videos' own tokens are also metered upstream but their
// length is not in the payload — output component only.
const seedanceVideoInput = {
  name: "video_urls",
  pick: (p: Record<string, unknown>) =>
    Array.isArray(p.video_urls) && p.video_urls.length > 0
      ? "video"
      : undefined,
};

const seedanceReferenceRates = (usdPerThousandTokens: number) => {
  const base = seedanceRates(usdPerThousandTokens);
  return {
    ...base,
    "480p|video": base["480p"] * 0.6,
    "720p|video": base["720p"] * 0.6,
  };
};

const seedance25ReferenceRates = (usdPerThousandTokens: number) => {
  const base = seedance25Rates(usdPerThousandTokens);
  return {
    ...base,
    "480p|video": base["480p"] * 0.6,
    "720p|video": base["720p"] * 0.6,
    "1080p|video": base["1080p"] * 0.6,
  };
};

// Rate tables shared by the variants of one family — the generation/edit
// twins and the text-to-video/image-to-video pairs bill identically, so each
// grid is named once. Sharing by reference is safe (compute.ts only reads
// `entry.rates[variantKey]`) and it keeps a re-sweep from updating one half
// of a pair while its twin silently keeps the old price.
const NANO_BANANA_2_RATES: Record<string, number> = {
  "0.5K": 0.06,
  "1K": 0.08,
  "2K": 0.12,
  "4K": 0.16,
};

const NANO_BANANA_PRO_RATES: Record<string, number> = {
  "1K": 0.15,
  "2K": 0.15,
  "4K": 0.3,
};

const WAN_2P7_VIDEO_RATES: Record<string, number> = {
  "720p": 0.1,
  "1080p": 0.15,
};

const KLING_V3_PRO_RATES: Record<string, number> = {
  true: 0.168,
  false: 0.112,
};

const KLING_V3_STANDARD_RATES: Record<string, number> = {
  true: 0.126,
  false: 0.084,
};

const VEO_3P1_RATES: Record<string, number> = {
  "720p|false": 0.2,
  "720p|true": 0.4,
  "1080p|false": 0.2,
  "1080p|true": 0.4,
  "4k|false": 0.4,
  "4k|true": 0.6,
};

const FLUX_3_RATES: Record<string, number> = {
  "720p": 0.17,
  "1080p": 0.29,
};

const FLUX_3_EXTEND_RATES: Record<string, number> = {
  "720p": 0.41,
  "1080p": 0.53,
};

// GPT Image 1.5 prices per image on a quality × size grid. `quality`
// defaults to "high"; the generation endpoint defaults `image_size` to
// 1024x1024 while the edit endpoint defaults it to "auto", which has no
// fixed row — an omitted or "auto" size on edit surfaces as a warning
// instead of a guessed square rate. The prompt-dependent token components
// (text in $0.005/1k, text out $0.010/1k, image in $0.008/1k on edit) are
// excluded from the static per-image estimate.
const GPT_IMAGE_1P5_RATES: Record<string, number> = {
  "low|1024x1024": 0.009,
  "low|1536x1024": 0.013,
  "low|1024x1536": 0.013,
  "medium|1024x1024": 0.034,
  "medium|1536x1024": 0.05,
  "medium|1024x1536": 0.051,
  "high|1024x1024": 0.133,
  "high|1536x1024": 0.199,
  "high|1024x1536": 0.2,
};

const gptImagePerImage = (
  endpointId: string,
  defaultSize: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [
    {
      name: "quality",
      pick: (p) => asString(p.quality) ?? "high",
    },
    {
      name: "image_size",
      pick: (p) => asString(p.image_size) ?? defaultSize,
    },
  ],
  rates: GPT_IMAGE_1P5_RATES,
  source: source(endpointId, sweepAsOf),
});

// Endpoints whose fal pricing is genuinely dynamic — the price is not
// derivable from the request payload at estimate time, so they are
// deliberately absent from the table below (and from MODEL_SLUGS.fal, which
// must stay key-identical to it). The estimate reports them as unpriced
// instead of guessing; the true price comes from fal's
// POST /v1/models/pricing/estimate API.
//
//   - alibaba/qwen-image-3/text-to-image, alibaba/qwen-image-3/edit: billed
//     per COMPUTE SECOND (USD 0.00017) as rechecked 2026-08-25 against fal's
//     own pricing API (GET /v1/models/pricing?endpoint_id=...). Compute
//     seconds are not a request field and cannot be derived from image_size,
//     image_urls, or num_images, so a static per-image rate would be invented.
//     The model page states 1K/2K tier rates but publishes no selector mapping
//     from image_size to a tier; the pricing API reports one flat
//     compute-second price for both operations and no tier at all, so the
//     tiers are not actionable either.
//   - xai/grok-imagine-image/v2.0/edit,
//     xai/grok-imagine-image/v2.0/text-to-image: billed per COMPUTE SECOND
//     (USD 0.00017) as rechecked 2026-08-23 against fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=...). Compute seconds are not a
//     request field and cannot be derived from quality, resolution, or
//     num_images or image_urls, so a static per-image rate would be invented.
//   - google/nano-banana-2-lite, google/nano-banana-lite/edit: billed purely
//     per token as rechecked 2026-08-22 (text input/output
//     $0.3125/$1.875 per 1M, image input/output $0.3125/$37.50 per 1M at a
//     fixed 1K size) and fal publishes no tokens-per-image constant, so any
//     static per-image rate would be invented.
//   - blackforestlabs/flux-video-upscale: billed per output second by the
//     delivered resolution and precise/creative mode as rechecked
//     2026-08-22; source duration and dimensions are not request fields, so
//     a static estimate would guess.
//   - alibaba/wan-3.0/text-to-video, alibaba/wan-3.0/image-to-video,
//     alibaba/wan-3.0/reference-to-video: billed per COMPUTE SECOND
//     (USD 0.00017) as pulled 2026-08-25 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=...). The request carries an output
//     `duration`, but compute seconds are wall-clock GPU time — a different
//     unit that no request field determines — so deriving a rate from
//     duration would invent one. The premium `alibaba/wan-3.0-prime/*`
//     siblings bill per OUTPUT second instead and are priced statically below.
//   - topaz/upscale/video/precision: billed on the DELIVERED video — "$0.10
//     per 10 seconds of output at 720p, $0.20 at 1080p, and $0.60 at 4K",
//     pulled 2026-08-28 from the model page, which closes with "the final cost
//     depends on output resolution, duration, and frame rate"; the pricing API
//     reports the same rate as an opaque USD 0.01 per "units". None of those
//     three is a request field: output resolution is the source's own
//     dimensions scaled by `upscale_factor`, duration is the source clip's,
//     and the frame rate is the source's unless `target_fps` overrides it.
//     Per-model multipliers (Proteus Natural, Gaia 2 at half price) ride on
//     top of a base the request cannot supply. Same shape as
//     blackforestlabs/flux-video-upscale above.
export const FAL_DYNAMIC_PRICING_ENDPOINTS = [
  "alibaba/qwen-image-3/edit",
  "alibaba/qwen-image-3/text-to-image",
  "alibaba/wan-3.0/image-to-video",
  "alibaba/wan-3.0/reference-to-video",
  "alibaba/wan-3.0/text-to-video",
  "blackforestlabs/flux-video-upscale",
  "google/nano-banana-2-lite",
  "google/nano-banana-lite/edit",
  "topaz/upscale/video/precision",
  "xai/grok-imagine-image/v2.0/edit",
  "xai/grok-imagine-image/v2.0/text-to-image",
] as const;

export const fal: Record<string, ModelPricing> = {
  // Audio — Seed Speech bills $0.03 per 1,000 input characters. Store the
  // page rate once as $0.00003/character; the request's literal text length is
  // an exact, payload-derivable unit count.
  "fal-ai/bytedance/seed-speech/tts/v2": perCharacter(
    "fal-ai/bytedance/seed-speech/tts/v2",
    0.03 / 1_000,
    audioAsOf
  ),

  // Audio — Scribe V2 bills input audio at $0.008/minute, with a 30% surcharge
  // whenever keyterms are used. The URL payload contains no media duration, so
  // this follows the cross-provider ruling: callers provide the known input
  // length through costHints.durationSeconds and omission fails closed.
  "fal-ai/elevenlabs/speech-to-text/scribe-v2": perSecondTiered(
    "fal-ai/elevenlabs/speech-to-text/scribe-v2",
    [
      {
        name: "keyterms",
        pick: (p) =>
          Array.isArray(p.keyterms) && p.keyterms.length > 0
            ? "keyterms"
            : "base",
      },
    ],
    { base: 0.008 / 60, keyterms: (0.008 * 1.3) / 60 },
    hintedSeconds,
    audioAsOf
  ),

  // Image — Flux (area-priced)
  "fal-ai/flux/dev": perMegapixel(
    "fal-ai/flux/dev",
    0.025,
    undefined,
    "landscape_4_3"
  ),
  "fal-ai/flux/schnell": perMegapixel(
    "fal-ai/flux/schnell",
    0.003,
    undefined,
    "landscape_4_3"
  ),

  // Image — Qwen Image (area-priced)
  "fal-ai/qwen-image": perMegapixel(
    "fal-ai/qwen-image",
    0.02,
    undefined,
    "landscape_4_3"
  ),

  // Image — Google Virtual Try-On (flat per generated try-on image). fal's
  // pricing API reports one unit_price of USD 0.075 per image with no tier
  // and no selector, and `num_images` (1-4, default 1) is the request's exact
  // image count, so the estimate is payload-derivable.
  // Source: GET https://api.fal.ai/v1/models/pricing?endpoint_id=google/virtual-try-on
  "google/virtual-try-on": perImage(
    "google/virtual-try-on",
    0.075,
    virtualTryOnAsOf
  ),

  // Image — Nano Banana (flat per image; edit is priced as generation)
  "fal-ai/nano-banana": perImage("fal-ai/nano-banana", 0.039),
  "fal-ai/nano-banana/edit": perImage("fal-ai/nano-banana/edit", 0.039),

  // Image — Nano Banana 2: 1K base, 0.5K ×0.75, 2K ×1.5, 4K ×2
  "fal-ai/nano-banana-2": perImageByResolution(
    "fal-ai/nano-banana-2",
    NANO_BANANA_2_RATES
  ),

  // Image — Nano Banana Pro: flat until 4K, which bills at double
  "fal-ai/nano-banana-pro": perImageByResolution(
    "fal-ai/nano-banana-pro",
    NANO_BANANA_PRO_RATES
  ),

  // Image — Seedream 5 Lite (flat per image at any supported size)
  "fal-ai/bytedance/seedream/v5/lite/text-to-image": perImage(
    "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    0.035
  ),
  "fal-ai/bytedance/seedream/v5/lite/edit": perImage(
    "fal-ai/bytedance/seedream/v5/lite/edit",
    0.035,
    sweepAsOf
  ),

  // Image — Nano Banana 2 / Pro edit (priced as their generation
  // counterparts, the nano-banana/edit precedent; the page's optional
  // web-search surcharge is prompt-dependent and excluded)
  "fal-ai/nano-banana-2/edit": perImageByResolution(
    "fal-ai/nano-banana-2/edit",
    NANO_BANANA_2_RATES,
    sweepAsOf
  ),
  "fal-ai/nano-banana-pro/edit": perImageByResolution(
    "fal-ai/nano-banana-pro/edit",
    NANO_BANANA_PRO_RATES,
    sweepAsOf
  ),

  // Image — Wan 2.7 (flat per image; the pro tier bills higher). The
  // text-to-image variants count images from `max_images` — their schema
  // has no `num_images`.
  "fal-ai/wan/v2.7/text-to-image": perImage(
    "fal-ai/wan/v2.7/text-to-image",
    0.03,
    sweepAsOf,
    maxImageCount
  ),
  "fal-ai/wan/v2.7/edit": perImage("fal-ai/wan/v2.7/edit", 0.03, sweepAsOf),
  "fal-ai/wan/v2.7/pro/text-to-image": perImage(
    "fal-ai/wan/v2.7/pro/text-to-image",
    0.075,
    sweepAsOf,
    maxImageCount
  ),
  "fal-ai/wan/v2.7/pro/edit": perImage(
    "fal-ai/wan/v2.7/pro/edit",
    0.075,
    sweepAsOf
  ),

  // Image — Grok Imagine v1 (flat per image; the 1k|2k resolution field is not
  // price-tiered). Both operations bill the same flat rate.
  //
  // The edit rate used to carry a folded $0.002 image-input component
  // ($0.02 output + $0.002 input = $0.022 per image), which was only exact for
  // a one-input/one-output call and over-quoted every other shape. A pull of
  // GET https://api.fal.ai/v1/models/pricing on 2026-08-25 reports one flat
  // unit_price of $0.02 per image for BOTH `xai/grok-imagine-image` and
  // `xai/grok-imagine-image/edit` — fal no longer publishes a separate input
  // component, so there is nothing to derive from `image_urls.length` and the
  // folded rate is simply stale. Corrected to the published rate rather than
  // split into an `extra` hook (ac-i25ewx).
  "xai/grok-imagine-image": perImage(
    "xai/grok-imagine-image",
    0.02,
    grokImagineV1AsOf
  ),
  "xai/grok-imagine-image/edit": perImage(
    "xai/grok-imagine-image/edit",
    0.02,
    grokImagineV1AsOf
  ),

  // Image — Hunyuan Image 3 instruct edit (area-priced). image_size defaults
  // to "auto" upstream, which has no fixed dimensions — so an omitted field
  // is as underivable as an explicit "auto" and takes the warning path.
  "fal-ai/hunyuan-image/v3/instruct/edit": perMegapixel(
    "fal-ai/hunyuan-image/v3/instruct/edit",
    0.09,
    sweepAsOf
  ),

  // Image — Qwen Image Edit (area-priced like fal-ai/qwen-image). Its fal.ai
  // page publishes no fixed image_size default, so omission warns rather than
  // assuming the generation endpoint's landscape_4_3 default.
  "fal-ai/qwen-image-edit": perMegapixel(
    "fal-ai/qwen-image-edit",
    0.03,
    sweepAsOf
  ),

  // Image — GPT Image 1.5 (per image on a quality × size grid)
  "fal-ai/gpt-image-1.5": gptImagePerImage("fal-ai/gpt-image-1.5", "1024x1024"),
  "fal-ai/gpt-image-1.5/edit": gptImagePerImage(
    "fal-ai/gpt-image-1.5/edit",
    "auto"
  ),

  // Video — FLUX 3 (Black Forest Labs), resolution-tiered per output second
  "blackforestlabs/flux-3/extend-video": perSecondTiered(
    "blackforestlabs/flux-3/extend-video",
    [resolutionTier("720p")],
    FLUX_3_EXTEND_RATES,
    flux3Seconds,
    flux3AsOf
  ),
  "blackforestlabs/flux-3/text-to-video": perSecondTiered(
    "blackforestlabs/flux-3/text-to-video",
    [resolutionTier("720p")],
    FLUX_3_RATES,
    flux3Seconds,
    flux3AsOf
  ),
  "blackforestlabs/flux-3/image-to-video": perSecondTiered(
    "blackforestlabs/flux-3/image-to-video",
    [resolutionTier("720p")],
    FLUX_3_RATES,
    flux3Seconds,
    flux3AsOf
  ),
  "blackforestlabs/flux-3/first-last-frame-to-video": perSecondTiered(
    "blackforestlabs/flux-3/first-last-frame-to-video",
    [resolutionTier("720p")],
    FLUX_3_RATES,
    numericSeconds(5),
    flux3AsOf
  ),
  "blackforestlabs/flux-3/keyframes-to-video": perSecondTiered(
    "blackforestlabs/flux-3/keyframes-to-video",
    [resolutionTier("720p")],
    FLUX_3_RATES,
    numericSeconds(5),
    flux3AsOf
  ),

  // Video — Seedance 2.0 (token-metered; see seedanceRates)
  "bytedance/seedance-2.0/text-to-video": perSecondTiered(
    "bytedance/seedance-2.0/text-to-video",
    [resolutionTier("720p")],
    seedanceRates(0.014),
    seedanceSeconds
  ),
  "bytedance/seedance-2.0/image-to-video": perSecondTiered(
    "bytedance/seedance-2.0/image-to-video",
    [resolutionTier("720p")],
    seedanceRates(0.014),
    seedanceSeconds
  ),
  "bytedance/seedance-2.0/reference-to-video": perSecondTiered(
    "bytedance/seedance-2.0/reference-to-video",
    [resolutionTier("720p"), seedanceVideoInput],
    seedanceReferenceRates(0.014),
    seedanceSeconds
  ),
  "bytedance/seedance-2.0/fast/text-to-video": perSecondTiered(
    "bytedance/seedance-2.0/fast/text-to-video",
    [resolutionTier("720p")],
    seedanceRates(0.0112),
    seedanceSeconds
  ),
  "bytedance/seedance-2.0/fast/image-to-video": perSecondTiered(
    "bytedance/seedance-2.0/fast/image-to-video",
    [resolutionTier("720p")],
    seedanceRates(0.0112),
    seedanceSeconds
  ),
  "bytedance/seedance-2.0/fast/reference-to-video": perSecondTiered(
    "bytedance/seedance-2.0/fast/reference-to-video",
    [resolutionTier("720p"), seedanceVideoInput],
    seedanceReferenceRates(0.0112),
    seedanceSeconds
  ),

  // Video — Seedance 2.5 (token-metered; see seedance25Rates)
  "bytedance/seedance-2.5/text-to-video": perSecondTiered(
    "bytedance/seedance-2.5/text-to-video",
    [resolutionTier("720p")],
    seedance25Rates(0.0214),
    seedanceSeconds,
    seedance25AsOf
  ),
  "bytedance/seedance-2.5/image-to-video": perSecondTiered(
    "bytedance/seedance-2.5/image-to-video",
    [resolutionTier("720p")],
    seedance25Rates(0.0214),
    seedanceSeconds,
    seedance25AsOf
  ),
  "bytedance/seedance-2.5/reference-to-video": perSecondTiered(
    "bytedance/seedance-2.5/reference-to-video",
    [resolutionTier("720p"), seedanceVideoInput],
    seedance25ReferenceRates(0.0214),
    seedanceSeconds,
    seedance25AsOf
  ),

  // Video — Wan 3.0 Prime bills a flat USD 0.05 per OUTPUT second with no
  // resolution tier (fal's pricing API reports one unit_price for all three
  // operations, pulled 2026-08-25). `duration` is an integer 2-30 defaulting
  // to 5, so an omitted duration is exactly the documented default. An
  // explicit `duration: null` selects smart duration — the model picks the
  // length — which no request field determines, so numericSeconds returns
  // undefined and the estimate fails closed rather than assuming 5.
  "alibaba/wan-3.0-prime/text-to-video": perSecond(
    "alibaba/wan-3.0-prime/text-to-video",
    0.05,
    numericSeconds(5),
    wan30AsOf
  ),
  "alibaba/wan-3.0-prime/image-to-video": perSecond(
    "alibaba/wan-3.0-prime/image-to-video",
    0.05,
    numericSeconds(5),
    wan30AsOf
  ),
  // Reference media is metered upstream too, but its length is not in the
  // payload — output component only, matching wan/v2.7/reference-to-video.
  "alibaba/wan-3.0-prime/reference-to-video": perSecond(
    "alibaba/wan-3.0-prime/reference-to-video",
    0.05,
    numericSeconds(5),
    wan30AsOf
  ),

  // Video — Wan 2.7: t2v/i2v tier on resolution (schema default 1080p);
  // reference-to-video and edit-video bill a flat $0.10/s (the page states
  // no resolution tier for either). Reference-to-video also meters input
  // video seconds — excluded, not in the payload.
  "fal-ai/wan/v2.7/text-to-video": perSecondTiered(
    "fal-ai/wan/v2.7/text-to-video",
    [resolutionTier("1080p")],
    WAN_2P7_VIDEO_RATES,
    numericSeconds(5)
  ),
  "fal-ai/wan/v2.7/image-to-video": perSecondTiered(
    "fal-ai/wan/v2.7/image-to-video",
    [resolutionTier("1080p")],
    WAN_2P7_VIDEO_RATES,
    numericSeconds(5)
  ),
  "fal-ai/wan/v2.7/reference-to-video": perSecond(
    "fal-ai/wan/v2.7/reference-to-video",
    0.1,
    numericSeconds(5)
  ),
  "fal-ai/wan/v2.7/edit-video": perSecond(
    "fal-ai/wan/v2.7/edit-video",
    0.1,
    wanEditSeconds
  ),

  // Video — Kling v3, audio-tiered. The page's third tier — audio with
  // voice control ($0.196/s pro, $0.154/s standard) — has no request field
  // to select on and is not represented.
  "fal-ai/kling-video/v3/pro/text-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/pro/text-to-video",
    [generateAudio],
    KLING_V3_PRO_RATES,
    klingSeconds
  ),
  "fal-ai/kling-video/v3/pro/image-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/pro/image-to-video",
    [generateAudio],
    KLING_V3_PRO_RATES,
    klingSeconds
  ),
  "fal-ai/kling-video/v3/standard/text-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/standard/text-to-video",
    [generateAudio],
    KLING_V3_STANDARD_RATES,
    klingSeconds
  ),
  "fal-ai/kling-video/v3/standard/image-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/standard/image-to-video",
    [generateAudio],
    KLING_V3_STANDARD_RATES,
    klingSeconds
  ),

  // Video — Kling o3 4K (flat; audio on or off bills the same)
  "fal-ai/kling-video/o3/4k/text-to-video": perSecond(
    "fal-ai/kling-video/o3/4k/text-to-video",
    0.42,
    klingSeconds
  ),
  "fal-ai/kling-video/o3/4k/image-to-video": perSecond(
    "fal-ai/kling-video/o3/4k/image-to-video",
    0.42,
    klingSeconds
  ),
  "fal-ai/kling-video/o3/4k/reference-to-video": perSecond(
    "fal-ai/kling-video/o3/4k/reference-to-video",
    0.42,
    klingSeconds
  ),

  // Video — Veo 3.1, resolution × audio tiered: 720p/1080p bill alike,
  // 4k escalates; audio-on (the default) doubles the sub-4k rate.
  "fal-ai/veo3.1": perSecondTiered(
    "fal-ai/veo3.1",
    [resolutionTier("720p"), generateAudio],
    VEO_3P1_RATES,
    veoSeconds
  ),
  "fal-ai/veo3.1/image-to-video": perSecondTiered(
    "fal-ai/veo3.1/image-to-video",
    [resolutionTier("720p"), generateAudio],
    VEO_3P1_RATES,
    veoSeconds
  ),

  // Video — Sora 2 (flat per second; duration enum 4|8|12|16|20, default 4)
  "fal-ai/sora-2/text-to-video": perSecond(
    "fal-ai/sora-2/text-to-video",
    0.1,
    numericSeconds(4)
  ),
  "fal-ai/sora-2/image-to-video": perSecond(
    "fal-ai/sora-2/image-to-video",
    0.1,
    numericSeconds(4)
  ),

  // Video — Grok Imagine, resolution-tiered on output seconds. The flat
  // $0.002 image-input surcharge (i2v/r2v) is excluded — PerUnitPricing has
  // no constant add-on and it is two orders of magnitude below a second of
  // output. extend-video bills the extension `duration`; its schema has no
  // resolution field (output follows the source video), so it carries the
  // 480p output rate — 720p sources bill $0.07/s upstream — and its
  // $0.01/s source-video input seconds are likewise not payload-derivable.
  "xai/grok-imagine-video/image-to-video": perSecondTiered(
    "xai/grok-imagine-video/image-to-video",
    [resolutionTier("720p")],
    { "480p": 0.05, "720p": 0.07 },
    numericSeconds(6)
  ),
  "xai/grok-imagine-video/reference-to-video": perSecondTiered(
    "xai/grok-imagine-video/reference-to-video",
    [resolutionTier("480p")],
    { "480p": 0.05, "720p": 0.07 },
    numericSeconds(8)
  ),
  "xai/grok-imagine-video/extend-video": perSecond(
    "xai/grok-imagine-video/extend-video",
    0.05,
    numericSeconds(6)
  ),
  // Video edit — fal bills the source input at $0.01/s and the output at
  // $0.05/s (480p) or $0.07/s (720p). Output duration matches the source, so
  // the two components sum to $0.06/s and $0.08/s over the caller's known
  // duration hint. `auto` has no published deterministic tier and fails
  // closed, as does an omitted hint.
  "xai/grok-imagine-video/edit-video": perSecondTiered(
    "xai/grok-imagine-video/edit-video",
    [resolutionTier("auto")],
    { "480p": 0.06, "720p": 0.08 },
    hintedSeconds,
    grokEditAsOf
  ),
};
