import type { CostHints } from "../types";
import type { ModelPricing } from "./types";
import {
  asNumber,
  asObject,
  asString,
  hintInputSeconds,
  hintSeconds,
} from "./helpers";

// fal bills image generation per generated image, not per token. Unlike the
// other per-unit providers, the payload carries no model field — the model
// *is* the endpoint path ("fal-ai/nano-banana"), so callers must pass the
// `endpoint` discriminator on the estimate request. Keys below are those
// endpoint ids verbatim.
//
// Two billing shapes appear upstream:
//
//   - per image      — a flat (or resolution-tiered) price per output image.
//   - per megapixel  — price scales with output area, counted in binary
//                      megapixels (1024 x 1024 px each); see megapixels()
//                      for how each endpoint rounds.
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

// FLUX 3 Max promotional rates, read from each model's fal.ai
// pricingInfoOverride on this date. The card bills output seconds through
// 2026-11-07; list rates after that are $0.17 at 720p and $0.29 at 1080p.
const flux3MaxAsOf = "2026-10-21";

// Audio endpoints were read directly from each model's fal.ai pricing card on
// this date.
const audioAsOf = "2026-08-22";

// Wan 3.0 pricing was pulled from fal's pricing API
// (GET /v1/models/pricing?endpoint_id=...) on this date.
const wan30AsOf = "2026-08-25";

// The five per-megapixel entries were re-read on this date: each model's
// fal.ai page and GET /v1/models/pricing, with the megapixel definition and
// rounding checked against billed usage (ac-hntqm6).
const megapixelAsOf = "2026-10-15";

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

// Seedance 2.0, 2.0 Fast and 2.5: the fal cards were re-read, and ByteDance's
// output-size table read, on this date (ac-j3d6ki.3).
const seedanceAsOf = "2026-10-17";

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

// fal counts a megapixel as 1024 x 1024 = 1,048,576 pixels, not 1,000,000.
// Every billed record that tells the two apart agrees: fal-ai/qwen-image
// billed a square_hd (1024x1024) image as 1 megapixel, the two edit endpoints
// below billed approximately 1024x1024-area outputs as 1; FLUX 3 billed 1024x1024
// as 1. fal's own FLUX.2 [pro] card also prices a 512x512 output at 0.25
// megapixels.
const PIXELS_PER_MEGAPIXEL = 1024 * 1024;

// How one image's area becomes billable megapixels:
//   - "ceil":  the card says images are billed by rounding up to the nearest
//              megapixel, so each image rounds up on its own.
//   - "whole": the card gives a per-megapixel rate but no rounding rule, and
//              every billed call so far was exactly one megapixel, which
//              cannot tell rounding up from fractional billing. Only an area
//              of a whole number of megapixels is priced; any other area warns.
type MegapixelRounding = "ceil" | "whole";

// One image's area in pixels. When `image_size` is absent, use only an
// endpoint default verified from that endpoint's own fal.ai page. An endpoint
// with no documented fixed default leaves `defaultPreset` undefined and warns
// instead of silently guessing. An `image_size` that is present but
// unrecognized follows the same warning path.
function imageArea(
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

  return width * height;
}

