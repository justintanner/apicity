import type { CostHints } from "../types";
import type { ModelPricing } from "./types";
import {
  asNumber,
  asObject,
  asString,
  coerceSeconds,
  hintSeconds,
} from "./helpers";

// Source URL is the kie marketplace or product page for the relevant model.
// Rates verified 2026-04-30 unless an entry notes a newer date. Rate keys mirror
// the upstream payload values verbatim
// (kling: payload.input.mode is "std"|"pro"|"4K"; seedance: payload.input.
// resolution is "480p"|"720p"|"1080p"; etc.) — there is no internal
// translation layer between the caller's payload and the rate selector.

const src = (slug: string) => ({ url: `https://kie.ai/market/${slug}` });
const page = (url: string) => ({ url });

// Seconds of output, resolved in a fixed precedence:
//   1. payload.input.duration — the upstream wire field, what kie actually
//      bills. Present-but-uncoercible stops here rather than falling through,
//      so a malformed wire value never silently prices off another tier.
//   2. costHints.durationSeconds — the declared cost-only channel, for models
//      whose schema has no duration field (veo, and the edit/extend endpoints
//      that inherit the source clip's length).
//   3. payload.duration — the deprecated 0.8.0 top-level convention, still
//      honoured so existing callers keep their current estimate.
const seconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => {
  const wire = asObject(p.input)?.duration;
  if (wire !== undefined && wire !== null) return coerceSeconds(wire);
  return hintSeconds(hints) ?? coerceSeconds(p.duration);
};

const inputResolution = (p: Record<string, unknown>): string | undefined =>
  asString(asObject(p.input)?.resolution);

const inputMode = (p: Record<string, unknown>): string | undefined =>
  asString(asObject(p.input)?.mode);

const hasReferenceVideoInput = (p: Record<string, unknown>): boolean => {
  const referenceVideoUrls = asObject(p.input)?.reference_video_urls;
  return Array.isArray(referenceVideoUrls) && referenceVideoUrls.length > 0;
};

const hasVideoListInput = (p: Record<string, unknown>): boolean => {
  const videoList = asObject(p.input)?.video_list;
  return Array.isArray(videoList) && videoList.length > 0;
};

// Rate-key form of the duration. Resolved through `seconds` so the tier order
// can never diverge between units derivation and rate selection — including
// the coerceSeconds (not asNumber) reading that makes a numeric string ("8")
// select the same rate as the number 8 instead of falling to the default.
const durationKey = (
  p: Record<string, unknown>,
  hints: CostHints | undefined,
  fallback: number
): string => String(seconds(p, hints) ?? fallback);

// Image models price per image; units = input.n when present (only
// wan/2-7-image* uses batch generation today), otherwise 1.
const imageCount = (p: Record<string, unknown>): number =>
  asNumber(asObject(p.input)?.n) ?? 1;

const flatVideo = (perUnit: number, slug: string): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [],
  rates: { "": perUnit },
  source: src(slug),
});

const flatImage = (perUnit: number, slug: string): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [],
  rates: { "": perUnit },
  source: src(slug),
});

// Flat per-call rate for endpoints that bill once per request regardless
// of input shape (Suno endpoints, sora-watermark-remover, etc.).
const flatGen = (perUnit: number, slug: string): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [],
  rates: { "": perUnit },
  source: src(slug),
});

// Image entry tiered by input.resolution (e.g. "1K"|"2K"|"4K").
// Optional `defaultResolution` is applied when the payload omits
// input.resolution (matches the upstream schema default).
const tieredImage = (
  rates: Record<string, number>,
  slug: string,
  defaultResolution?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [
    {
      name: "resolution",
      pick: (p) => asString(asObject(p.input)?.resolution) ?? defaultResolution,
    },
  ],
  rates,
  source: src(slug),
});
// Video entry tiered by input.resolution (grok-imagine, happyhorse).
// Optional `defaultResolution` is applied when the payload omits
// input.resolution (matches the upstream schema default).
const tieredResolutionVideo = (
  rates: Record<string, number>,
  slug: string,
  defaultResolution?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [
    {
      name: "resolution",
      pick: (p) => asString(asObject(p.input)?.resolution) ?? defaultResolution,
    },
  ],
  rates,
  source: src(slug),
});

