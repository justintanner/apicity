import type { ModelPricing } from "./types";
import { asNumber, asObject, asString, coerceSeconds } from "./helpers";

// Source URL is the kie marketplace page for the relevant model. Rates
// verified 2026-04-30. Rate keys mirror the upstream payload values verbatim
// (kling: payload.input.mode is "std"|"pro"|"4K"; seedance: payload.input.
// resolution is "480p"|"720p"|"1080p"; etc.) — there is no internal
// translation layer between the caller's payload and the rate selector.

const src = (slug: string) => ({ url: `https://kie.ai/market/${slug}` });

// Most kie video models read seconds from input.duration (top-level duration
// is accepted as a fallback for veo, whose schema has no duration field).
const seconds = (p: Record<string, unknown>): number | undefined =>
  coerceSeconds(asObject(p.input)?.duration ?? p.duration);

const inputResolution = (p: Record<string, unknown>): string | undefined =>
  asString(asObject(p.input)?.resolution);

const inputMode = (p: Record<string, unknown>): string | undefined =>
  asString(asObject(p.input)?.mode);

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

// Image entry tiered by input.resolution (e.g. "1K"|"2K"|"4K").
const tieredImage = (
  rates: Record<string, number>,
  slug: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [{ name: "resolution", pick: inputResolution }],
  rates,
  source: src(slug),
});

// Video entry tiered by input.resolution (grok-imagine, happyhorse).
const tieredResolutionVideo = (
  rates: Record<string, number>,
  slug: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [{ name: "resolution", pick: inputResolution }],
  rates,
  source: src(slug),
});

export const kie: Record<string, ModelPricing> = {
  // veo3 / veo3_fast — flat per-second rate. Veo schema has no duration
  // field, so callers must pass duration as a top-level hint.
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
        pick: (p) => (asObject(p.input)?.sound === true ? "sound" : undefined),
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
  // must pass a top-level `resolution` hint (mirrors veo3's top-level
  // `duration` hint), otherwise the lookup misses with a clear warning.
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

  // Image models — per-image USD. Resolution-tiered families
  // (nano-banana-2, gpt-image-2) require input.resolution; flat-rate
  // families (qwen2, seedream/5-lite) only need the model string.
  // wan/2-7-image accepts an `n` field for batch generation.
  "nano-banana-2": tieredImage(
    { "1K": 0.04, "2K": 0.06, "4K": 0.09 },
    "google/nano-banana-2"
  ),
  "gpt-image-2-text-to-image": tieredImage(
    { "1K": 0.03, "2K": 0.05, "4K": 0.08 },
    "openai/gpt-image-2"
  ),
  "gpt-image-2-image-to-image": tieredImage(
    { "1K": 0.03, "2K": 0.05, "4K": 0.08 },
    "openai/gpt-image-2"
  ),
  "wan/2-7-image": flatImage(0.024, "alibaba/wan-2.7"),
  "wan/2-7-image-pro": flatImage(0.06, "alibaba/wan-2.7"),
  "qwen2/text-to-image": flatImage(0.028, "alibaba/qwen-image-2"),
  "qwen2/image-edit": flatImage(0.028, "alibaba/qwen-image-2"),
  "seedream/5-lite-text-to-image": flatImage(0.0275, "bytedance/seedream-5"),
  "seedream/5-lite-image-to-image": flatImage(0.0275, "bytedance/seedream-5"),
};