// Billable megapixels across the whole request: each image's megapixels under
// the endpoint's rounding, multiplied by the image count.
function megapixels(
  p: Record<string, unknown>,
  rounding: MegapixelRounding,
  defaultPreset?: string
): number | undefined {
  const area = imageArea(p, defaultPreset);
  if (area === undefined) return undefined;

  const perImage = area / PIXELS_PER_MEGAPIXEL;
  if (rounding === "ceil") return Math.ceil(perImage) * imageCount(p);
  return Number.isInteger(perImage) ? perImage * imageCount(p) : undefined;
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
  units: (p) => megapixels(p, "ceil", defaultPreset),
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

// Per-megapixel entry whose card states no rounding rule ("whole" above). A
// size that is not a whole number of megapixels gets its own warning. An
// absent, "auto" or unrecognized size keeps the generic units warning.
const perWholeMegapixel = (
  endpointId: string,
  usd: number,
  on: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "megapixels",
  units: (p) => megapixels(p, "whole"),
  warn: (p) => {
    const area = imageArea(p);
    if (area === undefined || Number.isInteger(area / PIXELS_PER_MEGAPIXEL)) {
      return [];
    }
    const perImage = (area / PIXELS_PER_MEGAPIXEL).toFixed(4);
    return [
      `fal '${endpointId}': image_size is ${perImage} megapixels per image; fal publishes no rounding rule for this endpoint, so only whole-megapixel sizes are priced`,
    ];
  },
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
// fal video families bill per output second, flat or tiered on payload
// fields (resolution / generate_audio) whose rate keys mirror the upstream
// values verbatim; Seedance bills output tokens instead (seedanceTokens
// below). Duration shapes differ per family — number, digit string,
// "8s"-style enum — so each family gets its own reader rather than one
// guessing parser: an absent optional field falls back to fal's documented
// schema default, while a present-but-unrecognized value returns undefined /
// selects no rate so the estimate warns instead of silently mispricing (the
// megapixels() contract).
//
// Input-media billing components (wan reference-to-video input seconds,
// grok extend's $0.01/s source-video seconds, grok's $0.002 image-input
// surcharge) depend on source media not present in the payload; estimates
// cover the output component only.

// Whole digit-string seconds ("5" → 5). Kling publishes duration as a bare
// string; anything else — "5s", numbers, "auto" — is unrecognized here.
function digitSeconds(d: unknown): number | undefined {
  const s = asString(d);
  return s !== undefined && /^\d+$/.test(s) ? Number(s) : undefined;
}

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

// Kling 4.0 videos run the requested duration (5 s by default), or, with
// multi_prompt, the sum of the shot durations (each 5 s by default).
const klingV4Seconds = (p: Record<string, unknown>): number | undefined => {
  if (!Array.isArray(p.multi_prompt)) return numericSeconds(5)(p);
  let total = 0;
  for (const shot of p.multi_prompt) {
    const duration = asObject(shot)?.duration;
    const seconds = duration === undefined ? 5 : asNumber(duration);
    if (seconds === undefined) return undefined;
    total += seconds;
  }
  return total;
};

// A Kling 4.0 reference-to-video payload with a reference video or a video
// element, which the card bills on input plus output length.
const klingV4HasVideoReference = (p: Record<string, unknown>): boolean =>
  (Array.isArray(p.video_urls) && p.video_urls.length > 0) ||
  (Array.isArray(p.elements) &&
    p.elements.some((element) => Boolean(asObject(element)?.video_url)));

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

// LTX-2.5 text-to-video's duration is 6 to 20 seconds or "auto", its
// default, which lets the model choose the length: an omitted or "auto"
// duration has no billed length to assume, so it prices only through the
// caller's cost-only hint, and without one it warns.
const ltx2p5Seconds = (
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

// ---------------------------------------------------------------------------
// Seedance 2.0, 2.0 Fast and 2.5
// ---------------------------------------------------------------------------
//
// fal bills Seedance in tokens of the delivered video, at each card's rate
// per 1000 tokens: tokens = width x height x frames / 1024.
//
// Width x height is ByteDance's published output size for the model,
// resolution and aspect ratio: the BytePlus ModelArk video-generation
// tutorial ("The pixel dimensions of output videos for each model are listed
// below"), read 2026-10-17,
// https://docs.byteplus.com/en/docs/ModelArk/video-generation-tutorial.
// ByteDance's own price examples reproduce that table, fal's per-1000-token
// card rates are exactly twice ByteDance's per-million rates (the US twins
// charge 1.2 x fal), and 640x640, the one size recorded on every family
// (480p, 1:1), is the table's.
//
// Frames: the video runs at 24 fps, and every committed success delivered 97
// frames for duration "4", one more than 24 x 4, so frames = 24 x d + 1.
// Other durations are unrecorded. Were one to deliver 24 x d frames, the
// estimate would be 1 / (24 x d + 1) high, at most 1% (at 4 s).
//
// Reference clips: with video_urls, fal also bills the clips' frames, 24 x
// their summed length in costHints.inputDurationSeconds, at the OUTPUT size,
// and multiplies the whole count by 0.6. Clips under 4 s fail closed:
// ByteDance bills them at the 4 s price and fal's handling is unrecorded.
// Image- or audio-only references bill the output alone, without the 0.6.
// bytedance/seedance-2.0/us/reference-to-video divides by 1000, not the
// card's 1024, the one measured exception, so it prices only with video.
//
// Recorded identities, all at 480p, 1:1 and "4" (640x640, 97 frames):
// - 38.8 units = 640 x 640 x 97 / 1024 / 1000 on every text-to-video id and
//   on the 2.0, 2.0 Fast and 2.0 US image-to-video ids;
// - 46.32 = 0.6 x 640 x 640 x (96 + 97) / 1024 / 1000 on 2.5 and 2.5 US
//   reference-to-video, with a 4.000 s, 96-frame clip;
// - 47.43168 = 0.6 x 640 x 640 x (96 + 97) / 1000 / 1000 on 2.0 US
//   reference-to-video, with the same clip.
//
// A request fixes the output only through an explicit resolution (default
// "720p"), a fixed aspect_ratio and a digit duration, or a duration given in
// costHints.durationSeconds. Anything else fails closed with a warning that
// names the field or hint that would price it. generate_audio, bitrate_mode,
// codec and seed never change the price: fal's schema says audio costs the
// same, and neither the cards nor ByteDance price bitrate or codec. The
// cards' per-second examples ("$0.3034/second" and the like) are rough
// figures; only their per-1000-token rates are used, except 2.5's 1080p,
// which prices at the billed 0.0214 x 1.094 rather than the card's rounded
// "roughly $0.0234" (see the 2.5 entries).
//
// Four ids stay in FAL_DYNAMIC_PRICING_ENDPOINTS. 2.0 and 2.0 Fast
// reference-to-video have no recording, and the one 2.0-series reference
// recording (2.0 US) divides by 1000 where the card says 1024. 2.5 and 2.5 US
// image-to-video follow the input image's aspect, for which ByteDance
// publishes no sizing rule.

// [width, height] by resolution and aspect ratio, copied from ByteDance's
// table: one column for the 2.0 series (2.0, 2.0 Fast and 2.0 US), and one
// for 2.5 (2.5 US and the draft completion too), which has no 4k.
type SeedanceSizes = Readonly<
  Record<string, Readonly<Record<string, readonly [number, number]>>>
>;

const SEEDANCE_2P0_SIZES: SeedanceSizes = {
  "480p": {
    "16:9": [864, 496],
    "4:3": [752, 560],
    "1:1": [640, 640],
    "3:4": [560, 752],
    "9:16": [496, 864],
    "21:9": [992, 432],
  },
  "720p": {
    "16:9": [1280, 720],
    "4:3": [1112, 834],
    "1:1": [960, 960],
    "3:4": [834, 1112],
    "9:16": [720, 1280],
    "21:9": [1470, 630],
  },
  "1080p": {
    "16:9": [1920, 1080],
    "4:3": [1664, 1248],
    "1:1": [1440, 1440],
    "3:4": [1248, 1664],
    "9:16": [1080, 1920],
    "21:9": [2206, 946],
  },
  "4k": {
    "16:9": [3840, 2160],
    "4:3": [3326, 2494],
    "1:1": [2880, 2880],
    "3:4": [2494, 3326],
    "9:16": [2160, 3840],
    "21:9": [4398, 1886],
  },
};

const SEEDANCE_2P5_SIZES: SeedanceSizes = {
  "480p": {
    "16:9": [854, 480],
    "4:3": [752, 560],
    "1:1": [640, 640],
    "3:4": [560, 752],
    "9:16": [480, 854],
    "21:9": [992, 432],
  },
  "720p": {
    "16:9": [1280, 720],
    "4:3": [1112, 834],
    "1:1": [960, 960],
    "3:4": [834, 1112],
    "9:16": [720, 1280],
    "21:9": [1470, 630],
  },
  "1080p": {
    "16:9": [1920, 1080],
    "4:3": [1664, 1248],
    "1:1": [1440, 1440],
    "3:4": [1248, 1664],
    "9:16": [1080, 1920],
    "21:9": [2206, 946],
  },
};

const SEEDANCE_RATIOS = "21:9, 16:9, 4:3, 1:1, 3:4 or 9:16";

interface SeedanceSpec {
  endpointId: string;
  sizes: SeedanceSizes;
  // The longest digit duration in the endpoint's enum: 15 for the 2.0
  // series, 30 for 2.5. The shortest is 4 on every id.
  maxSeconds: number;
  // USD per token by resolution: the card's rate per 1000 tokens / 1000.
  rates: Record<string, number>;
  // Text- and image-to-video omit it. A completed draft has no resolution,
  // duration or aspect_ratio field of its own.
  operation?: "reference" | "complete";
  // 2.5's draft flag renders a 480p preview whatever resolution says.
  draftFlag?: boolean;
  // 2.5 reference-to-video's task: with editing or extension, fal coerces
  // aspect_ratio (and, for editing, duration) to auto.
  taskField?: boolean;
  // Set only on 2.0 US reference-to-video, whose one recording (with
  // video_urls) divided by 1000. Its divisor without video is unrecorded, so
  // such a request fails closed.
  videoOnlyDivisor?: number;
}

// An own entry of a lookup table, or undefined: a request value such as
// "constructor" must not reach Object.prototype.
const own = <T>(record: Readonly<Record<string, T>>, key: string) =>
  Object.hasOwn(record, key) ? record[key] : undefined;

// payload.resolution, defaulting to the documented "720p". 2.5's draft flag
// forces 480p, and a completed draft is always 1080p.
function seedanceResolution(
  spec: SeedanceSpec,
  p: Record<string, unknown>
): string | undefined {
  if (spec.operation === "complete") return "1080p";
  if (spec.draftFlag && p.draft === true) return "480p";
  return p.resolution === undefined ? "720p" : asString(p.resolution);
}

// Whole seconds from 4 to the endpoint's maximum: a digit duration as is,
// or, for "auto" (the default, the model picks the length), the caller's
// costHints.durationSeconds. A completed draft reads the hint alone.
function seedanceSeconds(
  spec: SeedanceSpec,
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  const inRange = (n: number | undefined) =>
    n !== undefined && Number.isInteger(n) && n >= 4 && n <= spec.maxSeconds
      ? n
      : undefined;
  if (
    spec.operation !== "complete" &&
    p.duration !== undefined &&
    p.duration !== "auto"
  ) {
    return inRange(digitSeconds(p.duration));
  }
  return inRange(asNumber(hints?.durationSeconds));
}

// The billed tokens, or the reason the request does not fix them. units and
// warn both read this, so a priced request carries no warning and every
// unpriced one names its cause.
function seedanceTokens(
  spec: SeedanceSpec,
  p: Record<string, unknown>,
  hints?: CostHints
): { tokens: number } | { warning: string } {
  const id = `fal '${spec.endpointId}'`;
  const resolution = seedanceResolution(spec, p);
  if (resolution === undefined || own(spec.rates, resolution) === undefined) {
    return {
      warning:
        `${id}: resolution '${String(p.resolution)}' has no published rate; ` +
        `the card prices ${Object.keys(spec.rates).join(", ")}`,
    };
  }

  if (spec.taskField && p.task !== undefined && p.task !== "reference") {
    return {
      warning:
        `${id}: task '${String(p.task)}' is not priced; with editing or ` +
        "extension fal coerces aspect_ratio (and, for editing, duration) to " +
        "auto, so the request does not fix the output size",
    };
  }

  const ratio =
    spec.operation === "complete"
      ? asString(hints?.aspectRatio)
      : p.aspect_ratio === undefined
        ? "auto"
        : asString(p.aspect_ratio);
  const row = own(spec.sizes, resolution);
  const size = ratio === undefined || !row ? undefined : own(row, ratio);
  if (!size) {
    if (spec.operation === "complete") {
      return {
        warning:
          `${id}: a completed draft keeps the draft's aspect ratio, which the ` +
          `request does not carry; pass the draft's ratio (${SEEDANCE_RATIOS}) ` +
          "as costHints.aspectRatio",
      };
    }
    return {
      warning:
        ratio === "auto"
          ? `${id}: aspect_ratio "auto" (the default) lets the model pick the ` +
            `output size; pass a fixed aspect_ratio (${SEEDANCE_RATIOS})`
          : `${id}: aspect_ratio '${String(p.aspect_ratio)}' has no published ` +
            `output size; pass ${SEEDANCE_RATIOS}`,
    };
  }

  const seconds = seedanceSeconds(spec, p, hints);
  if (seconds === undefined) {
    const range = `4 to ${spec.maxSeconds}`;
    if (spec.operation === "complete") {
      return {
        warning:
          `${id}: a completed draft keeps the draft's duration, which the ` +
          "request does not carry; pass it as costHints.durationSeconds, " +
          `whole seconds from ${range}`,
      };
    }
    return {
      warning:
        p.duration === undefined || p.duration === "auto"
          ? `${id}: duration "auto" (the default) lets the model pick the ` +
            `length; pass a digit duration ("4" to "${spec.maxSeconds}") or ` +
            `costHints.durationSeconds as whole seconds from ${range}`
          : `${id}: duration '${String(p.duration)}' is not a digit string ` +
            `from "4" to "${spec.maxSeconds}"`,
    };
  }

  // Reference clips sent with the request, or, for a completed draft, the
  // clips the draft had (a valid inputDurationSeconds says it had them).
  let video = false;
  if (spec.operation === "reference") {
    const urls = p.video_urls;
    if (urls !== undefined && !Array.isArray(urls)) {
      return {
        warning:
          `${id}: video_urls is not an array, so the reference clips cannot ` +
          "be counted; pass the clip URLs as an array and declare their " +
          "total length as costHints.inputDurationSeconds",
      };
    }
    video = Array.isArray(urls) && urls.length > 0;
    if (!video && spec.videoOnlyDivisor !== undefined) {
      return {
        warning:
          `${id}: only a request with video_urls is priced; the one recorded ` +
          `call had a reference clip and divided by ${spec.videoOnlyDivisor}, ` +
          "and the divisor without one is unrecorded",
      };
    }
  }
  const input = hintInputSeconds(hints);
  if (spec.operation === "complete") video = input !== undefined;
  if (video && input === undefined) {
    return {
      warning:
        `${id}: video_urls carry no clip length in the request, and fal ` +
        "bills the clips' frames beside the output; declare their total " +
        "length as costHints.inputDurationSeconds (at least 4 s)",
    };
  }
  if (video && input !== undefined && input < 4) {
    return {
      warning:
        `${id}: costHints.inputDurationSeconds is ${input} s; clips under 4 s ` +
        "are not priced, because ByteDance bills them at the 4 s price and " +
        "fal's handling is unrecorded",
    };
  }

  const [width, height] = size;
  const clipFrames = video && input !== undefined ? 24 * input : 0;
  const pixels = width * height * (clipFrames + 24 * seconds + 1);
  const divisor = spec.videoOnlyDivisor ?? 1024;
  // 0.6 as 3 / 5 keeps whole-number token counts exact.
  return { tokens: video ? (pixels * 3) / (5 * divisor) : pixels / divisor };
}

const seedance = (spec: SeedanceSpec): ModelPricing => ({
  kind: "perUnit",
  unit: "tokens",
  units: (p, hints) => {
    const result = seedanceTokens(spec, p, hints);
    return "tokens" in result ? result.tokens : undefined;
  },
  warn: (p, hints) => {
    const result = seedanceTokens(spec, p, hints);
    return "warning" in result ? [result.warning] : [];
  },
  select: [{ name: "resolution", pick: (p) => seedanceResolution(spec, p) }],
  rates: spec.rates,
  source: source(spec.endpointId, seedanceAsOf),
});

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

// Promotional card through 2026-11-07: $0.0425/s at 720p and $0.0725/s at
// 1080p (list $0.17 / $0.29 after). Pricing API the same day: unit_price
// $0.02125, and a 5s clip bills 10 units ($0.2125). Audio and
// reasoning_level are not separate billing dimensions.
const FLUX_3_MAX_RATES: Record<string, number> = {
  "720p": 0.0425,
  "1080p": 0.0725,
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
//   - minimax/music-3: billed per COMPUTE SECOND (USD 0.00125) as pulled
//     2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=minimax/music-3). Same shape as the
//     alibaba/wan-3.0 rows: the request carries a `duration`, but that is an
//     upper bound on OUTPUT seconds — the model may stop earlier and reports
//     the length it actually produced — while billing counts wall-clock GPU
//     seconds, so no request field determines the price.
//   - topaz/upscale/image/precision: billed on OUTPUT area — "$0.08 per 24
//     megapixels of output, with any precision model", pulled 2026-08-28 from
//     the model page, and the pricing API reports the same rate as an opaque
//     USD 0.01 per "units". Output area is the source image's own dimensions
//     scaled by `upscale_factor`, and the request carries only `image_url`,
//     so no request field determines the price. This is the same shape as
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
//   - meshy/v7/image-to-3d: billed per COMPUTE SECOND (USD 0.00007) as pulled
//     2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=...), which reports that one flat
//     rate with no tier and no selector. Compute seconds are wall-clock GPU
//     time; nothing in the request determines them — `target_polycount` sizes
//     the output mesh, and `model_type`, `should_texture`, `enable_pbr`,
//     `enable_rigging`, `enable_animation`, and `ultra_mode` only switch
//     generation stages on and off, none of which upstream publishes a
//     seconds-per-unit constant for. A static per-model rate would be invented.
//   - lightricks/ltx-2.5/image-to-video/pro: billed per COMPUTE SECOND
//     (USD 0.00017) as pulled 2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=...). Same shape as the
//     `alibaba/wan-3.0/*` video models: the request carries an output
//     `duration` (6 | 8 | 10 | "auto"), but the billed unit is wall-clock GPU
//     time, and "auto" does not even fix the output length at request time, so
//     no request field can derive the price. The pricing API reports the same
//     unit for the endpoint's `/fast` sibling, so the tier does not change the
//     metering either. Contrast `fal-ai/kling-video/v3/pro/image-to-video` and
//   - lightricks/ltx-2.5/image-to-video/fast: billed per COMPUTE SECOND
//     (USD 0.00017) as pulled 2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=...). Same shape as the
//     `alibaba/wan-3.0/*` video models: the request carries an output
//     `duration` (6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | "auto"), but the
//     billed unit is wall-clock GPU time, and "auto" does not even fix the
//     output length at request time, so no request field can derive the
//     price. The same pull reports the same unit and rate for the endpoint's
//     `/pro` sibling, so the tier changes neither the metering nor the rate.
//     Contrast `fal-ai/kling-video/v3/pro/image-to-video` and
//     `alibaba/wan-3.0-prime/*`, whose pull reports `"seconds"` — OUTPUT
//     seconds, payload-derivable — and which are priced statically below.
//   - bytedance/seedream/v5/pro/layerize: billed per COMPUTE SECOND
//     (USD 0.00017) as pulled 2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=bytedance/seedream/v5/pro/layerize).
//     No request field determines wall-clock GPU time, and the layer count the
//     model returns is chosen by the model, not the payload — the statically
//     priced Seedream siblings bill per IMAGE instead, a unit their
//     `num_images` fixes exactly.
//   - minimax/h3/text-to-video: billed per COMPUTE SECOND (USD 0.00017) as
//     pulled 2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=minimax/h3/text-to-video). The
//     request carries an output `duration` in the 5-15s range and a
//     `resolution` tier, but neither fixes wall-clock GPU time — the same
//     reasoning as the `alibaba/wan-3.0/*` video family, and the same rate.
//     Statically priced video siblings such as `fal-ai/wan/v2.7/text-to-video`
//   - minimax/h3/image-to-video: billed per COMPUTE SECOND (USD 0.00017) as
//     pulled 2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=minimax/h3/image-to-video). The
//     request carries an output `duration` in the 5-15s range and a
//     `resolution` tier, but neither fixes wall-clock GPU time — the same
//     reasoning as the `alibaba/wan-3.0/*` video family, and the same rate.
//     Statically priced video siblings such as `fal-ai/wan/v2.7/image-to-video`
//     report unit "seconds" (output seconds) from the same API instead.
//   - minimax/h3/reference-to-video: billed per COMPUTE SECOND (USD 0.00017)
//     as pulled 2026-08-28 from fal's own pricing API
//     (GET /v1/models/pricing?endpoint_id=minimax/h3/reference-to-video). The
//     request carries an output `duration` in the 5-15s range and a
//     `resolution` tier, but neither fixes wall-clock GPU time, and the
//     variable count of reference assets moves it further - the same reasoning
//     as the `alibaba/wan-3.0/*` video family, and the same rate. The
//     statically priced `fal-ai/wan/v2.7/reference-to-video` sibling reports
//     unit "seconds" (output seconds) at USD 0.1 from the same API instead.
//   - minimax/h3-max/extend-video: the official card (read 2026-10-07)
//     bills $0.05/$0.08/$0.16/$0.32 per generated second at
//     480p/768p/1080p/2K, plus $0.02 per 1,000 reference tokens beyond the
//     4,096 included with each request. Those tokens come from the source
//     clip and the optional reference audio, which the payload carries only
//     as URLs, so no request field determines the charge. The same card
//     language made minimax/h3-max/insert-video dynamic; the turbo twin
//     bills continuation seconds only and stays priced statically below.
//   - minimax/h3-max/reference-to-video: the official card (read
//     2026-10-07) bills the requested seconds at $0.05/$0.08/$0.16 per
//     second at 480p/768p/1080p, plus $0.02 per 1,000 reference tokens
//     beyond the 4,096 included with each request. Reference tokens depend
//     on each image's aspect ratio, each video's aspect ratio and frame
//     count, and each audio clip's length, none of which the payload's URLs
//     carry, so no request field determines the charge. Same card language
//     as minimax/h3-max/extend-video above. The recorded 0.92 s 480P call
//     with one square reference image billed 0.92 units, $0.046.
//   - minimax/h3-max/3d-to-video: the official card (read 2026-10-07) bills
//     every output second at $0.05/$0.08/$0.16 at 480p/768p/1080p (5 s
//     minimum), plus input-video and reference-image tokens priced as for
//     minimax/h3-max/reference-to-video above, plus each reference it
//     generates when none is supplied. The output length and shot count
//     follow the source video, and the tokens follow its frames and each
//     image's shape, all of which the payload carries only as URLs, so no
//     request field determines the charge. The model page's own pricing
//     section also lists a $0.50 processing fee per request, which the
//     recorded call was not billed: its 8 s 480P source with one 16:9
//     reference image billed 15.9832 units at $0.05, $0.79916 in all.
//   - minimax/h3-max/lip-sync/image-to-video: the official card (read
//     2026-10-08) bills each second of generated video at
//     $0.05/$0.08/$0.16/$0.32 at 480p/768p/1080p/2K, times 1.2 for a video
//     over 15 s. The video runs as long as the audio, which the payload
//     carries only as a URL. costHints.durationSeconds could declare that
//     length, but the billing does not follow it: the recorded 480P call
//     sent 5.72 s of audio, got back a video fal reports as 5.72 s (138
//     frames at 24 fps, 5.75 s) and billed 6 units at $0.05, $0.30 (fal's
//     usage API reads the same 6 seconds), where the card predicts $0.286 to
//     $0.288. The card states no rounding, and one call cannot tell rounding
//     up from rounding to the nearest second, so no rate is encoded.
//   - xai/grok-imagine-video/v1.5/reference-to-video: billed per COMPUTE
//     SECOND (USD 0.00017) as pulled 2026-08-28 from the same pricing API.
//     Its UNVERSIONED sibling xai/grok-imagine-video/reference-to-video bills
//     per OUTPUT second (USD 0.05) and stays priced statically below — the
//     v1.5 path changed billing unit, not just rate, so the payload
//     `duration` cannot derive its price.
//   - bytedance/seedream/v5/pro/text-to-image: fal's pricing API reports a
//     bare "units" unit at USD 0.0675 (pulled 2026-08-28), and the model
//     page's card calls its own numbers "tentative": $0.0675 per image at or
//     below 1536x1536 and $0.135 above it. A recorded 1024x1024 (`square_hd`)
//     call with `num_images: 1` was billed 2 units / USD 0.135 — the card's
//     high-tier price for an image well inside its low tier, confirmed by
//     GET /v1/models/usage (quantity 2, unit_price 0.0675, cost_total 0.135)
//     and by the response's own `x-fal-billable-units: 2.0`. Every statically
//     priced per-image fal endpoint bills exactly 1 unit per image; this one
//     does not, so no request field determines the billed quantity and a
//     per-image table would contradict the observed charge.
//   - bytedance/seedream/v5/pro/edit: fal's pricing API reports a bare
//     "units" unit at USD 0.0675 (pulled 2026-08-28), where every statically
//     priced per-image fal endpoint reports "images". The model page's card
//     calls its own numbers "tentative": $0.0675 + $(0.0045 x number of
//     additional input images) per output image at or below 1536x1536, and
//     $0.135 + the same input surcharge above it, with the first input image
//     free. A recorded 1024x1024 (`square_hd`) call with `num_images: 1` and a
//     single (free) input image was billed 2 units / USD 0.135 — the card's
//     high-tier price for an output well inside its low tier, confirmed by
//     GET /v1/models/usage (quantity 2, unit_price 0.0675, cost_total 0.135)
//     and by the response's own `x-fal-billable-units: 2.0`. No request field
//     yields that 2, so a per-image table would contradict the observed
//     charge.
//   - google/gemini-omni-flash: billed purely per token as read 2026-08-28
//     (the model page states "Billing is based on total token consumption.
//     Tokens cost $21.875 per 1 million tokens"), and its "approximately
//     $0.125 per second of video" figure is both explicitly approximate and
//     conditioned on 720p — a resolution the request cannot select, since the
//     payload carries only prompt, aspect_ratio, and duration. The one
//     recorded call (duration 3) billed 0.382914 units at USD 1.00/unit =
//     USD 0.382914, where the page rate predicts USD 0.375; the delivered
//     video reports no token count, resolution, or duration, so the billed
//     quantity is observable from neither the request nor the response.
//   - google/gemini-omni-flash/edit: billed purely per token as read
//     2026-08-28 ("Billing is based on total token consumption. Input tokens
//     (text/audio/video) cost $1.875 per 1 million tokens. Output tokens cost
//     $21.875 per 1 million tokens"), and its "approximately $0.13 per second
//     of video" figure is both explicitly approximate and conditioned on 720p.
//     The request carries only `prompt` and `video_url` — no duration, no
//     resolution — so the billed quantity depends on the source video fal
//     fetches, which no request field measures, and the delivered video
//     reports no token count either. fal's own pricing API returns the bare
//     `{"unit":"units","unit_price":1}` shape for this endpoint, and the one
//     recorded call billed 0.689422 units = USD 0.689422 (confirmed by
//     GET /v1/models/usage for the same bucket) — a fractional quantity the
//     payload cannot reproduce.
//   - google/gemini-omni-flash/image-to-video: billed purely per token as read
//     2026-08-28 ("Billing is based on total token consumption. Input tokens
//     (text/audio/video) cost $1.875 per 1 million tokens. Output tokens cost
//     $21.875 per 1 million tokens"), and its "approximately $0.13 per second
//     of video" figure is both explicitly approximate and conditioned on 720p
//     — a resolution the request cannot select, since it carries only
//     `aspect_ratio` (16:9 or 9:16). The payload does carry a `duration`, but
//     the billed quantity also depends on the input image and prompt tokens,
//     which no request field measures. fal's own pricing API returns the bare
//     `{"unit":"units","unit_price":1}` shape for this endpoint, and the one
//     recorded duration-3 call billed 0.386914 units = USD 0.386914
//     (confirmed by GET /v1/models/usage for the same bucket) where that page
//     rate predicts USD 0.39 (0.79% off) — a fractional quantity no request
//     field reproduces.
//   - google/gemini-omni-flash/reference-to-video: billed purely per token as
//     read 2026-08-28 ("Billing is based on total token consumption. Input
//     tokens (text/audio/video) cost $1.875 per 1 million tokens. Output
//     tokens cost $21.875 per 1 million tokens"), and its "approximately
//     $0.13 per second of video" figure is both explicitly approximate and
//     conditioned on 720p — a resolution the request cannot select, since it
//     carries only `aspect_ratio` (16:9 or 9:16). The payload does carry a
//     `duration`, but the billed quantity also covers the prompt and the one
//     to ten reference images fal fetches from `image_urls`, whose token
//     counts no request field measures. fal's own pricing API returns the
//     bare `{"unit":"units","unit_price":1}` shape for this endpoint. Two
//     live duration-3 calls with the SAME single reference image billed
//     DIFFERENT quantities — 0.386938 units (the recorded one) and 0.387174
//     units — summing to USD 0.774112 on GET /v1/models/usage for the same
//     bucket, against a page rate that predicts USD 0.39 per call. An
//     identical payload that bills a different amount twice running is not
//     payload-derivable at all.
//   - google/gemini-omni-flash/v1.1/edit: the official card (read
//     2026-10-08) bills each second of output video at
//     $0.03/$0.10/$0.15/$0.30 at 360p/720p/1080p/4K. The request carries no
//     duration: the edit follows the source, which the payload carries only
//     as a URL. costHints.durationSeconds could declare the source's length,
//     but the billing does not follow it: the recorded 360p call sent a
//     5.000 s source, got back 5.000 s of video (120 frames at 24 fps) with a
//     generated 48 kHz audio track of 5.034667 s (236 AAC frames), and billed
//     5.034667 units at $0.03, USD 0.15104 (fal's usage API reads the same
//     5.034667 seconds), where the card predicts $0.15 for the 5 s source.
//     The billed length is the output file's, set by the audio encoder's
//     framing, so no rate is encoded.
//   - google/gemini-omni-flash/v1.1/image-to-video: the official card (read
//     2026-10-08) bills each second of output video at
//     $0.03/$0.10/$0.15/$0.30 at 360p/720p/1080p/4K, and the request
//     carries its duration (3 to 10 s), so the card predicts 3 units for a
//     3 s request. The recorded 360p call asked for 3 s from one first
//     frame and got back 3.000 s of video (72 frames at 24 fps) with a
//     generated 48 kHz audio track of 142 AAC frames, whose edit list skips
//     the encoder's 1024 priming samples, so the file plays for 3.008 s. It
//     billed 3.008 units at $0.03, USD 0.09024 (fal's usage API reads the
//     same 3.008 seconds), where the card predicts $0.09. The billed length
//     is the output file's, set by the audio encoder's framing and the
//     muxer (the reference-to-video file below carried the same 142 frames
//     with no edit list and billed 3.029333 s), not the requested
//     duration, so no rate is encoded.
//   - google/gemini-omni-flash/v1.1/reference-to-video: the official card
//     (read 2026-10-08) bills each second of output video at
//     $0.03/$0.10/$0.15/$0.30 at 360p/720p/1080p/4K, and the request
//     carries its duration (3 to 10 s), so the card predicts 3 units for a
//     3 s request. The recorded 360p call asked for 3 s with one reference
//     image and got back 3.000 s of video (72 frames at 24 fps) with a
//     generated 48 kHz audio track of 3.029333 s (142 AAC frames), and
//     billed 3.029333 units at $0.03, USD 0.09088 (fal's usage API reads
//     the same 3.029333 seconds), where the card predicts $0.09. The billed
//     length is the output file's, set by the audio encoder's framing, not
//     the requested duration, so no rate is encoded.
//   - google/gemini-omni-flash/v1.1/text-to-video: the official card (read
//     2026-10-08) bills each second of output video at
//     $0.03/$0.10/$0.15/$0.30 at 360p/720p/1080p/4K, and the request
//     carries its duration (3 to 10 s), so the card predicts 3 units for a
//     3 s request. The recorded 360p call asked for 3 s from a prompt alone
//     and got back 3.000 s of video (72 frames at 24 fps) with a generated
//     48 kHz audio track of 3.029333 s (142 AAC frames, no edit list), and
//     billed 3.029333 units at $0.03, USD 0.09088 (fal's usage API reads
//     the same 3.029333 seconds), where the card predicts $0.09. The billed
//     length is the output file's, set by the audio encoder's framing and
//     the muxer (the image-to-video file above carried the same 142 frames
//     behind an edit list and billed 3.008 s), not the requested duration,
//     so no rate is encoded.
// FLUX 3 image generation/editing: official metadata bills megapixels, while the request
// carries resolution tiers and can infer aspect ratio from a remote image.
// The 2026-10-05 page publishes a 1K promotional example but no complete tier
// grid or billable-dimension mapping. Use fal's pricing API; do not invent it.
// https://fal.ai/models/blackforestlabs/flux-3/edit-image
// https://fal.ai/models/blackforestlabs/flux-3/text-to-image

// Gemini TTS bills spoken text only: single-speaker `prompt`, or each
// dialogue turn's `text`. Style instructions and speaker aliases are
// excluded. Missing spoken text returns undefined so the estimate warns.
function spokenCharacters(p: Record<string, unknown>): number | undefined {
  const prompt = asString(p.prompt);
  const turns = Array.isArray(p.turns) ? p.turns : undefined;
  if (prompt === undefined && turns === undefined) return undefined;
  let count = prompt?.length ?? 0;
  for (const turn of turns ?? []) {
    const text = asString(asObject(turn)?.text);
    if (text !== undefined) count += text.length;
  }
  return count;
}

const perSpokenCharacter = (
  endpointId: string,
  usd: number,
  on: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "characters",
  units: spokenCharacters,
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

// Bills each returned image when the request cannot say how many images
// will come back. Callers pass that count through costHints.outputImages.
// A missing or non-positive count fails closed instead of assuming 1.
function hintedOutputImages(
  _p: Record<string, unknown>,
  hints?: CostHints
): number | undefined {
  const count = hints?.outputImages;
  return typeof count === "number" && Number.isInteger(count) && count > 0
    ? count
    : undefined;
}

const perOutputImage = (
  endpointId: string,
  usd: number,
  on: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: hintedOutputImages,
  warn: (_payload, hints) =>
    hintedOutputImages(_payload, hints) === undefined
      ? [
          `${endpointId} bills each returned image; pass a positive integer costHints.outputImages.`,
        ]
      : [],
  select: [],
  rates: { "": usd },
  source: source(endpointId, on),
});

// Tripo P2 bills one generated model. Untextured (texture and pbr both
// false) is $1.00. Otherwise the texture_quality rate applies, and pbr
// turns textures on. Quad topology does not add a charge. An unknown
// quality selects no rate.
function tripoP2Tier(p: Record<string, unknown>): string {
  const texture = p.texture === undefined ? true : p.texture === true;
  const pbr = p.pbr === undefined ? true : p.pbr === true;
  if (!texture && !pbr) return "none";
  return asString(p.texture_quality) ?? "standard";
}

const tripoP2 = (endpointId: string, on: string): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [{ name: "texture", pick: tripoP2Tier }],
  rates: { none: 1, fast: 1.1, standard: 1.1, detailed: 1.2, extreme: 1.3 },
  source: source(endpointId, on),
});

// Meshy 7.1 bills one model. preview is the untextured $0.80 base and full
// is the textured $1.20 total. Auto-rigging adds $0.20 and animation adds
// $0.12. An unknown mode selects no rate.
const meshyV71 = (endpointId: string, on: string): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [
    {
      name: "mode",
      pick: (p) => {
        // text-to-3d uses mode; image endpoints use should_texture.
        if (p.mode === "preview" || p.should_texture === false)
          return "preview";
        const mode = asString(p.mode);
        if (mode !== undefined && mode !== "full") return mode;
        return "full";
      },
    },
  ],
  rates: { preview: 0.8, full: 1.2 },
  extra: (p) => {
    let usd = 0;
    if (p.enable_rigging === true) usd += 0.2;
    if (p.enable_animation === true) usd += 0.12;
    return usd;
  },
  source: source(endpointId, on),
});

