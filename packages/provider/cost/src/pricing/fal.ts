import type { ModelPricing } from "./types";
import { asNumber, asObject, asString } from "./helpers";

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

const source = (endpointId: string) => ({
  url: `https://fal.ai/models/${endpointId}`,
  asOf,
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

// Billable megapixels across the whole request. fal rounds each image up to
// the next whole megapixel before charging, so the ceil is applied per image
// and then multiplied by the image count.
//
// When `image_size` is absent the caller gets fal's model default, which is
// ~1 MP for every model priced this way — so we assume 1 MP/image rather
// than refusing to estimate. An `image_size` that is present but
// unrecognized returns undefined, which surfaces as a warning instead of a
// silently wrong number.
function megapixels(p: Record<string, unknown>): number | undefined {
  const size = p.image_size;
  if (size === undefined) return imageCount(p);

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

const perImage = (endpointId: string, usd: number): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [],
  rates: { "": usd },
  source: source(endpointId),
});

const perImageByResolution = (
  endpointId: string,
  rates: Record<string, number>
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [resolution],
  rates,
  source: source(endpointId),
});

const perMegapixel = (endpointId: string, usd: number): ModelPricing => ({
  kind: "perUnit",
  unit: "megapixels",
  units: megapixels,
  select: [],
  rates: { "": usd },
  source: source(endpointId),
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

const videoAsOf = "2026-07-22";

const videoSource = (endpointId: string) => ({
  url: `https://fal.ai/models/${endpointId}`,
  asOf: videoAsOf,
});

// Whole digit-string seconds ("5" → 5). Kling publishes duration as a bare
// string, seedance as a digit-string enum; anything else — "5s", numbers,
// seedance's "auto" — is unrecognized here.
function digitSeconds(d: unknown): number | undefined {
  const s = asString(d);
  return s !== undefined && /^\d+$/.test(s) ? Number(s) : undefined;
}

// Seedance's duration default is "auto" — the model picks the output length —
// so an omitted (or explicit "auto") duration has no billed default to
// assume and must warn.
const seedanceSeconds = (p: Record<string, unknown>): number | undefined =>
  digitSeconds(p.duration);

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
// video" — a length that is not in the payload, so nothing is derivable.
const wanEditSeconds = (p: Record<string, unknown>): number | undefined => {
  const n = asNumber(p.duration);
  return n === undefined || n === 0 ? undefined : n;
};

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
  seconds: (p: Record<string, unknown>) => number | undefined
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [],
  rates: { "": usd },
  source: videoSource(endpointId),
});

const perSecondTiered = (
  endpointId: string,
  select: ReadonlyArray<{
    name: string;
    pick: (payload: Record<string, unknown>) => string | undefined;
  }>,
  rates: Record<string, number>,
  seconds: (p: Record<string, unknown>) => number | undefined
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select,
  rates,
  source: videoSource(endpointId),
});

// Seedance 2.0 bills tokens — height × width × 24 / 1024 per output second —
// at $0.014/1000 tokens ($0.0112 fast). The rates below are the page's own
// per-second simplification at 16:9 output: 480p (864×480) → 9720 tokens/s,
// 720p (1280×720) → 21600 tokens/s.
const seedanceRates = (usdPerThousandTokens: number) => ({
  "480p": (9720 / 1000) * usdPerThousandTokens,
  "720p": (21600 / 1000) * usdPerThousandTokens,
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

// Endpoints whose price cannot be derived from the request payload — by
// design they appear in neither PRICING.fal nor MODEL_SLUGS.fal, so the
// estimate reports them as unpriced instead of guessing; the true price
// comes from fal's POST /v1/models/pricing/estimate API.
//
//   - xai/grok-imagine-video/edit-video: billed per output second at
//     $0.05/s (480p) / $0.07/s (720p) plus $0.01/s of source-video input,
//     but the schema has no duration field — the output length equals the
//     source video's length, which is not a request field.
export const FAL_DYNAMIC_PRICED_ENDPOINTS: readonly string[] = [
  "xai/grok-imagine-video/edit-video",
];

export const fal: Record<string, ModelPricing> = {
  // Image — Flux (area-priced)
  "fal-ai/flux/dev": perMegapixel("fal-ai/flux/dev", 0.025),
  "fal-ai/flux/schnell": perMegapixel("fal-ai/flux/schnell", 0.003),

  // Image — Qwen Image (area-priced)
  "fal-ai/qwen-image": perMegapixel("fal-ai/qwen-image", 0.02),

  // Image — Nano Banana (flat per image; edit is priced as generation)
  "fal-ai/nano-banana": perImage("fal-ai/nano-banana", 0.039),
  "fal-ai/nano-banana/edit": perImage("fal-ai/nano-banana/edit", 0.039),

  // Image — Nano Banana 2: 1K base, 0.5K ×0.75, 2K ×1.5, 4K ×2
  "fal-ai/nano-banana-2": perImageByResolution("fal-ai/nano-banana-2", {
    "0.5K": 0.06,
    "1K": 0.08,
    "2K": 0.12,
    "4K": 0.16,
  }),

  // Image — Nano Banana Pro: flat until 4K, which bills at double
  "fal-ai/nano-banana-pro": perImageByResolution("fal-ai/nano-banana-pro", {
    "1K": 0.15,
    "2K": 0.15,
    "4K": 0.3,
  }),

  // Image — Seedream 5 Lite (flat per image at any supported size)
  "fal-ai/bytedance/seedream/v5/lite/text-to-image": perImage(
    "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    0.035
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

  // Video — Wan 2.7: t2v/i2v tier on resolution (schema default 1080p);
  // reference-to-video and edit-video bill a flat $0.10/s (the page states
  // no resolution tier for either). Reference-to-video also meters input
  // video seconds — excluded, not in the payload.
  "fal-ai/wan/v2.7/text-to-video": perSecondTiered(
    "fal-ai/wan/v2.7/text-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.1, "1080p": 0.15 },
    numericSeconds(5)
  ),
  "fal-ai/wan/v2.7/image-to-video": perSecondTiered(
    "fal-ai/wan/v2.7/image-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.1, "1080p": 0.15 },
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
    { true: 0.168, false: 0.112 },
    klingSeconds
  ),
  "fal-ai/kling-video/v3/pro/image-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/pro/image-to-video",
    [generateAudio],
    { true: 0.168, false: 0.112 },
    klingSeconds
  ),
  "fal-ai/kling-video/v3/standard/text-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/standard/text-to-video",
    [generateAudio],
    { true: 0.126, false: 0.084 },
    klingSeconds
  ),
  "fal-ai/kling-video/v3/standard/image-to-video": perSecondTiered(
    "fal-ai/kling-video/v3/standard/image-to-video",
    [generateAudio],
    { true: 0.126, false: 0.084 },
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
    {
      "720p|false": 0.2,
      "720p|true": 0.4,
      "1080p|false": 0.2,
      "1080p|true": 0.4,
      "4k|false": 0.4,
      "4k|true": 0.6,
    },
    veoSeconds
  ),
  "fal-ai/veo3.1/image-to-video": perSecondTiered(
    "fal-ai/veo3.1/image-to-video",
    [resolutionTier("720p"), generateAudio],
    {
      "720p|false": 0.2,
      "720p|true": 0.4,
      "1080p|false": 0.2,
      "1080p|true": 0.4,
      "4k|false": 0.4,
      "4k|true": 0.6,
    },
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
};