const happyHorse11Video = (slug: string): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [
    {
      name: "resolution",
      pick: (p) => asString(asObject(p.input)?.resolution) ?? "1080p",
    },
  ],
  rates: { "720p": 0.165, "1080p": 0.22 },
  source: { ...src(slug), asOf: "2026-06-24" },
});

export const kie: Record<string, ModelPricing> = {
  // veo3 / veo3_fast — flat per-second rate. Veo schema has no duration
  // field, so callers must declare the clip length as
  // costHints.durationSeconds.
  veo3: flatVideo(0.3, "google/veo3"),
  veo3_fast: flatVideo(0.1, "google/veo3-fast"),

  // Kling 3.0 video: 6 rates, mode × sound. mode ∈ {"std","pro","4K"}.
  // 4K rate is the same with or without sound.
  "kling-3.0/video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "mode", pick: inputMode },
      {
        name: "sound",
        pick: (p) => {
          const input = asObject(p.input);
          return input?.sound === true ||
            (input?.sound === undefined && input?.multi_shots === true)
            ? "sound"
            : undefined;
        },
      },
    ],
    rates: {
      std: 0.07,
      "std|sound": 0.1,
      pro: 0.09,
      "pro|sound": 0.135,
      "4K": 0.335,
      "4K|sound": 0.335,
    },
    source: src("kwaivgi/kling-3.0"),
  },

  // Kling 3.0 motion-control: 2 tiers by mode ("720p"|"1080p"). Audio is
  // not separately priced for motion-control.
  "kling-3.0/motion-control": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [{ name: "mode", pick: inputMode }],
    rates: { "720p": 0.1, "1080p": 0.135 },
    source: src("kwaivgi/kling-3.0"),
  },

  // Kling 3.0 Turbo: 2 tiers by resolution. Rates verified 2026-06-21 from
  // KIE's pricing page: 720p = 18 credits/s ($0.09), 1080p = 22.5 credits/s
  // ($0.1125).
  "kling/v3-turbo-image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [{ name: "resolution", pick: inputResolution }],
    rates: { "720p": 0.09, "1080p": 0.1125 },
    source: page("https://kie.ai/kling-3-0-turbo"),
  },
  "kling/v3-turbo-text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [{ name: "resolution", pick: inputResolution }],
    rates: { "720p": 0.09, "1080p": 0.1125 },
    source: page("https://kie.ai/kling-3-0-turbo"),
  },

  // wan/2.7 video — all four variants share a flat $0.10/s rate.
  "wan/2-7-text-to-video": flatVideo(0.1, "alibaba/wan-2.7"),
  "wan/2-7-image-to-video": flatVideo(0.1, "alibaba/wan-2.7"),
  "wan/2-7-r2v": flatVideo(0.1, "alibaba/wan-2.7"),
  "wan/2-7-videoedit": flatVideo(0.1, "alibaba/wan-2.7"),

  // grok-imagine: 2 tiers by resolution. Audio is always on (no toggle in
  // the kie input schema).
  "grok-imagine/text-to-video": tieredResolutionVideo(
    { "480p": 0.008, "720p": 0.015 },
    "xai/grok-imagine"
  ),
  "grok-imagine/image-to-video": tieredResolutionVideo(
    { "480p": 0.008, "720p": 0.015 },
    "xai/grok-imagine"
  ),

  // grok-imagine-video-1-5-preview: image-to-video, 2 tiers by resolution.
  // Rates mirror the other grok-imagine video tiers — VERIFY against the kie
  // marketplace listing before relying on these for billing. Defaults to 480p
  // (matches the model default) when the payload omits input.resolution.
  "grok-imagine-video-1-5-preview": tieredResolutionVideo(
    { "480p": 0.008, "720p": 0.015 },
    "xai/grok-imagine",
    "480p"
  ),

  // grok-imagine images — kie returns a fixed bundle per call (6 default,
  // 4 with input.enable_pro=true for t2i; 2 for i2i). The caller can't
  // request n=1, so price is flat per generation.
  "grok-imagine/text-to-image": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "enable_pro",
        pick: (p) =>
          asObject(p.input)?.enable_pro === true ? "pro" : undefined,
      },
    ],
    rates: { "": 0.02, pro: 0.025 },
    source: src("xai/grok-imagine"),
  },
  "grok-imagine/image-to-image": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.02 },
    source: src("xai/grok-imagine"),
  },

  // grok-imagine/extend: flat per-generation, 4 rates indexed by
  // (extend_times, resolution). The kie schema only carries extend_times
  // and task_id — resolution is inherited from the source video. Callers
  // must pass top-level `resolution` as pricing-only metadata. Resolution is
  // not part of CostHints yet, so this legacy side field remains distinct
  // from the durationSeconds hint channel.
  "grok-imagine/extend": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "extend_times",
        pick: (p) => asString(asObject(p.input)?.extend_times),
      },
      {
        name: "resolution",
        pick: (p) =>
          asString(asObject(p.input)?.resolution) ?? asString(p.resolution),
      },
    ],
    rates: {
      "6|480p": 0.05,
      "6|720p": 0.1,
      "10|480p": 0.1,
      "10|720p": 0.15,
    },
    source: src("xai/grok-imagine"),
  },

  // grok-imagine/upscale: marketplace lists only the 360p→720p tier at
  // $0.05 flat. Schema has no tier selector (only task_id).
  "grok-imagine/upscale": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.05 },
    source: src("xai/grok-imagine"),
  },

  // happyhorse: 2 tiers by resolution. Audio always on for t2v/i2v/r2v.
  "happyhorse/text-to-video": tieredResolutionVideo(
    { "720p": 0.155, "1080p": 0.265 },
    "happyhorse/image-to-video"
  ),
  "happyhorse/image-to-video": tieredResolutionVideo(
    { "720p": 0.155, "1080p": 0.265 },
    "happyhorse/image-to-video"
  ),
  "happyhorse/reference-to-video": tieredResolutionVideo(
    { "720p": 0.155, "1080p": 0.265 },
    "happyhorse/image-to-video"
  ),
  // happyhorse/video-edit: same tiered rates as the other happyhorse video
  // entries. Schema has no duration field — output duration matches the
  // source video_url, so callers must declare that length as
  // costHints.durationSeconds.
  "happyhorse/video-edit": tieredResolutionVideo(
    { "720p": 0.155, "1080p": 0.265 },
    "happyhorse/image-to-video"
  ),

  // happyhorse-1-1: 2 tiers by resolution. KIE lists 33 credits/s ($0.165)
  // at 720p and 44 credits/s ($0.22) at 1080p. High-tier +10% bonus
  // credit top-ups lower the effective credit price by about 10%, but this
  // table stores list USD rates only.
  "happyhorse-1-1/text-to-video": happyHorse11Video(
    "happyhorse-1-1/text-to-video"
  ),
  "happyhorse-1-1/image-to-video": happyHorse11Video(
    "happyhorse-1-1/image-to-video"
  ),
  "happyhorse-1-1/reference-to-video": happyHorse11Video(
    "happyhorse-1-1/reference-to-video"
  ),

  // omnihuman-1-5: flat 27 credits/s ($0.135). KIE publishes one rate — the
  // output_resolution (720/1080) and pe_fast_mode switches do not change it.
  // Like veo3, the schema has no duration field (length follows the driving
  // audio), so callers must declare that length as costHints.durationSeconds.
  "omnihuman-1-5": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [],
    rates: { "": 0.135 },
    source: { ...page("https://kie.ai/omnihuman-1-5"), asOf: "2026-07-20" },
  },

  // volcengine/video-to-video-lip-sync: flat 8 credits/s ($0.04). Both
  // input.mode tiers ("lite"/"basic") bill at the same published rate, so
  // there is no mode selector. Schema has no duration field (length follows
  // the source video), so callers must declare that length as
  // costHints.durationSeconds.
  "volcengine/video-to-video-lip-sync": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [],
    rates: { "": 0.04 },
    source: {
      ...page("https://kie.ai/volcengine-video-to-video-lip-sync"),
      asOf: "2026-07-20",
    },
  },

  // bytedance/seedance-2: 6 rates, resolution × videoInput (i2v when
  // input.first_frame_url is present, t2v otherwise).
  "bytedance/seedance-2": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: inputResolution },
      {
        name: "videoInput",
        pick: (p) => (asObject(p.input)?.first_frame_url ? "i2v" : "t2v"),
      },
    ],
    rates: {
      "480p|i2v": 0.0575,
      "480p|t2v": 0.095,
      "720p|i2v": 0.125,
      "720p|t2v": 0.205,
      "1080p|i2v": 0.31,
      "1080p|t2v": 0.51,
    },
    source: src("bytedance/seedance-2"),
  },

  // bytedance/seedance-2-fast: 4 rates (no 1080p tier).
  "bytedance/seedance-2-fast": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: inputResolution },
      {
        name: "videoInput",
        pick: (p) => (asObject(p.input)?.first_frame_url ? "i2v" : "t2v"),
      },
    ],
    rates: {
      "480p|i2v": 0.045,
      "480p|t2v": 0.0775,
      "720p|i2v": 0.1,
      "720p|t2v": 0.165,
    },
    source: src("bytedance/seedance-2-fast"),
  },

  // bytedance/seedance-2-mini: 4 rates, resolution x reference video input.
  // Rates verified 2026-06-24 from the assigned pricing update:
  // 480p video input = 6 credits/s ($0.030), 480p no video input =
  // 9.5 credits/s ($0.0475), 720p video input = 12.5 credits/s ($0.0625),
  // 720p no video input = 20.5 credits/s ($0.1025).
  "bytedance/seedance-2-mini": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: inputResolution },
      {
        name: "videoInput",
        pick: (p) => (hasReferenceVideoInput(p) ? "video" : "no-video"),
      },
    ],
    rates: {
      "480p|video": 0.03,
      "480p|no-video": 0.0475,
      "720p|video": 0.0625,
      "720p|no-video": 0.1025,
    },
    source: { ...src("bytedance/seedance-2-mini"), asOf: "2026-06-24" },
  },

  // Image models — per-image USD. Resolution-tiered families
  // (nano-banana-2, gpt-image-2) require input.resolution; flat-rate
  // families (qwen2, seedream/5-lite) only need the model string.
  // wan/2-7-image accepts an `n` field for batch generation.
  // KIE's dedicated Nano Banana page lists 4 credits (~$0.02) per image.
  "nano-banana": {
    ...flatImage(0.02, "google/nano-banana"),
    source: { ...page("https://kie.ai/nano-banana"), asOf: "2026-07-22" },
  },
  "nano-banana-2": tieredImage(
    { "1K": 0.04, "2K": 0.06, "4K": 0.09 },
    "google/nano-banana-2",
    "2K"
  ),
  // nano-banana-pro: 1K and 2K share the $0.09 rate per the marketplace
  // ("1/2K"), 4K is $0.12.
  "nano-banana-pro": tieredImage(
    { "1K": 0.09, "2K": 0.09, "4K": 0.12 },
    "google/nano-banana-pro",
    "2K"
  ),
  "gpt-image-2-text-to-image": tieredImage(
    { "1K": 0.03, "2K": 0.05, "4K": 0.08 },
    "openai/gpt-image-2",
    "2K"
  ),
  "gpt-image-2-image-to-image": tieredImage(
    { "1K": 0.03, "2K": 0.05, "4K": 0.08 },
    "openai/gpt-image-2",
    "2K"
  ),
  "wan/2-7-image": flatImage(0.024, "alibaba/wan-2.7"),
  "wan/2-7-image-pro": flatImage(0.06, "alibaba/wan-2.7"),
  "qwen2/text-to-image": flatImage(0.028, "alibaba/qwen-image-2"),
  "qwen2/image-edit": flatImage(0.028, "alibaba/qwen-image-2"),
  "seedream/5-lite-text-to-image": flatImage(0.0275, "bytedance/seedream-5"),
  "seedream/5-lite-image-to-image": flatImage(0.0275, "bytedance/seedream-5"),

  // sora-watermark-remover: flat $0.05 per removal (only published rate
  // on the marketplace). Schema has no tier selector.
  "sora-watermark-remover": flatGen(0.05, "openai/sora-2"),

  // Suno: keyed by endpoint, NOT by audio model version. The kie payload's
  // `model` field is V3_5/.../V5_5 (audio version), but pricing is the
  // same across versions and varies per endpoint. Callers pass the
  // synthetic key via EstimateRequest.endpoint (e.g. "suno/generate"), and
  // the upstream payload stays untouched. Flat rates unless noted.
  "suno/generate": flatGen(0.06, "suno/suno"),
  "suno/extend": flatGen(0.06, "suno/suno"),
  "suno/upload-cover": flatGen(0.06, "suno/suno"),
  "suno/upload-extend": flatGen(0.06, "suno/suno"),
  "suno/wav-generate": flatGen(0.002, "suno/suno"),
  "suno/mp4-generate": flatGen(0.01, "suno/suno"),
  "suno/lyrics": flatGen(0.002, "suno/suno"),
  "suno/style-generate": flatGen(0.002, "suno/suno"),

  // suno/vocal-removal-generate: 2 rates by `payload.type`.
  // "separate_vocal" → $0.05 (Vocal Separation)
  // "split_stem"     → $0.25 (Multi-Stem Separation)
  // Schema marks `type` optional; we don't assume a default.
  "suno/vocal-removal-generate": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [{ name: "type", pick: (p) => asString(p.type) }],
    rates: { separate_vocal: 0.05, split_stem: 0.25 },
    source: src("suno/suno"),
  },

  // New Suno endpoints (5 missing from marketplace)
  "suno/mashup-generate": flatGen(0.06, "suno/suno"),
  "suno/replace-music-section-generate": flatGen(0.025, "suno/suno"),
  "suno/sounds-generate": flatGen(0.0125, "suno/suno"),
  "suno/add-instrumental-generate": flatGen(0.06, "suno/suno"),
  "suno/add-vocals-generate": flatGen(0.06, "suno/suno"),

  "gemini-omni-video": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "mode",
        pick: (p) => (hasVideoListInput(p) ? "v2v" : "t2v"),
      },
      {
        name: "duration",
        pick: (p, hints) => durationKey(p, hints, 4),
      },
      {
        name: "resolution",
        pick: (p) =>
          hasVideoListInput(p)
            ? ""
            : (asString(asObject(p.input)?.resolution) ?? "720p"),
      },
    ],
    // V2V does not vary by resolution, so its resolution selector yields "",
    // which evaluatePerUnit drops from the joined variant key. The v2v rate
    // keys therefore carry no trailing empty segment — writing them as
    // "v2v|4|" made every V2V request miss the table and price at zero.
    rates: {
      "t2v|4|720p": 0.315,
      "t2v|6|720p": 0.4725,
      "t2v|8|720p": 0.63,
      "t2v|10|720p": 0.7875,
      "t2v|4|1080p": 0.42,
      "t2v|6|1080p": 0.63,
      "t2v|8|1080p": 0.84,
      "t2v|10|1080p": 1.05,
      "t2v|4|4k": 0.42,
      "t2v|6|4k": 0.63,
      "t2v|8|4k": 0.84,
      "t2v|10|4k": 1.05,
      "v2v|4": 0.84,
      "v2v|6": 1.26,
      "v2v|8": 1.68,
      "v2v|10": 2.1,
    },
    source: src("google/gemini-omni"),
  },
};