// openrouter/router/decisions bills input and output tokens; no request field
// fixes the output token count (card read 2026-10-16).
// xai/grok-voice: unpublished, fal dashboard. The pricing API and page list
// $0.00083/second (2026-10-16), but do not define the seconds. Our 6.008 s
// input and 2.54 s reply billed 1.897 units ($0.00157451); request audio
// duration cannot determine these units, so keep dynamic estimation.
// Four Seedance ids stay dynamic. The other twelve bill output tokens that an
// explicit request fixes (seedanceTokens above; ac-j3d6ki.3).
// - bytedance/seedance-2.0/reference-to-video and
//   bytedance/seedance-2.0/fast/reference-to-video: no call is recorded, and
//   the one 2.0-series reference recording (2.0 US) divided by 1000 where the
//   card says 1024, so neither divisor is known.
// - bytedance/seedance-2.5/image-to-video and
//   bytedance/seedance-2.5/us/image-to-video: aspect_ratio is the const
//   "auto", and the output follows the input image. cat1.jpg (686x667) gave
//   648x630 at 97 frames and billed 38.671 units. ByteDance publishes no
//   sizing rule for that adaptive ratio, so no request field fixes the size.
export const FAL_DYNAMIC_PRICING_ENDPOINTS = [
  "alibaba/qwen-image-3/edit",
  "alibaba/qwen-image-3/text-to-image",
  "alibaba/wan-3.0/image-to-video",
  "alibaba/wan-3.0/reference-to-video",
  "alibaba/wan-3.0/text-to-video",
  "blackforestlabs/flux-3/edit-image",
  "blackforestlabs/flux-3/text-to-image",
  "blackforestlabs/flux-video-upscale",
  "bytedance/seedance-2.0/fast/reference-to-video",
  "bytedance/seedance-2.0/reference-to-video",
  "bytedance/seedance-2.5/image-to-video",
  "bytedance/seedance-2.5/us/image-to-video",
  "bytedance/seedream/v5/pro/edit",
  "bytedance/seedream/v5/pro/layerize",
  "bytedance/seedream/v5/pro/text-to-image",
  "fal-ai/flux-2-flex",
  "fal-ai/flux-3-action/so101",
  "fal-ai/heygen/avatar3/digital-twin",
  "fal-ai/heygen/avatar4/digital-twin",
  "fal-ai/heygen/avatar4/image-to-video",
  "fal-ai/heygen/avatar5/digital-twin",
  "fal-ai/heygen/v2/translate/precision",
  "fal-ai/heygen/v2/translate/speed",
  "fal-ai/heygen/v2/video-agent",
  "fal-ai/heygen/v3/filler-word-removal",
  "fal-ai/heygen/v3/lipsync/precision",
  "fal-ai/heygen/v3/lipsync/speed",
  "fal-ai/heygen/v3/video-agent",
  "fal-ai/kandinsky6-lite/image-to-video",
  "fal-ai/kandinsky6-lite/text-to-video",
  "fal-ai/kandinsky6-pro/image-to-video",
  "fal-ai/kandinsky6-pro/text-to-video",
  "fal-ai/kandinsky6-vsr",
  "fal-ai/kandinsky6-vsr/lite",
  "google/gemini-omni-flash",
  "google/gemini-omni-flash/edit",
  "google/gemini-omni-flash/image-to-video",
  "google/gemini-omni-flash/reference-to-video",
  "google/gemini-omni-flash/v1.1/edit",
  "google/gemini-omni-flash/v1.1/image-to-video",
  "google/gemini-omni-flash/v1.1/reference-to-video",
  "google/gemini-omni-flash/v1.1/text-to-video",
  "google/nano-banana-2-lite",
  "google/nano-banana-2.1",
  "google/nano-banana-2.1/edit",
  "google/nano-banana-lite/edit",
  "kling/v4/video-to-video/edit",
  "lightricks/ltx-2.5/image-to-video/fast",
  "lightricks/ltx-2.5/image-to-video/pro",
  "luma/agent/ray/v3.2/reframe",
  "luma/agent/ray/v3.2/text-to-video",
  "meshy/v7/image-to-3d",
  "microsoft/mai-image-2.5-pro",
  "microsoft/mai-image-2.5-pro/edit",
  "minimax/h3-max/3d-to-video",
  "minimax/h3-max/extend-video",
  "minimax/h3-max/insert-video",
  "minimax/h3-max/lip-sync/image-to-video",
  "minimax/h3-max/reference-to-video",
  "minimax/h3-max/reframe-video",
  "minimax/h3/image-to-video",
  "minimax/h3/reference-to-video",
  "minimax/h3/text-to-video",
  "minimax/music-3",
  "mirelo-ai/sfx2.0/text-to-audio",
  "mirelo-ai/sfx2.0/video-to-audio",
  "mirelo-ai/sfx2.0/video-to-video",
  "mureka/api/generate/instrumental",
  "mureka/api/generate/podcast",
  "openai/gpt-image-2.5/flare/edit",
  "openai/gpt-image-2.5/flare/text-to-image",
  "openai/gpt-image-2.5/sunburst/edit",
  "openai/gpt-image-2.5/sunburst/text-to-image",
  "openrouter/router/decisions",
  "topaz/upscale/image/precision",
  "topaz/upscale/video/precision",
  "xai/grok-imagine-image/v2.0/edit",
  "xai/grok-imagine-image/v2.0/text-to-image",
  "xai/grok-imagine-video/v1.5/reference-to-video",
  "xai/grok-voice",
] as const;

/** What a dynamically priced fal endpoint bills, and why a request cannot fix it. */
export interface FalDynamicBilledUnit {
  /** The billed unit and its price, as fal's card and pricing API name it. */
  unit: string;
  /** Why no request field determines the quantity, from the recorded bill. */
  why: string;
}

// The billed unit of each dynamically priced fal endpoint whose card and
// recorded bill were checked, and why the request cannot fix the quantity.
// computeEstimate names both in its dynamic warning. Cards, OpenAPIs and the
// pricing API were re-read on 2026-10-17 and matched the 2026-10-15 reads
// behind each recording (ac-j3d6ki.4).
export const FAL_DYNAMIC_BILLED_UNITS = {
  // publicEndpointBilling and pricing API checked 2026-10-23: $0.034 per
  // output second (no card). Asked to keep a five-second clip under ten
  // seconds, the agent returned 3.22 s and billed 4 units ($0.136): whole
  // output seconds of a length it chose.
  "fal-ai/heygen/v3/video-agent": {
    unit: "seconds of output video at $0.034",
    why: "the agent decides the output length and no request field fixes it",
  },
  // Card and pricing API checked 2026-10-23: $0.034 per output video second.
  // Asked for about 5 s (config.duration 5), the agent returned 3.93 s and
  // billed 4 units ($0.136): whole output seconds of a length it chose.
  "fal-ai/heygen/v2/video-agent": {
    unit: "seconds of output video at $0.034",
    why: "the agent decides the output length; config.duration is only approximate",
  },
  // Card checked 2026-10-23: $0.094/s at 720p and $0.141/s at 1080p on the
  // input plus output length, at least twice the output, while
  // publicEndpointBilling and the pricing API list seconds at $0.157. Editing
  // our 3.04 s Kling 4 clip at 720p returned 3.04 s and billed 3.6175 units
  // ($0.568): the card's $0.094 on 6.042 s, a little under the two files'
  // 6.08 s, counted in $0.157 units.
  "kling/v4/video-to-video/edit": {
    unit: "units at $0.157, with the card quoting $0.094 (720p) or $0.141 (1080p) per second of input plus output video, at least twice the output",
    why: "the source video's length is billed and no request field states it",
  },
  // Card and pricing API checked 2026-10-23: $0.01 per second of input video,
  // with a 60-second minimum, and no charge when no cut is made. Our 2.96 s
  // avatar clip came back unchanged (num_cuts 0, a byte-identical file) and
  // billed 0 units, so the input's length and content set the bill.
  "fal-ai/heygen/v3/filler-word-removal": {
    unit: "seconds of input video at $0.01, with a 60-second minimum",
    why: "the charge follows the input video's length (no request field states it), and nothing is charged when no cut is made",
  },
  // Card checked 2026-10-23: $0.10 per output video second, while
  // publicEndpointBilling and the pricing API list $0.05 per second.
  // Translating our 2.96 s avatar clip into Spanish returned 3.28 s and billed
  // 8 units at $0.05 ($0.40): the card's $0.10 for each of 4 whole output
  // seconds, so each billed second is two of the pricing API's units.
  "fal-ai/heygen/v2/translate/precision": {
    unit: "units at $0.05, two per whole second of output video (the card's $0.10 a second)",
    why: "the source video and the translation set the output length, and no request field fixes it",
  },
  // Card and pricing API checked 2026-10-23: $0.05 per output video second.
  // Translating our 2.96 s avatar clip into Spanish returned 3.24 s and billed
  // 4 units ($0.20): whole output seconds of a length the translation sets.
  "fal-ai/heygen/v2/translate/speed": {
    unit: "seconds of output video at $0.05",
    why: "the source video and the translation set the output length, and no request field fixes it",
  },
  // publicEndpointBilling and pricing API checked 2026-10-23: $0.10 per
  // second (no card). The speed tier's recorded inputs returned 2.88 s here
  // too and billed 3 units ($0.30): whole output seconds.
  "fal-ai/heygen/v3/lipsync/precision": {
    unit: "seconds of output video at $0.10",
    why: "the source video and replacement audio set the output length, and no request field fixes it",
  },
  // publicEndpointBilling and pricing API checked 2026-10-23: $0.05 per
  // second (no card). Lip-syncing our 2.96 s avatar video to our 2.90 s HeyGen
  // Voice clip returned 2.88 s and billed 3 units ($0.15): whole output seconds.
  "fal-ai/heygen/v3/lipsync/speed": {
    unit: "seconds of output video at $0.05",
    why: "the source video and replacement audio set the output length, and no request field fixes it",
  },
  // Card and pricing API checked 2026-10-23: $0.10 per second of generated
  // output video. The 41-character recording returned 2.96 s at 720p and
  // billed 3 units ($0.30), so whole output seconds bill.
  "fal-ai/heygen/avatar5/digital-twin": {
    unit: "seconds of output video at $0.10",
    why: "the spoken script or audio sets the final output length, and no request field fixes it",
  },
  // Card and pricing API checked 2026-10-23: $0.10 per output video second.
  // The recording (cat1.jpg speaking the 41-character prompt) returned 2.96 s
  // and billed 3 units ($0.30), so whole output seconds bill.
  "fal-ai/heygen/avatar4/image-to-video": {
    unit: "seconds of output video at $0.10",
    why: "the spoken script or audio sets the output length, and no request field fixes it",
  },
  // Card and pricing API checked 2026-10-23: $0.10 per output video second.
  // The 41-character recording returned 2.96 s of video and billed 3 units
  // ($0.30), so whole output seconds bill and the script sets them.
  "fal-ai/heygen/avatar4/digital-twin": {
    unit: "seconds of output video at $0.10",
    why: "the spoken script or audio sets the output length, and no request field fixes it",
  },
  // Card and pricing API checked 2026-10-23: $0.034 per output video second.
  // The 41-character recording returned 2.96 s of video and billed 3 units
  // ($0.102), so whole output seconds bill and the script sets them.
  "fal-ai/heygen/avatar3/digital-twin": {
    unit: "seconds of output video at $0.034",
    why: "the spoken script or audio sets the output length, and no request field fixes it",
  },
  // Card and queue result checked 2026-10-21: a four-second 480p clip
  // billed 4 units ($0.20); longer clips also bill generated overlap.
  "minimax/h3-max/reframe-video": {
    unit: "units at $0.05, with the card quoting generated seconds at $0.05 for 480p and $0.08 for 768p",
    why: "the request does not fix generated duration, and overlapping processing windows are also billable",
  },
  "google/nano-banana-2.1": {
    unit: "units of $1, summed from text, thinking and image tokens at the card's per-million-token rates",
    why: "no request field fixes the thinking or output image token counts",
  },
  "google/nano-banana-2.1/edit": {
    unit: "units of $1, summed from text, thinking and input and output image tokens at the card's per-million-token rates",
    why: "no request field fixes the thinking or output image token counts",
  },
  "fal-ai/flux-2-flex": {
    unit: "processed megapixels at $0.05",
    why: "a recorded 1024x768 output billed 0.834, neither the card's rounded-up 1 megapixel nor the output's own area",
  },
  "fal-ai/kandinsky6-pro/text-to-video": {
    unit: "units at $1.35, one unit being a 50-step 5-second 480p video",
    why: "the bill follows compute, not the card's step and upscale points (an 8-step call billed 0.1756 units where the card's $0.24 implies 0.1778)",
  },
  "fal-ai/kandinsky6-pro/image-to-video": {
    unit: "units at $1.40, one unit being a 50-step 5-second 480p video",
    why: "the bill follows compute, not the card's step and upscale points (an 8-step call billed 0.1756 units where the card's $0.25 implies 0.1786)",
  },
  "fal-ai/kandinsky6-lite/text-to-video": {
    unit: "units at $0.16, one unit being a 10-step 5-second 480p video",
    why: "the bill follows compute, not the card's step and upscale points (a 4-step call billed 0.5011 units where the card's $0.08 implies 0.5)",
  },
  "fal-ai/kandinsky6-lite/image-to-video": {
    unit: "units at $0.17, one unit being a 10-step 5-second 480p video",
    why: "the bill follows compute, not the card's step and upscale points (a 4-step call billed 0.5011 units where the card's $0.085 implies 0.5)",
  },
  "fal-ai/kandinsky6-vsr": {
    unit: "output megapixels times output frames at $0.00036",
    why: "the output size follows the input clip times upscale_factor, and the model sets the frame count (a 96-frame input came back with 89 frames)",
  },
  "fal-ai/kandinsky6-vsr/lite": {
    unit: "units at $0.00036, which the card calls output megapixels times output frames",
    why: "the output size follows the input clip and the model sets the frame count, and a recorded call billed 124.1384 units for an output of 147.64 megapixel-frames",
  },
  "mirelo-ai/sfx2.0/video-to-video": {
    unit: "output seconds times samples, $0.01 per second until 2026-12-13 and $0.015 from 2026-12-14",
    why: "a 1.5-second request billed 2 seconds, and fal publishes no rounding rule",
  },
} as const satisfies Partial<
  Record<(typeof FAL_DYNAMIC_PRICING_ENDPOINTS)[number], FalDynamicBilledUnit>
>;

/** The billed unit recorded for a dynamically priced fal endpoint, if any. */
export function falDynamicBilledUnit(
  endpoint: string
): FalDynamicBilledUnit | undefined {
  return Object.hasOwn(FAL_DYNAMIC_BILLED_UNITS, endpoint)
    ? FAL_DYNAMIC_BILLED_UNITS[
        endpoint as keyof typeof FAL_DYNAMIC_BILLED_UNITS
      ]
    : undefined;
}

export const fal: Record<string, ModelPricing> = {
  // Kling 4.0 reference-to-video: the card bills $0.157/s at 720p and $0.235/s
  // at 1080p, like text-to-video, and the pricing API lists the 720p rate.
  // The 3 s 720p recording with one reference image returned 3.04 s and
  // billed 3 units ($0.471): the requested seconds.
  // With reference videos or video elements the card switches to $0.094/s
  // (720p) and $0.141/s (1080p) on the input plus output length, at least
  // twice the output. That branch is unrecorded and the input length is not in
  // the payload, so those payloads warn instead of pricing.
  "kling/v4/reference-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: (p) => (klingV4HasVideoReference(p) ? undefined : klingV4Seconds(p)),
    warn: (p) =>
      klingV4HasVideoReference(p)
        ? [
            "fal 'kling/v4/reference-to-video': reference videos and video elements bill $0.094/s (720p) or $0.141/s (1080p) on the input plus output length, at least twice the output; the input length is not in the payload, so this request is not priced",
          ]
        : [],
    select: [resolutionTier("1080p")],
    rates: { "720p": 0.157, "1080p": 0.235 },
    source: source("kling/v4/reference-to-video", "2026-10-23"),
  },
  // Kling 4.0 image-to-video: the card bills $0.157/s at 720p and $0.235/s at
  // 1080p, and the pricing API lists the 720p rate. The 3 s 720p recording
  // returned 3.04 s (992x964, following the input's aspect) and billed 3 units
  // ($0.471): the requested seconds.
  "kling/v4/image-to-video": perSecondTiered(
    "kling/v4/image-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.157, "1080p": 0.235 },
    klingV4Seconds,
    "2026-10-23"
  ),
  // Kling 4.0's card bills $0.157/s at 720p and $0.235/s at 1080p, and the
  // pricing API lists the 720p rate. The 3 s 720p recording returned 3.04 s
  // and billed 3 units ($0.471): the requested seconds.
  "kling/v4/text-to-video": perSecondTiered(
    "kling/v4/text-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.157, "1080p": 0.235 },
    klingV4Seconds,
    "2026-10-23"
  ),
  // HeyGen Video reference-to-video's card prices it like text-to-video,
  // with no reference surcharge: the requested seconds at $0.02/s (480p,
  // 768p) and $0.06/s (1080p, 2K). The 5 s 480p recording with one
  // reference image returned 5.17 s of video and 5.26 s of audio and billed
  // exactly 5 units, charged at half the card ($0.01/s, 2026-10-23); no
  // video or audio reference was recorded. The card's list rates stand.
  "heygen/heygen-video/reference-to-video": perSecondTiered(
    "heygen/heygen-video/reference-to-video",
    [resolutionTier("768p")],
    { "480p": 0.02, "768p": 0.02, "1080p": 0.06, "2k": 0.06 },
    numericSeconds(5),
    "2026-10-23"
  ),
  // HeyGen Video image-to-video bills like text-to-video: the requested
  // seconds at the card's $0.02/s (480p, 768p) and $0.06/s (1080p, 2K). The
  // 5 s 480p recording returned 5.17 s of video and 5.26 s of audio and
  // billed exactly 5 units, charged at half the card ($0.01/s) as on
  // text-to-video (2026-10-23); the card's list rates stand.
  "heygen/heygen-video/image-to-video": perSecondTiered(
    "heygen/heygen-video/image-to-video",
    [resolutionTier("768p")],
    { "480p": 0.02, "768p": 0.02, "1080p": 0.06, "2k": 0.06 },
    numericSeconds(5),
    "2026-10-23"
  ),
  // HeyGen Video's card bills $0.02/s at 480p and 768p and $0.06/s at 1080p
  // and 2K. It bills the requested seconds: the 5 s 480p recording returned
  // 5.17 s of video and 5.26 s of audio and billed exactly 5 units. The
  // pricing API and the usage read charged them $0.01/s, half the card, with
  // no promotion published (2026-10-23); the card's list rates stand.
  "heygen/heygen-video/text-to-video": perSecondTiered(
    "heygen/heygen-video/text-to-video",
    [resolutionTier("768p")],
    { "480p": 0.02, "768p": 0.02, "1080p": 0.06, "2k": 0.06 },
    numericSeconds(5),
    "2026-10-23"
  ),
  // Ideogram Vector text-to-vector bills each generated SVG by quality: low
  // $0.13, medium $0.16, high $0.20, and high with reference images $0.32
  // (low and medium unchanged; card read 2026-10-23). The one-SVG low
  // recording billed 13 units at $0.01, and the usage read confirmed $0.13.
  "ideogram/vector/text-to-vector": {
    kind: "perUnit",
    unit: "images",
    units: imageCount,
    select: [
      {
        name: "quality",
        pick: (p) => {
          const quality = asString(p.quality) ?? "medium";
          const references = Array.isArray(p.image_urls)
            ? p.image_urls.length
            : 0;
          return quality === "high" && references > 0
            ? "high_with_references"
            : quality;
        },
      },
    ],
    rates: { low: 0.13, medium: 0.16, high: 0.2, high_with_references: 0.32 },
    source: source("ideogram/vector/text-to-vector", "2026-10-23"),
  },
  // Ideogram Vector image-to-vector bills $0.10 per generated SVG in both
  // modes (card read 2026-10-23); one request converts one image into one
  // SVG. The recording billed 10 units at $0.01, and the usage read confirmed
  // the card's $0.10.
  "ideogram/vector/image-to-vector": {
    kind: "perUnit",
    unit: "images",
    units: () => 1,
    select: [],
    rates: { "": 0.1 },
    source: source("ideogram/vector/image-to-vector", "2026-10-23"),
  },
  // HeyGen Voice Turbo's card bills $0.004 per 1,000 input characters, and
  // the request's text length is the unit count: the 41-character recording
  // billed 0.041 units. As with HeyGen Voice, the pricing API and the usage
  // read charged that call half the card ($0.002 per 1,000, cost_total
  // $0.000082) with no promotion published (2026-10-23); the card's list rate
  // stands.
  "heygen/heygen-voice/turbo": perCharacter(
    "heygen/heygen-voice/turbo",
    0.004 / 1_000,
    "2026-10-23"
  ),
  // HeyGen Voice's card bills $0.03 per 1,000 input characters, and the
  // request's text length is the unit count: the 41-character recording billed
  // 0.041 units. The pricing API and the usage read charged that call at $0.015
  // per 1,000 (cost_total $0.000615), half the card, with no promotion or end
  // date published (2026-10-23), so the card's list rate stands.
  "heygen/heygen-voice": perCharacter(
    "heygen/heygen-voice",
    0.03 / 1_000,
    "2026-10-23"
  ),
  // $0.30 per retextured model, PBR maps at no extra cost. The recording
  // billed 1 generation; usage confirmed the card's $0.30.
  "meshy/v6-lite/retexture": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.3 },
    source: source("meshy/v6-lite/retexture", "2026-10-16"),
  },
  // Requested seconds at $0.08, fixed 768p with audio. The five-second
  // recording billed 8 units at $0.05; usage confirmed the card's $0.40.
  "minimax/h3-max/styles/16bit-pixel": perSecond(
    "minimax/h3-max/styles/16bit-pixel",
    0.08,
    numericSeconds(5),
    "2026-10-16"
  ),
  // Requested seconds at $0.08, fixed 768p with audio. The five-second
  // recording billed 8 units at $0.05; usage confirmed the card's $0.40.
  "minimax/h3-max/styles/hand-drawn": perSecond(
    "minimax/h3-max/styles/hand-drawn",
    0.08,
    numericSeconds(5),
    "2026-10-16"
  ),
  // Requested seconds at $0.08, fixed 768p with audio. The five-second
  // recording billed 8 units at $0.05; usage confirmed the card's $0.40.
  "minimax/h3-max/styles/low-poly": perSecond(
    "minimax/h3-max/styles/low-poly",
    0.08,
    numericSeconds(5),
    "2026-10-16"
  ),
  // Requested seconds at $0.08, fixed 768p with audio. The five-second
  // recording billed 8 units at $0.05; usage confirmed the card's $0.40.
  "minimax/h3-max/styles/retro-toon-70s": perSecond(
    "minimax/h3-max/styles/retro-toon-70s",
    0.08,
    numericSeconds(5),
    "2026-10-16"
  ),
  // Bills each requested second at $0.08: the output is fixed at 768p with
  // audio, and duration runs 5 to 15 seconds (default 5). fal counts the
  // charge in units of $0.05: the recorded 5 s call billed 8 units, $0.40,
  // the card's price, though the returned clip ran 5.18 s.
  "minimax/h3-max/styles/vhs": perSecond(
    "minimax/h3-max/styles/vhs",
    0.08,
    numericSeconds(5),
    "2026-10-16"
  ),
  // Bills each second of the INPUT audio at the resolution tier (default
  // 720p): $0.06 at 720p and $0.09 at 1080p, rounded up to whole seconds
  // with a 10-second minimum and a 6-minute maximum. The request carries the
  // audio only as a URL, so the caller declares its length through
  // costHints.durationSeconds, as for the LTX 2.5 audio-to-video tiers, and
  // an omitted hint fails closed. The recorded 12.0 s clip at 720p billed
  // x-fal-billable-units 12, $0.72, the card's price, though the returned
  // video ran 12.16 s.
  "pixverse/music-video/vibemv": perSecondTiered(
    "pixverse/music-video/vibemv",
    [resolutionTier("720p")],
    { "720p": 0.06, "1080p": 0.09 },
    (_p, hints) => {
      const seconds = hintSeconds(hints);
      return seconds === undefined
        ? undefined
        : Math.min(360, Math.max(10, Math.ceil(seconds)));
    },
    "2026-10-16"
  ),
  // The five-second 480p recording billed 5 units, matching the card rate.
  "pixelcut/looping-video": perSecondTiered(
    "pixelcut/looping-video",
    [resolutionTier("1080p")],
    { "480p": 0.08, "768p": 0.16, "1080p": 0.32 },
    numericSeconds(5),
    "2026-10-16"
  ),
  // Bills requested seconds at the card's resolution tier. A one-second 720p
  // call produced 25 frames but billed 1 unit; usage confirmed $0.01, matching
  // the card rather than the frame-rounded output duration (2026-10-16).
  "creatify/boreal": perSecondTiered(
    "creatify/boreal",
    [resolutionTier("720p")],
    { "720p": 0.01, "1080p": 0.03, "2k": 0.12 },
    numericSeconds(10),
    "2026-10-16"
  ),
  // Bills $0.0125 per minute of INPUT audio. The card rounds the length to
  // whole seconds, then up to whole minutes, with a one-minute minimum. The
  // request carries the audio only as a URL, so the caller declares its
  // length through costHints.durationSeconds, as for scribe-v2, and an
  // omitted hint fails closed. CostUnit has no minutes member, so the entry
  // prices the billed minutes as seconds (60 per minute) at the minute rate
  // over 60, as scribe-v2 does. fal counts the charge in minutes: the
  // recorded call sent 6.008 s of audio and billed x-fal-billable-units 1,
  // one minute, so the charge is $0.0125.
  "veed/clean-audio": {
    kind: "perUnit",
    unit: "seconds",
    units: (_p, hints) => {
      const seconds = hintSeconds(hints);
      return seconds === undefined
        ? undefined
        : 60 * Math.max(1, Math.ceil(Math.round(seconds) / 60));
    },
    warn: (_p, hints) =>
      hintSeconds(hints) === undefined
        ? [
            "fal 'veed/clean-audio': input audio duration is required; pass costHints.durationSeconds",
          ]
        : [],
    select: [],
    rates: { "": 0.0125 / 60 },
    source: source("veed/clean-audio", "2026-10-16"),
  },
  // Bills each requested second (duration, a digit string defaulting to "5")
  // at $0.084 with audio off and $0.112 with audio on; generate_audio
  // defaults to false here, unlike Kling v3. fal counts the charge in
  // seconds of $0.14: the recorded 3 s call with audio off billed 1.8 units
  // ($0.252, the card's price) although the file ran 3.042 s. multi_prompt
  // shots carry their own durations, which the card does not price, so a
  // payload with shots warns.
  "fal-ai/kling-video/o3/standard/image-to-video": perSecondTiered(
    "fal-ai/kling-video/o3/standard/image-to-video",
    [
      {
        name: "generate_audio",
        pick: (p) =>
          typeof p.generate_audio === "boolean"
            ? String(p.generate_audio)
            : "false",
      },
    ],
    { false: 0.084, true: 0.112 },
    (p) =>
      Array.isArray(p.multi_prompt) && p.multi_prompt.length > 0
        ? undefined
        : klingSeconds(p),
    "2026-10-15"
  ),
  // Bills the generated length, which no request field carries, so the entry
  // needs costHints.durationSeconds: the source converted to 24 fps and
  // trimmed to the closest 17n+5 frames (at least 56). The recorded 4 s,
  // 96-frame source came back as 90 frames and billed 3.75 units of $0.05 at
  // 480P ($0.1875).
  "minimax/h3-max/relight": perSecondTiered(
    "minimax/h3-max/relight",
    [resolutionTier("768P")],
    { "480P": 0.05, "768P": 0.08, "1080P": 0.16, "2K": 0.32 },
    hintedSeconds,
    "2026-10-15"
  ),
  // Bills the requested seconds (default 5) at the resolution tier (default
  // 720p); audio does not change the price. The recorded 3 s 540p call billed
  // 27 units of $0.0035 ($0.0945) although the file played 3.042 s. List
  // rates; the promotional 30% off ($0.0315/$0.0665/$0.084/$0.133/$0.273 per
  // second) ends 2026-11-30.
  "fal-ai/vidu/q4/reference-to-video": perSecondTiered(
    "fal-ai/vidu/q4/reference-to-video",
    [resolutionTier("720p")],
    { "540p": 0.045, "720p": 0.095, "1080p": 0.12, "2K": 0.19, "4K": 0.39 },
    numericSeconds(5),
    "2026-10-15"
  ),
  // Bills the requested seconds (default 5) at the resolution tier (default
  // 720p): the recorded 3 s 540p call billed 27 units of $0.0035 ($0.0945)
  // although the file played 3.042 s. List rates; the promotional 30% off
  // ($0.0315/$0.0665/$0.084/$0.133/$0.273 per second) ends 2026-11-30.
  "fal-ai/vidu/q4/image-to-video": perSecondTiered(
    "fal-ai/vidu/q4/image-to-video",
    [resolutionTier("720p")],
    { "540p": 0.045, "720p": 0.095, "1080p": 0.12, "2K": 0.19, "4K": 0.39 },
    numericSeconds(5),
    "2026-10-15"
  ),
  // No card: publicEndpointBilling, pricing API and usage agree on
  // $0.0135 per request; the recorded call billed one unit.
  // Lyrics-mode mureka-7.6 recorded 6 units at $0.0075 ($0.045),
  // confirmed by the usage API; rates follow the model page's card.
  "mureka/api/generate/song": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      { name: "model", pick: (p) => asString(p.model) ?? "mureka-9.5" },
      { name: "mode", pick: (p) => (p.lyrics != null ? "lyrics" : "prompt") },
    ],
    rates: {
      "mureka-7.6|lyrics": 0.045,
      "mureka-o2|lyrics": 0.0675,
      "mureka-8|lyrics": 0.0675,
      "mureka-9|lyrics": 0.0675,
      "mureka-9.5|lyrics": 0.225,
      "mureka-7.6|prompt": 0.45,
      "mureka-o2|prompt": 0.45,
      "mureka-8|prompt": 0.45,
      "mureka-9|prompt": 0.45,
      "mureka-9.5|prompt": 0.75,
    },
    source: source("mureka/api/generate/song", "2026-10-15"),
  },
  "mureka/api/generate/lyrics": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.0135 },
    source: source("mureka/api/generate/lyrics", "2026-10-15"),
  },
  // Card, pricing API and usage read: $0.03 per image, whatever the output
  // size; recorded billable units: 1.
  "fal-ai/marigold-v2": perImage("fal-ai/marigold-v2", 0.03, "2026-10-15"),
  // Card and pricing API: $0.03 per image; recorded billable units: 1.
  "bria/guided-remove-background": perImage(
    "bria/guided-remove-background",
    0.03,
    "2026-10-15"
  ),
  // Bria Fibo Edit 1.5 expand bills $0.04 per image. The card
  // reads $0.04 per image and the pricing API bills 0.04 USD per
  // image. The recorded call billed x-fal-billable-units 1, one
  // image, so the charge is $0.04.
  "bria/fibo-edit-1.5/expand": perImage(
    "bria/fibo-edit-1.5/expand",
    0.04,
    "2026-10-15"
  ),

  // Ray 3.2 image-to-video publishes one package: $0.15 for
  // 5s at 540p. Duration defaults to 5s and resolution to
  // 540p. The schema also allows 10s, but the card does not
  // price it. The recorded 5s call billed
  // x-fal-billable-units 5. At the pricing API's $0.03 per
  // unit that is $0.15, the 5s package. HDR, EXR, 720p, and
  // 1080p warn.
  "luma/agent/ray/v3.2/image-to-video": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "package",
        pick: (p) => {
          // The card publishes only the 540p 5s package. 10s, HDR,
          // EXR, 720p, and 1080p have no price on this page.
          if (p.hdr === true || p.exr_export === true) return undefined;
          const res = asString(p.resolution) ?? "540p";
          if (res !== "540p") return undefined;
          const d = asString(p.duration) ?? "5s";
          return d === "5s" ? "5s" : undefined;
        },
      },
    ],
    rates: { "5s": 0.15 },
    source: source("luma/agent/ray/v3.2/image-to-video", "2026-10-08"),
  },

  // Ray 3.2 video-to-video publishes two 540p packages:
  // $0.72 for 5s and $1.44 for 10s. Duration defaults to 5s
  // and resolution to 540p, so an omitted pair is $0.72.
  // The recorded 5s call billed x-fal-billable-units 24.
  // At the pricing API's $0.03 per unit that is $0.72, the
  // 5s package. HDR, EXR, 720p, and 1080p are higher tiers
  // with no published price, so those payloads warn.
  "luma/agent/ray/v3.2/video-to-video": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "package",
        pick: (p) => {
          // The card publishes only 540p packages. HDR, EXR, 720p,
          // and 1080p are named as higher tiers without a price.
          if (p.hdr === true || p.exr_export === true) return undefined;
          const res = asString(p.resolution) ?? "540p";
          if (res !== "540p") return undefined;
          const d = asString(p.duration) ?? "5s";
          return d === "5s" || d === "10s" ? d : undefined;
        },
      },
    ],
    rates: { "5s": 0.72, "10s": 1.44 },
    source: source("luma/agent/ray/v3.2/video-to-video", "2026-10-08"),
  },

  // Cosmos 3 Super text-to-image bills $0.04 per image.
  // num_images defaults to 1. The recorded call billed
  // x-fal-billable-units 1, one image, so the charge is $0.04.
  // Prompt expansion adds $0.02 per request. Agentic generation
  // bills every candidate, which the card does not count, so
  // that flag warns instead of guessing. Both flags default
  // to false.
  "nvidia/cosmos-3-super/text-to-image": {
    kind: "perUnit",
    unit: "images",
    units: (p) => {
      // Agentic mode bills every candidate. The card does not publish
      // how many images that loop renders, so the estimate warns.
      if (p.enable_agentic_generation === true) return undefined;
      return asNumber(p.num_images) ?? 1;
    },
    select: [],
    rates: { "": 0.04 },
    extra: (p) => (p.enable_prompt_expansion === true ? 0.02 : 0),
    source: source("nvidia/cosmos-3-super/text-to-image", "2026-10-08"),
  },

  // Cosmos 3 Super image-to-video bills $0.05 per generated
  // second, rounded up. num_frames defaults to 189 and
  // frames_per_second to 24. Five frames at 24 fps is 0.208s
  // of video and rounds up to one second. The recorded call
  // billed x-fal-billable-units 1, so the charge is $0.05.
  // Agentic generation bills every candidate, which the card
  // does not count, so that flag warns instead of guessing.
  // Prompt expansion is not a separate published charge.
  "nvidia/cosmos-3-super/image-to-video": perSecond(
    "nvidia/cosmos-3-super/image-to-video",
    0.05,
    (p) => {
      // Agentic mode bills every candidate. The card does not publish
      // how many renders that loop performs, so the estimate warns.
      if (p.enable_agentic_generation === true) return undefined;
      const frames = asNumber(p.num_frames) ?? 189;
      const fps = asNumber(p.frames_per_second) ?? 24;
      if (!(fps > 0)) return undefined;
      return Math.ceil(frames / fps);
    },
    "2026-10-08"
  ),

  // Muse Image edit bills $0.01 per image, the same card as
  // text-to-image. num_images defaults to 1. The recorded call
  // billed x-fal-billable-units 1, one image, so the charge is
  // $0.01.
  "meta/muse-image/edit": perImage("meta/muse-image/edit", 0.01, "2026-10-08"),

  // Muse Image text-to-image bills $0.01 per image. num_images
  // defaults to 1. The recorded call billed x-fal-billable-units
  // 1, one image, so the charge is $0.01.
  "meta/muse-image/text-to-image": perImage(
    "meta/muse-image/text-to-image",
    0.01,
    "2026-10-08"
  ),

  // ElevenLabs Music v2.5 bills $0.60 per output minute, rounded
  // up. music_length_ms is optional; an omitted length is chosen
  // by the model, so the estimate warns instead of guessing. The
  // recorded 3000 ms call billed x-fal-billable-units 1, one
  // rounded minute, so the charge is $0.60.
  "elevenlabs/music/v2.5": {
    kind: "perUnit",
    unit: "generations",
    units: (p) => {
      const ms = asNumber(p.music_length_ms);
      return ms === undefined ? undefined : Math.ceil(ms / 60_000);
    },
    select: [],
    rates: { "": 0.6 },
    source: source("elevenlabs/music/v2.5", "2026-10-08"),
  },

  // Bria Fibo Gen 1.5 text-to-image bills $0.04 per image. The
  // model page has no price card; the pricing API bills 0.04
  // USD per image. Resolution defaults to 1MP. The recorded
  // call billed x-fal-billable-units 1, one image, so the
  // charge is $0.04.
  "bria/fibo-gen-1.5/text-to-image": perImage(
    "bria/fibo-gen-1.5/text-to-image",
    0.04,
    "2026-10-08"
  ),

  // Fibo 2 edit returns one image at $0.04 per image.
  "bria/fibo-2/edit": perImage("bria/fibo-2/edit", 0.04, "2026-10-21"),

  // Fibo 2 generate returns one image at $0.04 per image.
  "bria/fibo-2/generate": perImage("bria/fibo-2/generate", 0.04, "2026-10-21"),

  // Bria Fibo Edit 1.5 edit bills $0.04 per image. The model
  // page has no price card; the pricing API bills 0.04 USD per
  // image. The recorded call billed x-fal-billable-units 1, one
  // image, so the charge is $0.04.
  "bria/fibo-edit-1.5/edit": perImage(
    "bria/fibo-edit-1.5/edit",
    0.04,
    "2026-10-08"
  ),

  // FLUX 3 edit-video bills $0.03 per second of generated 720p
  // video. The schema has no duration; length follows the input,
  // so the estimate uses costHints.durationSeconds. The example
  // source's movie header is 10.042 s. The recorded call billed
  // x-fal-billable-units 10, so the charge is $0.30.
  "blackforestlabs/flux-3/edit-video": perSecond(
    "blackforestlabs/flux-3/edit-video",
    0.03,
    hintedSeconds,
    "2026-10-08"
  ),

  // Happy Horse 1.1 text-to-video bills $0.14/s at 720p and $0.18/s
  // at 1080p, the same card as the reference leaf. Resolution
  // defaults to 1080p and duration to 5. The recorded 3 s 720p
  // call billed x-fal-billable-units 3, the requested seconds, so
  // the charge is $0.42.
  "alibaba/happy-horse/v1.1/text-to-video": perSecondTiered(
    "alibaba/happy-horse/v1.1/text-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.14, "1080p": 0.18 },
    numericSeconds(5),
    "2026-10-08"
  ),

  // Happy Horse 1.1 image-to-video bills $0.14/s at 720p and
  // $0.18/s at 1080p, the same card as the reference leaf.
  // Resolution defaults to 1080p and duration to 5. The recorded 3 s
  // 720p call billed x-fal-billable-units 3, the requested seconds,
  // so the charge is $0.42.
  "alibaba/happy-horse/v1.1/image-to-video": perSecondTiered(
    "alibaba/happy-horse/v1.1/image-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.14, "1080p": 0.18 },
    numericSeconds(5),
    "2026-10-08"
  ),

  // Happy Horse 1.1 reference-to-video bills $0.14/s at 720p and
  // $0.18/s at 1080p. Resolution defaults to 1080p and duration to
  // 5. The recorded 3 s 720p call billed x-fal-billable-units 3, the
  // requested seconds, so the charge is $0.42.
  "alibaba/happy-horse/v1.1/reference-to-video": perSecondTiered(
    "alibaba/happy-horse/v1.1/reference-to-video",
    [resolutionTier("1080p")],
    { "720p": 0.14, "1080p": 0.18 },
    numericSeconds(5),
    "2026-10-08"
  ),

  // Qwen Audio 3 bills $0.05 per 1,000 input characters (pricing API
  // unit "1000 characters"; the card is blank). The request's text
  // length is the unit count. The recorded one-character call billed
  // x-fal-billable-units 0.001, one thousandth of that unit, $0.00005.
  "alibaba/qwen-audio-3-tts": perCharacter(
    "alibaba/qwen-audio-3-tts",
    0.05 / 1_000,
    "2026-10-08"
  ),

  // Kling v3 Turbo Pro image-to-video bills $0.14 per second at 720p,
  // the same card rate as the text-to-video leaf. Duration is a digit
  // string defaulting to "5". The recorded 3 s call billed
  // x-fal-billable-units 3, the requested seconds, so the charge is
  // $0.42.
  "fal-ai/kling-video/v3/turbo/pro/image-to-video": perSecond(
    "fal-ai/kling-video/v3/turbo/pro/image-to-video",
    0.14,
    klingSeconds,
    "2026-10-08"
  ),

  // Kling v3 Turbo Pro bills $0.14 per second at 720p. Duration is a
  // digit string defaulting to "5", and the card has no audio toggle.
  // The recorded 3 s call billed x-fal-billable-units 3, the requested
  // seconds, so the charge is $0.42.
  "fal-ai/kling-video/v3/turbo/pro/text-to-video": perSecond(
    "fal-ai/kling-video/v3/turbo/pro/text-to-video",
    0.14,
    klingSeconds,
    "2026-10-08"
  ),

  // Kling v3 Turbo Standard image-to-video bills $0.112 per second at
  // 720p, the same card rate as the text-to-video leaf. Duration is a
  // digit string defaulting to "5". The recorded 3 s call billed
  // x-fal-billable-units 3, the requested seconds, so the charge is
  // $0.336.
  "fal-ai/kling-video/v3/turbo/standard/image-to-video": perSecond(
    "fal-ai/kling-video/v3/turbo/standard/image-to-video",
    0.112,
    klingSeconds,
    "2026-10-08"
  ),

  // Kling v3 Turbo Standard bills $0.112 per second at 720p. Duration
  // is a digit string defaulting to "5", and the card has no audio
  // toggle. The recorded 3 s call billed x-fal-billable-units 3, the
  // requested seconds (pricing API: 0.112 USD per second), so the
  // charge is $0.336. fal does not count this charge in cents.
  "fal-ai/kling-video/v3/turbo/standard/text-to-video": perSecond(
    "fal-ai/kling-video/v3/turbo/standard/text-to-video",
    0.112,
    klingSeconds,
    "2026-10-08"
  ),

  // Bills each second of the INPUT audio (2 to 20 s on the fast tier) at
  // one rate. The request carries the audio only as a URL, so the caller
  // declares its length through costHints.durationSeconds, as for
  // scribe-v2, and an omitted hint fails closed. fal counts the charge in
  // cents: the recorded call sent 3.28 s of audio and billed 42.64 units at
  // $0.01, $0.4264, the card's price for 3.28 s, though the returned clip
  // ran 3.04 s.
  "lightricks/ltx-2.5/audio-to-video/fast": perSecond(
    "lightricks/ltx-2.5/audio-to-video/fast",
    0.13,
    hintedSeconds,
    "2026-10-08"
  ),

  // Bills each second of the INPUT audio (2 to 10 s on the pro tier) at one
  // rate. The request carries the audio only as a URL, so the caller
  // declares its length through costHints.durationSeconds, as for
  // scribe-v2, and an omitted hint fails closed. fal counts the charge in
  // cents: the recorded call sent 3.28 s of audio and billed 55.76 units at
  // $0.01, $0.5576, the card's price for 3.28 s, though the returned clip
  // ran 3.04 s.
  "lightricks/ltx-2.5/audio-to-video/pro": perSecond(
    "lightricks/ltx-2.5/audio-to-video/pro",
    0.17,
    hintedSeconds,
    "2026-10-08"
  ),

  // Bills the requested seconds at the resolution tier (default 1080p); the
  // pro tier runs 6 to 10 seconds at 720p or 1080p. fal counts the charge
  // in cents: the recorded 6 s 720p call billed 72 units at $0.01, $0.72,
  // the card's price for six seconds at 720p, though the returned clip ran
  // 6.12 s.
  "lightricks/ltx-2.5/text-to-video/pro": perSecondTiered(
    "lightricks/ltx-2.5/text-to-video/pro",
    [resolutionTier("1080p")],
    { "720p": 0.12, "1080p": 0.17 },
    ltx2p5Seconds,
    "2026-10-08"
  ),

  // Bills the requested seconds at the resolution tier (default 1080p); the
  // card's 4K is the 2160p tier. fal counts the charge in cents: the
  // recorded 6 s 720p call billed 54 units at $0.01, $0.54, the card's
  // price for six seconds at 720p, though the returned clip ran 6.12 s.
  "lightricks/ltx-2.5/text-to-video/fast": perSecondTiered(
    "lightricks/ltx-2.5/text-to-video/fast",
    [resolutionTier("1080p")],
    { "720p": 0.09, "1080p": 0.13, "1440p": 0.19, "2160p": 0.3 },
    ltx2p5Seconds,
    "2026-10-08"
  ),

  // Bills the requested seconds (default 6) at the resolution tier (default
  // 720p), plus $0.01 for the one input image. fal counts the charge in
  // cents: the recorded 1 s 480p call billed 9 units at $0.01, $0.09, the
  // card's $0.08 for one second at 480p plus its $0.01 per image.
  "xai/grok-imagine-video/v1.5/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: numericSeconds(6),
    select: [resolutionTier("720p")],
    rates: { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    extra: () => 0.01,
    source: source("xai/grok-imagine-video/v1.5/image-to-video", "2026-10-08"),
  },

  // Bills the requested seconds (default 6) at the resolution tier (default
  // 720p). fal counts the charge in cents: the recorded 1 s 480p call billed
  // 8 units at $0.01, $0.08, the card's price for one second at 480p.
  "xai/grok-imagine-video/v1.5/text-to-video": perSecondTiered(
    "xai/grok-imagine-video/v1.5/text-to-video",
    [resolutionTier("720p")],
    { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    numericSeconds(6),
    "2026-10-08"
  ),

  // Bills the requested seconds (default 5) at the resolution tier (default
  // 768P): the recorded 0.92 s 480P call billed 0.92 units, $0.0138. List
  // rates; the promotional $0.015/$0.024/$0.048 per second ends 2026-10-15.
  "minimax/h3-max-turbo/text-to-video": perSecondTiered(
    "minimax/h3-max-turbo/text-to-video",
    [resolutionTier("768P")],
    { "480P": 0.025, "768P": 0.04, "1080P": 0.08 },
    numericSeconds(5),
    "2026-10-08"
  ),

  // Bills the requested seconds (default 5) at the resolution tier (default
  // 768P): the recorded 0.92 s 480P call billed 0.92 units, $0.0138. List
  // rates; the promotional $0.015/$0.024/$0.048 per second ends 2026-10-15.
  "minimax/h3-max-turbo/image-to-video": perSecondTiered(
    "minimax/h3-max-turbo/image-to-video",
    [resolutionTier("768P")],
    { "480P": 0.025, "768P": 0.04, "1080P": 0.08 },
    numericSeconds(5),
    "2026-10-08"
  ),

  // Bills the requested seconds (default 5) at the resolution tier (default
  // 480P): the recorded 0.92 s 480P call billed 0.92 units, $0.0276.
  // List rates; the promotional $0.03/$0.048/$0.096 per second ends 2026-10-15.
  "minimax/h3-max/camera-controls": perSecondTiered(
    "minimax/h3-max/camera-controls",
    [resolutionTier("480P")],
    { "480P": 0.05, "768P": 0.08, "1080P": 0.16 },
    numericSeconds(5),
    "2026-10-07"
  ),

  // Bills the requested seconds (default 5) at the resolution tier (default
  // 768P): the recorded 0.92 s 480P call billed 0.92 units, $0.0276.
  // List rates; the promotional $0.03/$0.048/$0.096 per second ends 2026-10-15.
  "minimax/h3-max/text-to-video": perSecondTiered(
    "minimax/h3-max/text-to-video",
    [resolutionTier("768P")],
    { "480P": 0.05, "768P": 0.08, "1080P": 0.16 },
    numericSeconds(5),
    "2026-10-07"
  ),

  // Bills the requested seconds (default 5) at the resolution tier (default
  // 768P): the recorded 0.92 s 480P call billed 0.92 units, $0.0276.
  // List rates; the promotional $0.03/$0.048/$0.096 per second ends 2026-10-15.
  "minimax/h3-max/image-to-video": perSecondTiered(
    "minimax/h3-max/image-to-video",
    [resolutionTier("768P")],
    { "480P": 0.05, "768P": 0.08, "1080P": 0.16 },
    numericSeconds(5),
    "2026-10-07"
  ),

  "bria/fibo-edit-1.5/product-holding": perImage(
    "bria/fibo-edit-1.5/product-holding",
    0.04,
    "2026-10-05"
  ),

  "bria/fibo-edit-1.5/virtual-try-on": perImage(
    "bria/fibo-edit-1.5/virtual-try-on",
    0.04,
    "2026-10-05"
  ),

  "google/lyria-3.5": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.1 },
    source: source("google/lyria-3.5", "2026-10-05"),
  },

  "meshy/v7.1/multi-image-to-3d": meshyV71(
    "meshy/v7.1/multi-image-to-3d",
    "2026-10-05"
  ),

  "meshy/v7.1/image-to-3d": meshyV71("meshy/v7.1/image-to-3d", "2026-10-05"),

  "meshy/v7.1/text-to-3d": meshyV71("meshy/v7.1/text-to-3d", "2026-10-05"),

  "recraft/v4.1/flash/text-to-image": perImage(
    "recraft/v4.1/flash/text-to-image",
    0.007,
    "2026-10-05"
  ),

  "tripo3d/p2/image-to-3d": tripoP2("tripo3d/p2/image-to-3d", "2026-10-05"),

  "tripo3d/p2/text-to-3d": tripoP2("tripo3d/p2/text-to-3d", "2026-10-05"),

  "bytedance/seedream/v5/flash/text-to-image": perImage(
    "bytedance/seedream/v5/flash/text-to-image",
    0.027,
    "2026-10-05"
  ),

  "bytedance/seedream/v5/flash/edit": perImage(
    "bytedance/seedream/v5/flash/edit",
    0.027,
    "2026-10-05"
  ),

  "bytedance/seedream/v5/flash/layerize": perOutputImage(
    "bytedance/seedream/v5/flash/layerize",
    0.027,
    "2026-10-05"
  ),

  "google/gemini-3.8-flash-lite-tts": perSpokenCharacter(
    "google/gemini-3.8-flash-lite-tts",
    3e-5,
    "2026-10-05"
  ),

  "google/gemini-3.8-flash-tts": perSpokenCharacter(
    "google/gemini-3.8-flash-tts",
    4.5e-5,
    "2026-10-05"
  ),

  "elevenlabs/tts/eleven-v4": perCharacter(
    "elevenlabs/tts/eleven-v4",
    8e-5,
    "2026-10-05"
  ),

  "elevenlabs/tts/eleven-v4-turbo": perCharacter(
    "elevenlabs/tts/eleven-v4-turbo",
    4e-5,
    "2026-10-05"
  ),

  "ideogram/v4.5": {
    kind: "perUnit",
    unit: "images",
    units: imageCount,
    select: [{ name: "quality", pick: (p) => asString(p.quality) ?? "medium" }],
    rates: { low: 0.03, medium: 0.06, high: 0.22 },
    source: source("ideogram/v4.5", "2026-10-05"),
  },

  "ideogram/v4.5/edit": {
    kind: "perUnit",
    unit: "images",
    units: imageCount,
    select: [{ name: "quality", pick: (p) => asString(p.quality) ?? "medium" }],
    rates: { very_low: 0.008, low: 0.03, medium: 0.06, high: 0.22 },
    source: source("ideogram/v4.5/edit", "2026-10-05"),
  },

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

  // Image — Flux (area-priced). Each card says images are billed by rounding
  // up to the nearest megapixel.
  "fal-ai/flux/dev": perMegapixel(
    "fal-ai/flux/dev",
    0.025,
    megapixelAsOf,
    "landscape_4_3"
  ),
  "fal-ai/flux/schnell": perMegapixel(
    "fal-ai/flux/schnell",
    0.003,
    megapixelAsOf,
    "landscape_4_3"
  ),

  // Image — Qwen Image (area-priced, rounded up per image like Flux). The
  // recorded square_hd call billed x-fal-billable-units 1, and the usage API
  // agrees: 1 megapixel at $0.02.
  "fal-ai/qwen-image": perMegapixel(
    "fal-ai/qwen-image",
    0.02,
    megapixelAsOf,
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

  // Image — Hunyuan Image 3 instruct edit (area-priced, whole megapixels
  // only). image_size defaults to "auto" upstream, which has no fixed
  // dimensions — so an omitted field is as underivable as an explicit "auto"
  // and takes the warning path. The recorded "auto" call returned 1038x1010
  // and billed 1 megapixel.
  "fal-ai/hunyuan-image/v3/instruct/edit": perWholeMegapixel(
    "fal-ai/hunyuan-image/v3/instruct/edit",
    0.09,
    megapixelAsOf
  ),

  // Image — Qwen Image Edit (area-priced, whole megapixels only). Its fal.ai
  // page publishes no fixed image_size default, so omission warns rather than
  // assuming the generation endpoint's landscape_4_3 default. The recorded
  // call returned 1376x768, which is more than one megapixel, yet billed 1:
  // returned dimensions alone do not establish its rounding rule.
  "fal-ai/qwen-image-edit": perWholeMegapixel(
    "fal-ai/qwen-image-edit",
    0.03,
    megapixelAsOf
  ),

  // Image — GPT Image 1.5 (per image on a quality × size grid)
  "fal-ai/gpt-image-1.5": gptImagePerImage("fal-ai/gpt-image-1.5", "1024x1024"),
  "fal-ai/gpt-image-1.5/edit": gptImagePerImage(
    "fal-ai/gpt-image-1.5/edit",
    "auto"
  ),

  // Video — FLUX 3 (Black Forest Labs), resolution-tiered per output second
  // Requested continuation seconds only; source duration is not billed.
  "minimax/h3-max-turbo/extend-video": perSecondTiered(
    "minimax/h3-max-turbo/extend-video",
    [resolutionTier("768P")],
    { "480P": 0.025, "768P": 0.04, "1080P": 0.08, "2K": 0.16 },
    (p) => (p.duration === undefined ? 5 : asNumber(p.duration)),
    "2026-10-05"
  ),
  // One input image adds $0.01 per request, independently of output duration.
  "xai/grok-imagine-video/v1.5/lite/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: (p) => (p.duration === undefined ? 6 : asNumber(p.duration)),
    select: [resolutionTier("720p")],
    rates: { "480p": 0.02, "720p": 0.03, "1080p": 0.14 },
    extra: () => 0.01,
    source: source(
      "xai/grok-imagine-video/v1.5/lite/image-to-video",
      "2026-10-05"
    ),
  },
  "xai/grok-imagine-video/v1.5/lite/text-to-video": perSecondTiered(
    "xai/grok-imagine-video/v1.5/lite/text-to-video",
    [resolutionTier("720p")],
    { "480p": 0.02, "720p": 0.03, "1080p": 0.14 },
    (p) => (p.duration === undefined ? 6 : asNumber(p.duration)),
    "2026-10-05"
  ),
  // Output duration is not in the request; require costHints.durationSeconds.
  // Reference images are included without an additional charge.
  "minimax/h3-max/recast": perSecondTiered(
    "minimax/h3-max/recast",
    [resolutionTier("1080P")],
    { "768P": 0.3, "1080P": 0.45 },
    hintedSeconds,
    "2026-10-05"
  ),
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
  // OpenAPI defaults omitted duration to 5 seconds and resolution to 720p.
  "blackforestlabs/flux-3-max/text-to-video": perSecondTiered(
    "blackforestlabs/flux-3-max/text-to-video",
    [resolutionTier("720p")],
    FLUX_3_MAX_RATES,
    numericSeconds(5),
    flux3MaxAsOf
  ),
  "blackforestlabs/flux-3-max/image-to-video": perSecondTiered(
    "blackforestlabs/flux-3-max/image-to-video",
    [resolutionTier("720p")],
    FLUX_3_MAX_RATES,
    numericSeconds(5),
    flux3MaxAsOf
  ),
  "blackforestlabs/flux-3-max/keyframes-to-video": perSecondTiered(
    "blackforestlabs/flux-3-max/keyframes-to-video",
    [resolutionTier("720p")],
    FLUX_3_MAX_RATES,
    numericSeconds(5),
    flux3MaxAsOf
  ),

  // Video — Seedance 2.0, 2.0 Fast and 2.5 bill output tokens (seedanceTokens
  // above). Each rate is the card's USD per 1000 tokens, divided by 1000.
  // 2.0: $0.014 at 480p, 720p and 1080p, and $0.008 at 4k.
  "bytedance/seedance-2.0/text-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/text-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: {
      "480p": 0.014 / 1000,
      "720p": 0.014 / 1000,
      "1080p": 0.014 / 1000,
      "4k": 0.008 / 1000,
    },
  }),
  "bytedance/seedance-2.0/image-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/image-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: {
      "480p": 0.014 / 1000,
      "720p": 0.014 / 1000,
      "1080p": 0.014 / 1000,
      "4k": 0.008 / 1000,
    },
  }),
  // 2.0 Fast: $0.0112 at 480p and 720p, its only resolutions.
  "bytedance/seedance-2.0/fast/text-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/fast/text-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: { "480p": 0.0112 / 1000, "720p": 0.0112 / 1000 },
  }),
  "bytedance/seedance-2.0/fast/image-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/fast/image-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: { "480p": 0.0112 / 1000, "720p": 0.0112 / 1000 },
  }),
  // 2.0 US: $0.0168 at 480p and 720p. The schema also offers 1080p and 4k,
  // but the card publishes no rate for them, so they fail closed.
  "bytedance/seedance-2.0/us/text-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/us/text-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: { "480p": 0.0168 / 1000, "720p": 0.0168 / 1000 },
  }),
  "bytedance/seedance-2.0/us/image-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/us/image-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: { "480p": 0.0168 / 1000, "720p": 0.0168 / 1000 },
  }),
  "bytedance/seedance-2.0/us/reference-to-video": seedance({
    endpointId: "bytedance/seedance-2.0/us/reference-to-video",
    sizes: SEEDANCE_2P0_SIZES,
    maxSeconds: 15,
    rates: { "480p": 0.0168 / 1000, "720p": 0.0168 / 1000 },
    operation: "reference",
    videoOnlyDivisor: 1000,
  }),
  // 2.5: $0.0214 at 480p and 720p, and $0.0234116 at 1080p. fal bills 1080p
  // as 1.094 x the formula tokens at the base $0.0214, which the card rounds
  // to "roughly $0.0234". The first billed 1080p call, a 1:1 4 s draft
  // completion (1440x1440, 97 frames: 196,425 formula tokens), billed
  // 214.88895 units = 196.425 x 1.094, $4.59862353 (ac-i5zo6h).
  "bytedance/seedance-2.5/text-to-video": seedance({
    endpointId: "bytedance/seedance-2.5/text-to-video",
    sizes: SEEDANCE_2P5_SIZES,
    maxSeconds: 30,
    rates: {
      "480p": 0.0214 / 1000,
      "720p": 0.0214 / 1000,
      "1080p": 0.0234116 / 1000,
    },
    draftFlag: true,
  }),
  "bytedance/seedance-2.5/reference-to-video": seedance({
    endpointId: "bytedance/seedance-2.5/reference-to-video",
    sizes: SEEDANCE_2P5_SIZES,
    maxSeconds: 30,
    rates: {
      "480p": 0.0214 / 1000,
      "720p": 0.0214 / 1000,
      "1080p": 0.0234116 / 1000,
    },
    operation: "reference",
    draftFlag: true,
    taskField: true,
  }),
  // 2.5 US: $0.02568 at 480p and 720p, and $0.02808 at 1080p, the card's
  // figure. No US 1080p call is recorded; if it carries the same 1.094 factor
  // as 2.5, the bill is 0.02568 x 1.094 = $0.02809392, 0.05% above. The US
  // schemas have no draft flag.
  "bytedance/seedance-2.5/us/text-to-video": seedance({
    endpointId: "bytedance/seedance-2.5/us/text-to-video",
    sizes: SEEDANCE_2P5_SIZES,
    maxSeconds: 30,
    rates: {
      "480p": 0.02568 / 1000,
      "720p": 0.02568 / 1000,
      "1080p": 0.02808 / 1000,
    },
  }),
  "bytedance/seedance-2.5/us/reference-to-video": seedance({
    endpointId: "bytedance/seedance-2.5/us/reference-to-video",
    sizes: SEEDANCE_2P5_SIZES,
    maxSeconds: 30,
    rates: {
      "480p": 0.02568 / 1000,
      "720p": 0.02568 / 1000,
      "1080p": 0.02808 / 1000,
    },
    operation: "reference",
    taskField: true,
  }),
  // A completed 2.5 draft: always 1080p, at the billed $0.0234116 (above).
  // It keeps the draft's duration, aspect ratio and inputs, which arrive as
  // costHints (durationSeconds, aspectRatio and, for a draft with video
  // inputs, inputDurationSeconds).
  "bytedance/seedance-2.5/draft/complete": seedance({
    endpointId: "bytedance/seedance-2.5/draft/complete",
    sizes: SEEDANCE_2P5_SIZES,
    maxSeconds: 30,
    rates: { "1080p": 0.0234116 / 1000 },
    operation: "complete",
  }),

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
