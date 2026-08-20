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
// resolution is "480p"|"720p"|"1080p"|"4k"; etc.) — there is no internal
// translation layer between the caller's payload and the rate selector.

const src = (slug: string) => ({ url: `https://kie.ai/market/${slug}` });
const page = (url: string) => ({ url });

// Source stamp for entries refreshed from the dated KIE pricing pulls. REQ-008
// wants a page URL plus an asOf on each touched entry, so the date lives in one
// place rather than being retyped per entry.
const pricePage = (url: string, asOf = "2026-08-06") => ({ url, asOf });

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

// Wan 2.2 speech-to-video publishes frame-count defaults (80 frames at 16
// frames/s) rather than a duration field. Derive the exact output length from
// the two finite wire values, applying each documented default independently.
const wanSpeechSeconds = (p: Record<string, unknown>): number | undefined => {
  const input = asObject(p.input);
  const frames = asNumber(
    input?.num_frames === undefined ? 80 : input.num_frames
  );
  const framesPerSecond = asNumber(
    input?.frames_per_second === undefined ? 16 : input.frames_per_second
  );
  if (frames === undefined || frames <= 0) return undefined;
  if (framesPerSecond === undefined || framesPerSecond <= 0) return undefined;
  return frames / framesPerSecond;
};

// Seedance 2.5 reserves -1 as a request-side duration sentinel. It is not a
// billable duration: only a positive cost hint can replace it. A parsed
// request with no duration uses the documented five-second default, while a
// raw request with an explicit invalid/negative duration fails closed.
const seedance25Seconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => {
  const wire = asObject(p.input)?.duration;
  if (wire !== undefined && wire !== null) {
    const value = coerceSeconds(wire);
    return value !== undefined && value > 0 ? value : hintSeconds(hints);
  }

  const hinted = hintSeconds(hints);
  if (hinted !== undefined) return hinted;

  if (p.duration !== undefined && p.duration !== null) {
    const value = coerceSeconds(p.duration);
    return value !== undefined && value > 0 ? value : undefined;
  }

  return 5;
};

// Rate-key form of a selector field upstream types as a number. `asString`
// deliberately rejects non-strings, so a numeric wire value — runway's
// `duration: 5` is a numeric literal union, not a string — would otherwise
// pick `undefined` and miss the rate table entirely.
const scalarKey = (value: unknown): string | undefined =>
  typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : asString(value);

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

// Images per createTask request. Two batch spellings appear across kie's image
// schemas: `input.n` (wan/2-7-image*) and `input.num_images`, which the
// ideogram and qwen/image-edit schemas declare as a STRING enum
// ("1"|"2"|"3"|"4"). asNumber rejects strings, so reading num_images through
// it would silently price `num_images: "3"` as a single image — the numeric
// coercion below is deliberate. Anything uncoercible (absent, null, an empty
// or non-numeric string, a non-scalar) falls back to one image.
const imageCount = (p: Record<string, unknown>): number => {
  const input = asObject(p.input);
  const declared = input?.num_images ?? input?.n;
  const count =
    typeof declared === "number" || typeof declared === "string"
      ? Number(declared)
      : NaN;
  return Number.isFinite(count) && count > 0 ? count : 1;
};

// Seedream 5 Pro edit charges $0.0025 for each input image after the first.
// The schema caps image_urls at ten, so the surcharge is a finite exact count
// rather than a media-size guess.
const seedreamProEditExtra = (
  p: Record<string, unknown>
): number | undefined => {
  const images = asObject(p.input)?.image_urls;
  if (!Array.isArray(images) || images.length === 0) return undefined;
  if (images.some((image) => typeof image !== "string")) return undefined;
  return Math.max(0, images.length - 1) * 0.0025;
};

// kie's `image_size` presets are the same named tokens fal uses for the same
// upstream models. kie's market pages publish the token list without pixel
// dimensions, so the dimensions come from fal's documented values for those
// presets (pricing/fal.ts PRESET_DIMENSIONS) — kept byte-identical so the two
// providers cannot drift apart on the same model's area.
const IMAGE_SIZE_DIMENSIONS: Record<string, readonly [number, number]> = {
  square: [512, 512],
  square_hd: [1024, 1024],
  portrait_4_3: [768, 1024],
  portrait_16_9: [576, 1024],
  landscape_4_3: [1024, 768],
  landscape_16_9: [1024, 576],
};

// Billable megapixels for the whole request: each image is rounded UP to the
// next whole megapixel, then multiplied by the image count. kie publishes a
// per-megapixel rate without documenting its rounding, so this follows the
// fal rule for the same area-billed models.
//
// `defaultPreset` is the model's documented schema default and is applied only
// when `input.image_size` is absent. A model with no documented default — and
// a preset that is present but unrecognized — yields undefined units, so the
// estimate fails with a derivation warning instead of guessing an area.
const megapixels = (
  p: Record<string, unknown>,
  defaultPreset?: string
): number | undefined => {
  const preset = asString(asObject(p.input)?.image_size) ?? defaultPreset;
  const dims = preset ? IMAGE_SIZE_DIMENSIONS[preset] : undefined;
  if (!dims) return undefined;
  return Math.ceil((dims[0] * dims[1]) / 1_000_000) * imageCount(p);
};

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

// flatGen / flatImage for the non-createTask endpoints, whose evidence is a
// product page rather than a /market/ slug. The image variant fixes units at 1
// because these flat payloads carry no batch field (no `input.n` to read).
const flatGenPage = (perUnit: number, url: string): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [],
  rates: { "": perUnit },
  source: pricePage(url),
});

const flatImagePage = (perUnit: number, url: string): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: () => 1,
  select: [],
  rates: { "": perUnit },
  source: pricePage(url),
});

// flatImage for the createTask families whose evidence is a kie.ai pricing
// page URL rather than a bare /market/<slug> path. Unlike flatImagePage above,
// units run through imageCount, so the families that do declare a batch field
// (ideogram remix / character*) scale with it.
const flatImagePricePage = (perUnit: number, url: string): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [],
  rates: { "": perUnit },
  source: pricePage(url),
});

// Per-image entry tiered by ONE nested `input` field — the createTask image
// families each publish a single price axis (quality, resolution or
// rendering_speed) and the rate keys mirror that field's values verbatim.
//
// `defaultValue` is applied only where upstream documents a default for the
// field. Where it does not, an omitted field selects no rate and the estimate
// fails rather than guessing a tier.
const tieredImagePage = (
  field: string,
  rates: Record<string, number>,
  url: string,
  defaultValue?: string,
  asOf = "2026-08-06",
  extra?: (
    payload: Record<string, unknown>,
    hints?: CostHints
  ) => number | undefined
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [
    {
      name: field,
      pick: (p) => asString(asObject(p.input)?.[field]) ?? defaultValue,
      ...(defaultValue === undefined ? { required: true } : {}),
    },
  ],
  rates,
  ...(extra ? { extra } : {}),
  source: pricePage(url, asOf),
});

// Area-billed image entry: kie prices the Qwen Image family per megapixel of
// output rather than per image.
const perMegapixel = (
  perUnit: number,
  url: string,
  defaultPreset?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "megapixels",
  units: (p) => megapixels(p, defaultPreset),
  select: [],
  rates: { "": perUnit },
  source: pricePage(url),
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
      ...(defaultResolution === undefined ? { required: true } : {}),
    },
  ],
  rates,
  source: src(slug),
});

const happyHorse11Video = (variant: string): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [
    {
      name: "resolution",
      pick: (p) => asString(asObject(p.input)?.resolution) ?? "1080p",
    },
  ],
  rates: { "720p": 0.1125, "1080p": 0.145 },
  source: pricePage(
    `https://kie.ai/happyhorse-1-1?model=happyhorse-1-1%2F${variant}`
  ),
});

// Veo 3.1 bills PER VIDEO, not per second: kie's page prices each
// (tier × resolution) cell as a single flat "per video" charge, so `duration`
// (4|6|8) does not scale the price at all.
//
// BEHAVIOR CHANGE (was flatVideo: $0.30/s for veo3, $0.10/s for veo3_fast).
// The unit is now `generations` with `units` fixed at 1, which retires the
// whole per-second flow for veo — including the costHints.durationSeconds
// channel these two entries used to *require*, because the veo schema has no
// duration-derived billing. A caller that still sends `duration` or the hint
// now gets the same per-video price instead of a multiple of it.
//
// Resolution is read from the FLAT payload: VeoGenerateRequestSchema declares
// `resolution` at the top level, not nested under `input`. The absent-field
// fallback is the documented upstream default 720p (docs.kie.ai
// veo3-api/generate-veo-3-video declares `resolution` default "720p"; verified
// 2026-08-06 alongside the pricing pull).
//
// Tier naming: the page family is "veo 3.1" with Quality / Fast / Lite
// columns, while the provider model ids stay veo3 / veo3_fast / veo3_lite —
// veo3 is the page's Quality column. These entries are model-keyed, so an
// omitted `payload.model` yields no pricing key at all and the estimate fails
// by engine rule; upstream's documented default model (`veo3_fast`) is
// recorded here but is never applied by the estimate.
const veoPerVideo = (rates: Record<string, number>): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [
    { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
  ],
  rates,
  source: pricePage("https://kie.ai/veo-3-1"),
});

// Rate-key form of a Kling market `input.duration`. Those schemas type the
// field as the STRING enum "5"|"10", so the key mirrors the wire value
// verbatim; scalarKey additionally tolerates the numeric spelling (5) a
// loosely-typed caller might send, which asString alone would drop.
//
// `defaultDuration` is applied only where upstream documents a default. The
// kling-2.6 pair passes none — `duration` is required there and no default is
// published, so an omitted field selects no rate and the estimate fails
// instead of guessing a tier.
const inputDurationKey = (
  p: Record<string, unknown>,
  defaultDuration?: string
): string | undefined =>
  scalarKey(asObject(p.input)?.duration) ?? defaultDuration;

// Per-video entry keyed by duration (Kling markets, Hailuo 02 standard): kie
// bills these families once per video, so `duration` selects a RATE instead of
// scaling one — units are fixed at 1 and the costHints.durationSeconds channel
// does not apply (same shape as veo).
const perVideoByDuration = (
  rates: Record<string, number>,
  url: string,
  defaultDuration?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [
    {
      name: "duration",
      pick: (p) => inputDurationKey(p, defaultDuration),
      ...(defaultDuration === undefined ? { required: true } : {}),
    },
  ],
  rates,
  source: pricePage(url),
});

// Per-video entry keyed by duration × resolution (Hailuo 02 image-to-video
// standard, both Hailuo 2.3 models, and the wan 2.5 pair). Same per-video basis
// as `perVideoByDuration`; the second axis exists because kie prices those
// cells separately. Only cells the page actually publishes get a rate, so an
// unpublished combination (2.3 at 10s/1080P, which upstream documents as
// unsupported) finds no rate and fails the estimate rather than being invented
// here.
//
// Each default is applied only where upstream documents one — same rule as
// `perVideoByDuration`. The Hailuo entries pass both, so an omitted field
// prices the documented row; the wan 2.5 pair passes neither, so an omitted
// field selects no rate and the estimate fails instead of guessing a cell.
const perVideoByDurationAndResolution = (
  rates: Record<string, number>,
  url: string,
  defaultDuration?: string,
  defaultResolution?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [
    {
      name: "duration",
      pick: (p) => inputDurationKey(p, defaultDuration),
      ...(defaultDuration === undefined ? { required: true } : {}),
    },
    {
      name: "resolution",
      pick: (p) => inputResolution(p) ?? defaultResolution,
      ...(defaultResolution === undefined ? { required: true } : {}),
    },
  ],
  rates,
  source: pricePage(url),
});

// Per-video entry keyed by resolution alone (the wan 2.2 A14B turbo pair). Same
// per-video basis as the two helpers above, minus the duration axis: kie bills
// these off one fixed ~5s clip and the schemas declare no duration field at
// all, so there is nothing for a second selector to read and the
// costHints.durationSeconds channel does not apply.
const perVideoByResolution = (
  rates: Record<string, number>,
  url: string,
  defaultResolution?: string
): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [
    {
      name: "resolution",
      pick: (p) => inputResolution(p) ?? defaultResolution,
      ...(defaultResolution === undefined ? { required: true } : {}),
    },
  ],
  rates,
  source: pricePage(url),
});

// Kling 2.6 text/image-to-video: 4 per-video rates, duration × sound. The
// sound selector follows the kling-3.0 pattern (a "sound" segment appended to
// the key when the toggle is on), minus its multi_shots clause — the 2.6
// schemas have no multi_shots field.
const kling26Video = (url: string): ModelPricing => ({
  kind: "perUnit",
  unit: "generations",
  units: () => 1,
  select: [
    { name: "duration", pick: (p) => inputDurationKey(p), required: true },
    {
      name: "sound",
      pick: (p) => {
        const sound = asObject(p.input)?.sound;
        return sound === true
          ? "sound"
          : sound === false
            ? "silent"
            : undefined;
      },
      required: true,
    },
  ],
  rates: {
    "5|silent": 0.275,
    "10|silent": 0.55,
    "5|sound": 0.55,
    "10|sound": 1.1,
  },
  source: pricePage(url),
});

// Per-second video entry tiered by ONE nested `input` field, sourced from a
// kie pricing page URL rather than a /market/ slug. `defaultValue` mirrors the
// model's documented schema default and is applied only when the field is
// absent.
const tieredVideoPage = (
  field: string,
  rates: Record<string, number>,
  url: string,
  defaultValue?: string,
  asOf = "2026-08-06",
  units: (
    payload: Record<string, unknown>,
    hints?: CostHints
  ) => number | undefined = seconds
): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units,
  select: [
    {
      name: field,
      pick: (p) => asString(asObject(p.input)?.[field]) ?? defaultValue,
      ...(defaultValue === undefined ? { required: true } : {}),
    },
  ],
  rates,
  source: pricePage(url, asOf),
});

// Flat per-second video rate for the families whose evidence is a kie pricing
// page URL rather than a /market/ slug.
const flatVideoPage = (perUnit: number, url: string): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [],
  rates: { "": perUnit },
  source: pricePage(url),
});

// kie resells ElevenLabs TTS through createTask and publishes those rates per
// 1000 characters; the table stores the per-CHARACTER rate (page USD / 1000)
// so units stay the raw character count, exactly like the elevenlabs provider
// entries. The text lives under the createTask `input` envelope here, not at
// the payload root.
const inputCharacters = (p: Record<string, unknown>): number | undefined => {
  const text = asString(asObject(p.input)?.text);
  return text ? text.length : undefined;
};

// text-to-dialogue bills the whole conversation: every turn's `text` summed.
// A malformed turn (no string `text`) stops the derivation rather than
// silently under-billing the rest — the same present-but-uncoercible rule the
// `seconds` helper applies to durations.
const dialogueCharacters = (p: Record<string, unknown>): number | undefined => {
  const dialogue = asObject(p.input)?.dialogue;
  if (!Array.isArray(dialogue)) return undefined;
  let total = 0;
  for (const turn of dialogue) {
    const text = asString(asObject(turn)?.text);
    if (text === undefined) return undefined;
    total += text.length;
  }
  return total > 0 ? total : undefined;
};

const perCharacterPage = (
  perUnit: number,
  url: string,
  units: (p: Record<string, unknown>) => number | undefined = inputCharacters,
  asOf = "2026-08-06"
): ModelPricing => ({
  kind: "perUnit",
  unit: "characters",
  units,
  select: [],
  rates: { "": perUnit },
  source: pricePage(url, asOf),
});

// MiniMax H3 (Hailuo 03): 2 tiers by resolution. The fresh 2026-08-11 pull
// lists 16 credits/s ($0.08) at 768P and 26 credits/s ($0.13) at 2K.
// Documented upstream default is 2K when input.resolution is omitted. Duration
// is a required wire field (int 4–15), so no costHints channel is needed.
//
// The page separately charges $0.04 per input image. The callable image and
// reference-image fields expose finite counts, so that additive charge is
// exact. Reference-video input carries no clip duration in the request, so
// those payloads fail closed rather than quoting a generation-only rate.
const miniMaxH3Extra = (p: Record<string, unknown>): number | undefined => {
  const input = asObject(p.input);
  const videos = input?.reference_video_urls;
  if (videos !== undefined) {
    if (!Array.isArray(videos)) return undefined;
    if (videos.length > 0) return undefined;
  }

  let imageCount = 0;
  const referenceImages = input?.reference_image_urls;
  if (referenceImages !== undefined) {
    if (!Array.isArray(referenceImages)) return undefined;
    if (referenceImages.some((image) => typeof image !== "string")) {
      return undefined;
    }
    imageCount += referenceImages.length;
  }

  for (const field of ["first_frame_url", "last_frame_url"]) {
    const image = input?.[field];
    if (image === undefined) continue;
    if (typeof image !== "string") return undefined;
    imageCount += 1;
  }

  return imageCount * 0.04;
};

const miniMaxH3Warning = (p: Record<string, unknown>): string[] => {
  const videos = asObject(p.input)?.reference_video_urls;
  if (Array.isArray(videos) && videos.length > 0) {
    return [
      "kie MiniMax H3: reference_video_urls carry no clip duration in the " +
        "request, so the estimate fails closed instead of quoting a " +
        "generation-only rate",
    ];
  }
  return [];
};

const miniMaxH3Video = (url: string): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [
    {
      name: "resolution",
      pick: (p) => asString(asObject(p.input)?.resolution) ?? "2K",
    },
  ],
  rates: { "768P": 0.08, "2K": 0.13 },
  extra: miniMaxH3Extra,
  warn: miniMaxH3Warning,
  source: pricePage(url, "2026-08-11"),
});

export const kie: Record<string, ModelPricing> = {
  // veo3 = the page's Quality tier. Both 4K rows print $1.85 while their
  // credit cells disagree (text-to-video 380 credits, image-to-video 370);
  // the published USD is identical either way, so one rate is correct here
  // and the credit-row discrepancy is upstream's, not a derivation choice.
  veo3: veoPerVideo({ "720p": 1.25, "1080p": 1.275, "4k": 1.85 }),
  // veo3_fast = the page's Fast tier. Its 1080p USD cell is malformed on the
  // page ("0,325"), so the credit cell is authoritative: the family bills
  // $0.005/credit (720p = 60 credits = $0.30), and 65 × $0.005 = $0.325.
  veo3_fast: veoPerVideo({ "720p": 0.3, "1080p": 0.325, "4k": 0.9 }),
  // veo3_lite = the page's Lite tier — previously unpriced, so a veo3_lite
  // request failed the estimate instead of quoting the published rate.
  veo3_lite: veoPerVideo({ "720p": 0.15, "1080p": 0.175, "4k": 0.75 }),

  // Veo auxiliaries — keyed by ENDPOINT, not by payload.model: the caller
  // passes the synthetic key as EstimateRequest.endpoint ("veo/extend",
  // "veo/get-1080p-video", "veo/get-4k-video"), exactly the convention the
  // suno rows below use, and the upstream payload stays untouched.
  //
  // veo/extend prices per video by the extend request's own top-level `model`
  // tier, defaulting to the documented upstream default "fast"
  // (docs.kie.ai/veo3-api/extend-video).
  // GAP: the page also publishes an Extend Lite row at $0.15 and the live
  // docs now enumerate `lite` for this field, but VeoExtendRequestSchema is
  // `z.enum(["fast", "quality"])` — it has no lite value. Schema changes are
  // out of scope here, so the Lite rate is recorded in this comment rather
  // than added as an unreachable rate key; it belongs with the enum addition.
  "veo/extend": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [{ name: "model", pick: (p) => asString(p.model) ?? "fast" }],
    rates: { quality: 1.25, fast: 0.3 },
    source: pricePage("https://kie.ai/veo-3-1?model=veo%2Fextend"),
  },

  // Resolution upgrades, billed once per video on top of the original
  // generation. Neither request carries a tier selector (taskId + index only),
  // so both are flat.
  "veo/get-1080p-video": flatGenPage(
    0.025,
    "https://kie.ai/veo-3-1?model=veo%2Fget-1080p-video"
  ),
  "veo/get-4k-video": flatGenPage(
    0.6,
    "https://docs.kie.ai/veo3-api/get-veo-3-4k-video"
  ),

  // Kling 3.0 video: 6 rates, mode × sound. mode ∈ {"std","pro","4K"}.
  // 4K rate is the same with or without sound.
  "kling-3.0/video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "mode", pick: inputMode, required: true },
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
    select: [{ name: "mode", pick: inputMode, required: true }],
    rates: { "720p": 0.1, "1080p": 0.135 },
    source: src("kwaivgi/kling-3.0"),
  },

  // Kling O3 / Kling 3.0 Omni: all four tasks bill per output second. Text
  // and image input share the resolution × native-audio ladder. Reference
  // input adds a distinct video-input tier, while transformation always uses
  // that video-input ladder. The schemas document 720p as the unconditional
  // resolution default, so raw cost payloads use the same fallback.
  "kling-3.0-omni/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: (p) => inputResolution(p) ?? "720p" },
      {
        name: "audio",
        pick: (p) => (asObject(p.input)?.audio === true ? "audio" : undefined),
      },
    ],
    rates: {
      "720p": 0.07,
      "720p|audio": 0.09,
      "1080p": 0.09,
      "1080p|audio": 0.115,
      "4k": 0.335,
      "4k|audio": 0.335,
    },
    source: pricePage(
      "https://kie.ai/kling-o3?model=kling-3.0-omni%2Ftext-to-video",
      "2026-08-20"
    ),
  },
  "kling-3.0-omni/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: (p) => inputResolution(p) ?? "720p" },
      {
        name: "audio",
        pick: (p) => (asObject(p.input)?.audio === true ? "audio" : undefined),
      },
    ],
    rates: {
      "720p": 0.07,
      "720p|audio": 0.09,
      "1080p": 0.09,
      "1080p|audio": 0.115,
      "4k": 0.335,
      "4k|audio": 0.335,
    },
    source: pricePage(
      "https://kie.ai/kling-o3?model=kling-3.0-omni%2Fimage-to-video",
      "2026-08-20"
    ),
  },
  "kling-3.0-omni/reference-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: (p) => inputResolution(p) ?? "720p" },
      {
        name: "mode",
        pick: (p) => {
          const input = asObject(p.input);
          const videoUrls = input?.video_urls;
          if (Array.isArray(videoUrls) && videoUrls.length > 0) return "video";
          return input?.audio === true ? "audio" : undefined;
        },
      },
    ],
    rates: {
      "720p": 0.07,
      "720p|audio": 0.09,
      "720p|video": 0.1,
      "1080p": 0.09,
      "1080p|audio": 0.115,
      "1080p|video": 0.135,
      "4k": 0.335,
      "4k|audio": 0.335,
      "4k|video": 0.335,
    },
    source: pricePage(
      "https://kie.ai/kling-o3?model=kling-3.0-omni%2Freference-to-video",
      "2026-08-20"
    ),
  },
  "kling-3.0-omni/transformation": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [{ name: "resolution", pick: (p) => inputResolution(p) ?? "720p" }],
    rates: { "720p": 0.1, "1080p": 0.135, "4k": 0.335 },
    source: pricePage(
      "https://kie.ai/kling-o3?model=kling-3.0-omni%2Ftransformation",
      "2026-08-20"
    ),
  },

  // Kling 3.0 Turbo: 2 tiers by resolution. Rates verified 2026-06-21 from
  // KIE's pricing page: 720p = 18 credits/s ($0.09), 1080p = 22.5 credits/s
  // ($0.1125).
  "kling/v3-turbo-image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [{ name: "resolution", pick: inputResolution, required: true }],
    rates: { "720p": 0.09, "1080p": 0.1125 },
    source: page("https://kie.ai/kling-3-0-turbo"),
  },
  "kling/v3-turbo-text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [{ name: "resolution", pick: (p) => inputResolution(p) ?? "720p" }],
    rates: { "720p": 0.09, "1080p": 0.1125 },
    source: page("https://kie.ai/kling-3-0-turbo"),
  },

  // wan/2.2 A14B Turbo text/image-to-video — per VIDEO, not per second. kie
  // bills one fixed ~5s clip and neither schema declares a duration field, so
  // resolution is the only axis: 480p 40 credits ($0.20), 720p 80 credits
  // ($0.40). 720p is both the documented and the schema default, so an omitted
  // resolution prices the 720p row.
  //
  // kie also publishes a 580p cell for both directions (60 credits, $0.30) and
  // it is deliberately absent here: the docs fragments enumerate `resolution`
  // as 480p|720p only — mirrored by `Wan22A14bTurboResolutionSchema` — so no
  // request this package can build reaches that row. Add the cell if upstream
  // ever widens the enum.
  "wan/2-2-a14b-text-to-video-turbo": perVideoByResolution(
    { "480p": 0.2, "720p": 0.4 },
    "https://kie.ai/wan/v2-2?model=wan%2F2-2-a14b-text-to-video-turbo",
    "720p"
  ),
  "wan/2-2-a14b-image-to-video-turbo": perVideoByResolution(
    { "480p": 0.2, "720p": 0.4 },
    "https://kie.ai/wan/v2-2?model=wan%2F2-2-a14b-image-to-video-turbo",
    "720p"
  ),

  // wan/2.2 A14B Turbo speech-to-video — per SECOND by resolution: 12 / 18 / 24
  // credits ($0.06 / $0.09 / $0.12). All three cells are reachable
  // (`Wan22ExtendedResolutionSchema`), and the default pick mirrors the
  // schema's "480p".
  //
  // The schema's output length is exact from num_frames / frames_per_second,
  // including the documented 80/16 defaults and non-default combinations.
  "wan/2-2-a14b-speech-to-video-turbo": tieredVideoPage(
    "resolution",
    { "480p": 0.06, "580p": 0.09, "720p": 0.12 },
    "https://kie.ai/wan-speech-to-video-turbo",
    "480p",
    "2026-08-11",
    wanSpeechSeconds
  ),

  // wan/2.2 Animate move/replace — per SECOND by resolution: 6 / 9.5 / 12.5
  // credits ($0.03 / $0.0475 / $0.0625). Both ops share one page and one rate
  // card. Neither schema has a duration field (the output inherits the driving
  // video's length), so seconds arrive through costHints.durationSeconds.
  "wan/2-2-animate-move": tieredVideoPage(
    "resolution",
    { "480p": 0.03, "580p": 0.0475, "720p": 0.0625 },
    "https://kie.ai/wan-animate",
    "480p",
    "2026-08-11"
  ),
  "wan/2-2-animate-replace": tieredVideoPage(
    "resolution",
    { "480p": 0.03, "580p": 0.0475, "720p": 0.0625 },
    "https://kie.ai/wan-animate",
    "480p",
    "2026-08-11"
  ),

  // wan/2.5 text/image-to-video — per VIDEO by duration × resolution, with all
  // four cells published: 5s/720p $0.30, 5s/1080p $0.50, 10s/720p $0.60,
  // 10s/1080p $1.00.
  //
  // Neither axis takes a fallback. `duration` is a required "5"|"10" string
  // enum with no documented default, and the docs fragments give `resolution`
  // an enum plus an *example* of 1080p but no `default:` key. An omitted field
  // therefore selects no rate and fails loudly rather than quoting a tier
  // upstream never named — the kling-2.6 / grok-imagine precedent.
  "wan/2-5-text-to-video": perVideoByDurationAndResolution(
    { "5|720p": 0.3, "5|1080p": 0.5, "10|720p": 0.6, "10|1080p": 1 },
    "https://kie.ai/wan-2-5?model=wan%2F2-5-text-to-video"
  ),
  "wan/2-5-image-to-video": perVideoByDurationAndResolution(
    { "5|720p": 0.3, "5|1080p": 0.5, "10|720p": 0.6, "10|1080p": 1 },
    "https://kie.ai/wan-2-5?model=wan%2F2-5-image-to-video"
  ),

  // wan/2.6 standard trio — per VIDEO by duration × resolution. 1080p is not a
  // fixed multiple of 720p (5s is 1.493x, 15s is 1.5x), so the tiered
  // per-second helper cannot express this family: every cell is listed.
  //   5s  $0.35 / $0.5225      10s $0.70 / $1.0475      15s $1.05 / $1.575
  //
  // Two asymmetries against the wan 2.5 pair directly above:
  //
  //  - Both axes take a fallback here. All five wan 2.6 schemas document
  //    `duration` default "5" and `resolution` default "1080p", so an omitted
  //    field prices the documented 5s/1080p row instead of failing. The 2.5
  //    pair documents neither default, which is why it passes none.
  //  - video-to-video stops at 10s. Its Wan26VideoDurationSchema is "5"|"10"
  //    while the text- and image-input siblings take "5"|"10"|"15", so it gets
  //    four cells, not six. The kie page prints 15s rows across the family, but
  //    pricing a duration this model's own guard rejects would quote a video
  //    that cannot be ordered.
  //
  // The two wan/2-6-flash-* ids are deliberately absent: kie publishes no flash
  // rate on any surface, so they stay unpriced and fail safe into the
  // prohibitive tier rather than borrowing the standard rate (mayor ruling R2,
  // 2026-08-07; same discipline as pixverse-v6/*). R2 confirmed this table on
  // 2026-08-07, one day after the shared pricePage stamp, so each entry carries
  // its own asOf.
  "wan/2-6-text-to-video": {
    ...perVideoByDurationAndResolution(
      {
        "5|720p": 0.35,
        "5|1080p": 0.5225,
        "10|720p": 0.7,
        "10|1080p": 1.0475,
        "15|720p": 1.05,
        "15|1080p": 1.575,
      },
      "https://kie.ai/wan-2-6?model=wan%2F2-6-text-to-video",
      "5",
      "1080p"
    ),
    source: {
      ...page("https://kie.ai/wan-2-6?model=wan%2F2-6-text-to-video"),
      asOf: "2026-08-07",
    },
  },
  "wan/2-6-image-to-video": {
    ...perVideoByDurationAndResolution(
      {
        "5|720p": 0.35,
        "5|1080p": 0.5225,
        "10|720p": 0.7,
        "10|1080p": 1.0475,
        "15|720p": 1.05,
        "15|1080p": 1.575,
      },
      "https://kie.ai/wan-2-6?model=wan%2F2-6-image-to-video",
      "5",
      "1080p"
    ),
    source: {
      ...page("https://kie.ai/wan-2-6?model=wan%2F2-6-image-to-video"),
      asOf: "2026-08-07",
    },
  },
  "wan/2-6-video-to-video": {
    ...perVideoByDurationAndResolution(
      {
        "5|720p": 0.35,
        "5|1080p": 0.5225,
        "10|720p": 0.7,
        "10|1080p": 1.0475,
      },
      "https://kie.ai/wan-2-6?model=wan%2F2-6-video-to-video",
      "5",
      "1080p"
    ),
    source: {
      ...page("https://kie.ai/wan-2-6?model=wan%2F2-6-video-to-video"),
      asOf: "2026-08-07",
    },
  },

  // wan/2.7 video — resolution-tiered per second as of the 2026-08-06 pull
  // (was a flat $0.10/s across all four variants, which overcharged 720p by
  // 25% and undercharged 1080p by 17%). All four variants share the same two
  // cells: 720p 16 credits/s ($0.08), 1080p 24 credits/s ($0.12). The schemas
  // declare `resolution` as "720p"|"1080p" and document 1080p as the default,
  // so an omitted field prices the 1080p row.
  "wan/2-7-text-to-video": tieredVideoPage(
    "resolution",
    { "720p": 0.08, "1080p": 0.12 },
    "https://kie.ai/wan-2-7-video?model=wan%2F2-7-text-to-video",
    "1080p"
  ),
  "wan/2-7-image-to-video": tieredVideoPage(
    "resolution",
    { "720p": 0.08, "1080p": 0.12 },
    "https://kie.ai/wan-2-7-video?model=wan%2F2-7-image-to-video",
    "1080p"
  ),
  "wan/2-7-r2v": tieredVideoPage(
    "resolution",
    { "720p": 0.08, "1080p": 0.12 },
    "https://kie.ai/wan-2-7-video?model=wan%2F2-7-r2v",
    "1080p"
  ),
  "wan/2-7-videoedit": tieredVideoPage(
    "resolution",
    { "720p": 0.08, "1080p": 0.12 },
    "https://kie.ai/wan-2-7-video?model=wan%2F2-7-videoedit",
    "1080p"
  ),

  // grok-imagine: 3 tiers by resolution as of the 2026-08-06 pull (1080p is
  // new; 480p and 720p both rose). Audio is always on (no toggle in the kie
  // input schema). The 1080p cell is DERIVED from credits: both directions
  // bill 8 credits/s, and while text-to-video prints $0.04, the
  // image-to-video row prints a malformed "$0.004" — 8 × $0.005 = $0.04 is
  // the page's own uniform basis, so both directions carry it.
  //
  // The schemas document 480p as the default resolution but declare no schema
  // default, and these two entries have never applied one: an omitted
  // resolution still finds no rate and fails loudly rather than quoting the
  // cheapest tier.
  "grok-imagine/text-to-video": tieredVideoPage(
    "resolution",
    { "480p": 0.012, "720p": 0.0225, "1080p": 0.04 },
    "https://kie.ai/grok-imagine?model=grok-imagine%2Ftext-to-video"
  ),
  "grok-imagine/image-to-video": tieredVideoPage(
    "resolution",
    { "480p": 0.012, "720p": 0.0225, "1080p": 0.04 },
    "https://kie.ai/grok-imagine?model=grok-imagine%2Fimage-to-video"
  ),

  // grok-imagine-video-1-5-preview: image-to-video, 2 tiers by resolution —
  // the page publishes no 1080p row for this preview model, and its schema
  // stops at "480p"|"720p". Defaults to 480p (matches the documented model
  // default) when the payload omits input.resolution.
  "grok-imagine-video-1-5-preview": tieredVideoPage(
    "resolution",
    { "480p": 0.012, "720p": 0.0225 },
    "https://kie.ai/grok-imagine-video-1.5",
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

  // grok-imagine-image-2-0: the WI-4 lifecycle recording's terminal
  // recordInfo responses report 4.0 credits for text-to-image and image-edit,
  // matching the published 4 credits = $0.02/image rate. Text-to-image
  // returned exactly one result URL, so both calls are flat per generation.
  "grok-imagine-image-2-0/text-to-image": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.02 },
    source: pricePage(
      "https://docs.kie.ai/market/grok-imagine-image-2-0/text-to-image",
      "2026-08-16"
    ),
  },
  // tests/recordings/kie_2079838932/grok-imagine-image-2-lifecycle_1692809741/
  // recording.har reports creditsConsumed: 0.0 for the successful segment-map
  // task. This is an evidenced free operation, not a fail-closed sentinel.
  "grok-imagine-image-2-0/segment-map": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0 },
    source: pricePage(
      "https://docs.kie.ai/market/grok-imagine-image-2-0/segment-map",
      "2026-08-16"
    ),
  },
  "grok-imagine-image-2-0/image-edit": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [],
    rates: { "": 0.02 },
    source: pricePage(
      "https://docs.kie.ai/market/grok-imagine-image-2-0/image-edit",
      "2026-08-16"
    ),
  },

  // grok-imagine/extend: flat per-generation, 4 rates indexed by
  // (extend_times, resolution). The evidenced request contract keeps
  // extend_times as the exact strings "6" and "10"; numeric values do not
  // select a tier. Resolution is inherited from the source video, so callers
  // pass top-level `resolution` as pricing-only metadata. Resolution is not
  // part of CostHints yet, so this legacy side field remains distinct from the
  // durationSeconds hint channel.
  "grok-imagine/extend": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "extend_times",
        pick: (p) => asString(asObject(p.input)?.extend_times),
        required: true,
      },
      {
        name: "resolution",
        pick: (p) =>
          asString(asObject(p.input)?.resolution) ?? asString(p.resolution),
        required: true,
      },
    ],
    rates: {
      "6|480p": 0.072,
      "6|720p": 0.135,
      "10|480p": 0.12,
      "10|720p": 0.225,
    },
    source: pricePage(
      "https://kie.ai/grok-imagine?model=grok-imagine%2Fextend"
    ),
  },

  // grok-imagine/upscale: the schema carries only `task_id`, so no tier is
  // selectable from a request. Kie publishes 360p→720p at $0.05,
  // 720P→1080P at $0.10, and 480P→1080P at $0.15; all depend on source and
  // target resolutions of the referenced task. Fail closed because no
  // nonzero tier is exact from this payload.
  "grok-imagine/upscale": {
    kind: "perUnit",
    unit: "generations",
    units: () => undefined,
    select: [],
    rates: { "": 0 },
    warn: () => [
      "kie 'grok-imagine/upscale': source/target resolutions are not present " +
        "in the task_id-only request, so the estimate fails closed rather " +
        "than selecting among the published 360p→720p ($0.05), " +
        "720P→1080P ($0.10), and 480P→1080P ($0.15) tiers",
    ],
    source: pricePage(
      "https://kie.ai/grok-imagine?model=grok-imagine%2Fupscale"
    ),
  },

  // happyhorse (1.0): 2 tiers by resolution. Audio always on for t2v/i2v/r2v.
  // The 2026-08-06 pull cut both cells: 28 credits/s ($0.14) at 720p and
  // 48 credits/s ($0.24) at 1080p (was $0.155 / $0.265, i.e. the old table
  // over-quoted every happyhorse call by ~10%).
  "happyhorse/text-to-video": tieredVideoPage(
    "resolution",
    { "720p": 0.14, "1080p": 0.24 },
    "https://kie.ai/happyhorse-1-0?model=happyhorse%2Ftext-to-video"
  ),
  "happyhorse/image-to-video": tieredVideoPage(
    "resolution",
    { "720p": 0.14, "1080p": 0.24 },
    "https://kie.ai/happyhorse-1-0?model=happyhorse%2Fimage-to-video"
  ),
  "happyhorse/reference-to-video": tieredVideoPage(
    "resolution",
    { "720p": 0.14, "1080p": 0.24 },
    "https://kie.ai/happyhorse-1-0?model=happyhorse%2Freference-to-video"
  ),
  // happyhorse/video-edit: same tiered rates as the other happyhorse video
  // entries. Schema has no duration field — output duration matches the
  // source video_url, so callers must declare that length as
  // costHints.durationSeconds.
  "happyhorse/video-edit": tieredVideoPage(
    "resolution",
    { "720p": 0.14, "1080p": 0.24 },
    "https://kie.ai/happyhorse-1-0?model=happyhorse%2Fvideo-edit"
  ),

  // happyhorse-1-1: 2 tiers by resolution. The 2026-08-06 pull lists
  // 22.5 credits/s ($0.1125) at 720p and 29 credits/s ($0.145) at 1080p
  // (was 33 / 44 credits, $0.165 / $0.22). High-tier +10% bonus credit
  // top-ups lower the effective credit price by about 10%, but this table
  // stores list USD rates only.
  "happyhorse-1-1/text-to-video": happyHorse11Video("text-to-video"),
  "happyhorse-1-1/image-to-video": happyHorse11Video("image-to-video"),
  "happyhorse-1-1/reference-to-video": happyHorse11Video("reference-to-video"),

  // minimax-h3: 2 tiers by resolution. The fresh 2026-08-11 pull lists
  // 16 credits/s ($0.08) at 768P and 26 credits/s ($0.13) at 2K.
  // Documented upstream default remains 2K.
  "minimax-h3/text-to-video": miniMaxH3Video(
    "https://kie.ai/minimax-h3?model=minimax-h3%2Ftext-to-video"
  ),
  "minimax-h3/image-to-video": miniMaxH3Video(
    "https://kie.ai/minimax-h3?model=minimax-h3%2Fimage-to-video"
  ),
  "minimax-h3/reference-to-video": miniMaxH3Video(
    "https://kie.ai/minimax-h3?model=minimax-h3%2Freference-to-video"
  ),

  // ---------------------------------------------------------------------
  // Hailuo 02 and Hailuo 2.3 (MiniMax) — the two families the provider
  // exposes that had no pricing at all before the 2026-08-06 pull. Both bill
  // PER VIDEO: kie prices each published (tier × duration × resolution) cell
  // as one flat charge, so `duration` is a rate dimension and never a unit
  // count. Every USD cell below is the page's own and agrees with its credit
  // cell at the uniform 1 credit = $0.005 basis (Pro 6s/1080p: 57 credits =
  // $0.285), so no rate here is derived.
  //
  // Only published cells get keys. Hailuo 2.3 publishes no 10s/1080P row —
  // upstream documents 10s as unsupported at that resolution — so such a
  // request finds no rate and the estimate fails loudly instead of quoting an
  // invented tier.
  // ---------------------------------------------------------------------

  // Hailuo 02 Pro — the page publishes exactly one cell (1080p, 6s), and the
  // schemas carry neither a duration nor a resolution field, so the entry is
  // flat with nothing to select.
  "hailuo/02-text-to-video-pro": flatGenPage(
    0.285,
    "https://kie.ai/hailuo-api?model=hailuo%2F02-text-to-video-pro"
  ),
  "hailuo/02-image-to-video-pro": flatGenPage(
    0.285,
    "https://kie.ai/hailuo-api?model=hailuo%2F02-image-to-video-pro"
  ),

  // Hailuo 02 Standard text-to-video — 768p only (the schema has no resolution
  // field), duration "6"|"10" with documented default "6".
  "hailuo/02-text-to-video-standard": perVideoByDuration(
    { "6": 0.15, "10": 0.25 },
    "https://kie.ai/hailuo-api?model=hailuo%2F02-text-to-video-standard",
    "6"
  ),

  // Hailuo 02 Standard image-to-video — duration "6"|"10" (documented default
  // "10", unusually) × resolution "512P"|"768P" (default "768P"), so an
  // omitted-field request prices the 10s/768P row.
  //
  // The 2026-08-06 page publishes three of these four cells: 10s/768P $0.25,
  // 6s/512P $0.06 and 10s/512P $0.10. It carries no explicit 6s/768P row, but
  // REQ-002 prices that cell at the text-to-video Standard 6s/768P rate
  // (30 credits = $0.15) — the two Standard tiers share every cell the page
  // does print, so the gap reads as a missing row rather than a missing
  // capability.
  "hailuo/02-image-to-video-standard": perVideoByDurationAndResolution(
    {
      "6|768P": 0.15,
      "10|768P": 0.25,
      "6|512P": 0.06,
      "10|512P": 0.1,
    },
    "https://kie.ai/hailuo-api?model=hailuo%2F02-image-to-video-standard",
    "10",
    "768P"
  ),

  // Hailuo 2.3 image-to-video — duration "6"|"10" (default "6") × resolution
  // "768P"|"1080P" (default "768P"). No 10s/1080P cell in either tier.
  "hailuo/2-3-image-to-video-pro": perVideoByDurationAndResolution(
    { "6|768P": 0.225, "10|768P": 0.45, "6|1080P": 0.4 },
    "https://kie.ai/hailuo-2-3?model=hailuo%2F2-3-image-to-video-pro",
    "6",
    "768P"
  ),
  "hailuo/2-3-image-to-video-standard": perVideoByDurationAndResolution(
    { "6|768P": 0.15, "10|768P": 0.25, "6|1080P": 0.25 },
    "https://kie.ai/hailuo-2-3?model=hailuo%2F2-3-image-to-video-standard",
    "6",
    "768P"
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

  // bytedance/seedance-2: 8 rates, resolution × videoInput. The page's two
  // columns are "with video input" / "no video input", and this family's video
  // input is input.reference_video_urls — the same hasReferenceVideoInput the
  // mini entry below already selects on. first_frame_url is an IMAGE seed, so
  // an image-seeded generation bills in the "no video input" column. The
  // 2026-08-06 pull supplies the cells, including a 4K tier: 128 credits/s
  // ($0.64) with video input, 208 credits/s ($1.04) without.
  //
  // Billing evidence, which corrected an earlier reading of that discriminator:
  // tests/recordings/kie_2079838932/bytedance-seedance-2-4k_1424029474/recording.har
  // sends first_frame_url and NO reference_video_urls at resolution "4k",
  // duration 4, and its terminal recordInfo reports creditsConsumed 832.0 —
  // $4.16 at the family's 1 credit = $0.005 basis, exactly 4 s × $1.04, the
  // "no video input" 4K rate. This entry previously keyed the column off
  // first_frame_url and so priced that same payload at 4 s × $0.64 = $2.56, a
  // 38% underestimate flowing into the OTP pay-gate. The mini fixture agrees
  // from the other side: an image input with no reference video bills 38
  // credits for 4 s at 480p = 4 × $0.0475, mini's "no video input" rate.
  //
  // As of ac-8cfo6r the 4K tier is schema-reachable: the shipped
  // Seedance2InputSchema accepts resolution "4k" — lowercase, the spelling
  // upstream's request grammar actually takes. The uppercase "4K" from the
  // pricing page label is rejected on the wire ({"code":422,"msg":"Invalid
  // resolution"}, observed live 2026-08-06 under ac-8cfo6r WI-4 and not
  // retained as a committed fixture), so the rate keys below follow the
  // payload value, as veo3 and gemini-omni already do.
  // inputResolution reads input.resolution verbatim with no case folding, so
  // key and schema member must stay byte-identical. Two checks hold that:
  // the seedance-2 4k rows in scripts/compare-video-cost.mjs fail
  // `pnpm run lint:compare-payloads` if the SCHEMA member drifts (every lineup
  // row is parsed against the shipped schema), and the 4k pin in
  // tests/unit/cost-pricing.test.ts fails if EITHER side drifts (it parses,
  // then estimates the parsed payload, and rejects a "not found in pricing
  // table" warning). The lint never loads @apicity/cost, so it cannot see a
  // rate-key rename on its own.
  "bytedance/seedance-2": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: inputResolution, required: true },
      {
        name: "videoInput",
        pick: (p) => (hasReferenceVideoInput(p) ? "video" : "no-video"),
      },
    ],
    rates: {
      "480p|video": 0.0575,
      "480p|no-video": 0.095,
      "720p|video": 0.125,
      "720p|no-video": 0.205,
      "1080p|video": 0.31,
      "1080p|no-video": 0.51,
      "4k|video": 0.64,
      "4k|no-video": 1.04,
    },
    source: pricePage(
      "https://kie.ai/seedance-2-0?model=bytedance%2Fseedance-2"
    ),
  },

  // bytedance/seedance-2-fast: 4 rates (no 1080p tier). Same page, same column
  // semantics as seedance-2 above, so the same reference-video discriminator —
  // by analogy, since no creditsConsumed observation exists for this model.
  "bytedance/seedance-2-fast": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: (p) => inputResolution(p) ?? "720p" },
      {
        name: "videoInput",
        pick: (p) => (hasReferenceVideoInput(p) ? "video" : "no-video"),
      },
    ],
    rates: {
      "480p|video": 0.034,
      "480p|no-video": 0.059,
      "720p|video": 0.075,
      "720p|no-video": 0.124,
    },
    source: pricePage(
      "https://kie.ai/seedance-2-0?model=bytedance%2Fseedance-2-fast",
      "2026-08-11"
    ),
  },

  // bytedance/seedance-2-5: per second by resolution × audio. KIE's page
  // labels the audio axis "with video" / "no video"; the callable schema
  // exposes the same discriminator as generate_audio. Resolution defaults to
  // 720p and audio defaults on, so those defaults are applied only for omitted
  // fields. All six published cells are retained verbatim.
  "bytedance/seedance-2-5": {
    kind: "perUnit",
    unit: "seconds",
    units: seedance25Seconds,
    select: [
      {
        name: "resolution",
        pick: (p) => inputResolution(p) ?? "720p",
      },
      {
        name: "audio",
        pick: (p) => {
          const audio = asObject(p.input)?.generate_audio;
          return audio === undefined
            ? "audio"
            : audio === false
              ? "no-audio"
              : audio === true
                ? "audio"
                : undefined;
        },
      },
    ],
    rates: {
      "480p|audio": 0.085,
      "480p|no-audio": 0.14,
      "720p|audio": 0.19,
      "720p|no-audio": 0.315,
      "1080p|audio": 0.3425,
      "1080p|no-audio": 0.57,
    },
    source: pricePage("https://kie.ai/seedance-2-5", "2026-08-19"),
  },

  // bytedance/seedance-2-mini: 4 rates, resolution x reference video input.
  // Rates refreshed from the 2026-08-11 pull: 480p video input = 2.4
  // credits/s ($0.012), 480p no video input = 3.8 credits/s ($0.019),
  // 720p video input = 5 credits/s ($0.025), 720p no video input =
  // 8.2 credits/s ($0.041).
  "bytedance/seedance-2-mini": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: (p) => inputResolution(p) ?? "720p" },
      {
        name: "videoInput",
        pick: (p) => (hasReferenceVideoInput(p) ? "video" : "no-video"),
      },
    ],
    rates: {
      "480p|video": 0.012,
      "480p|no-video": 0.019,
      "720p|video": 0.025,
      "720p|no-video": 0.041,
    },
    source: pricePage("https://kie.ai/seedance-2-0-mini", "2026-08-11"),
  },

  // ---------------------------------------------------------------------
  // createTask video families from the 2026-08-06 pricing pull. All are
  // model-keyed (flat payload `model` + nested `input`), and every rate key
  // mirrors an `input` field's upstream value verbatim. Every USD cell below
  // is the page's own, and each agrees with its credit cell at the family's
  // uniform 1 credit = $0.005 basis (e.g. kling 2.6 5s silent: 55 credits =
  // $0.275), so no rate here is derived.
  //
  // Two shapes appear. The Kling per-VIDEO families bill once per generation,
  // so `duration` selects a rate and units are fixed at 1. The per-SECOND
  // families multiply their rate by the output length; where the schema has no
  // duration field (motion-control, ai-avatar, topaz video, infinitalk — the
  // length follows the driving audio/video), the caller must declare it as
  // costHints.durationSeconds, exactly like omnihuman-1-5 and the volcengine
  // lip-sync entry above.
  // ---------------------------------------------------------------------

  // Kling 2.6 — per video, 4 rates by duration × sound. `duration` ("5"|"10")
  // and `sound` are both REQUIRED by the 2.6 schemas and neither documents a
  // default, so there is no duration fallback: an omitted duration selects no
  // rate and the estimate fails rather than quoting the 5s tier.
  "kling-2.6/text-to-video": kling26Video(
    "https://kie.ai/kling-2-6?model=kling-2.6%2Ftext-to-video"
  ),
  "kling-2.6/image-to-video": kling26Video(
    "https://kie.ai/kling-2-6?model=kling-2.6%2Fimage-to-video"
  ),

  // Kling 2.6 motion-control — per second by `input.mode` ("720p"|"1080p",
  // lowercase in the schema even though the page prints 720P/1080P). The
  // schema has no duration field (the output follows the motion video), so
  // callers must declare that length as costHints.durationSeconds.
  "kling-2.6/motion-control": tieredVideoPage(
    "mode",
    { "720p": 0.055, "1080p": 0.09 },
    "https://kie.ai/kling-2.6-motion-control"
  ),

  // Kling AI Avatar — flat per second, one rate per tier (Standard 720p
  // $0.04, Pro 1080p $0.08). Neither schema carries a resolution knob: the
  // tier IS the model id, and the page's resolution column is fixed per tier.
  // No duration field either (length follows the driving audio, page-capped at
  // 15s), so the seconds come from costHints.durationSeconds.
  //
  // The page anchors name older model ids (kling/v1-avatar-standard,
  // kling/ai-avatar-v1-pro) than the createTask catalogue's
  // kling/ai-avatar-{standard,pro}; the keys here are the ids callers actually
  // put in `payload.model`, and the anchor URLs are kept as the rate evidence.
  "kling/ai-avatar-standard": flatVideoPage(
    0.04,
    "https://kie.ai/kling-ai-avatar?model=kling%2Fv1-avatar-standard"
  ),
  "kling/ai-avatar-pro": flatVideoPage(
    0.08,
    "https://kie.ai/kling-ai-avatar?model=kling%2Fai-avatar-v1-pro"
  ),

  // Kling 2.5 Turbo Pro — per video: 5s $0.21, 10s $0.42. `duration` is
  // optional in the schema and documents an upstream default of 5, applied as
  // the absent-field fallback.
  "kling/v2-5-turbo-text-to-video-pro": perVideoByDuration(
    { "5": 0.21, "10": 0.42 },
    "https://kie.ai/kling-2-5?model=kling%2Fv2-5-turbo-text-to-video-pro",
    "5"
  ),
  "kling/v2-5-turbo-image-to-video-pro": perVideoByDuration(
    { "5": 0.21, "10": 0.42 },
    "https://kie.ai/kling-2-5?model=kling%2Fv2-5-turbo-image-to-video-pro",
    "5"
  ),

  // Kling 2.1 — per video, three tiers on one page: Standard $0.125/$0.25,
  // Pro $0.25/$0.50, Master $0.80/$1.60 (5s/10s). Same optional `duration`
  // with a documented default of 5 as the 2.5 turbo pair above.
  "kling/v2-1-standard": perVideoByDuration(
    { "5": 0.125, "10": 0.25 },
    "https://kie.ai/kling/v2-1?model=kling%2Fv2-1-standard",
    "5"
  ),
  "kling/v2-1-pro": perVideoByDuration(
    { "5": 0.25, "10": 0.5 },
    "https://kie.ai/kling/v2-1?model=kling%2Fv2-1-pro",
    "5"
  ),
  "kling/v2-1-master-text-to-video": perVideoByDuration(
    { "5": 0.8, "10": 1.6 },
    "https://kie.ai/kling/v2-1?model=kling%2Fv2-1-master-text-to-video",
    "5"
  ),
  "kling/v2-1-master-image-to-video": perVideoByDuration(
    { "5": 0.8, "10": 1.6 },
    "https://kie.ai/kling/v2-1?model=kling%2Fv2-1-master-image-to-video",
    "5"
  ),

  // Seedance 1.5 Pro — per second, 6 rates by resolution × generate_audio.
  // Both selectors carry the schema's documented defaults (720p, audio off),
  // so a payload that omits them prices the page's documented no-audio 720p
  // row. `duration` is a required int (4-12), so no hint channel is needed.
  "bytedance/seedance-1.5-pro": {
    kind: "perUnit",
    unit: "seconds",
    units: seconds,
    select: [
      { name: "resolution", pick: (p) => inputResolution(p) ?? "720p" },
      {
        name: "generate_audio",
        pick: (p) =>
          asObject(p.input)?.generate_audio === true ? "audio" : undefined,
      },
    ],
    rates: {
      "480p": 0.00875,
      "480p|audio": 0.0175,
      "720p": 0.0175,
      "720p|audio": 0.035,
      "1080p": 0.0375,
      "1080p|audio": 0.075,
    },
    source: pricePage("https://kie.ai/seedance-1-5-pro"),
  },

  // Topaz Video Upscaler — per second by `input.upscale_factor`. Unlike the
  // image upscaler above, this page publishes the factors themselves (1x/2x
  // $0.04, 4x $0.07), so the schema's own knob keys the rates directly and no
  // floor-plus-warning fallback is needed. The documented default "2" is the
  // absent-field fallback. No duration field — the output matches the source
  // clip, so callers declare it as costHints.durationSeconds.
  "topaz/video-upscale": tieredVideoPage(
    "upscale_factor",
    { "1": 0.04, "2": 0.04, "4": 0.07 },
    "https://kie.ai/topaz-video-upscaler",
    "2"
  ),

  // InfiniTalk — per second by `input.resolution` ("480p" $0.015, "720p"
  // $0.06), with the schema's documented "480p" default as the absent-field
  // fallback. No duration field (length follows the driving audio, page-capped
  // at 15s) → costHints.durationSeconds, kling-avatar style.
  "infinitalk/from-audio": tieredVideoPage(
    "resolution",
    { "480p": 0.015, "720p": 0.06 },
    "https://kie.ai/infinitalk",
    "480p"
  ),

  // Runway — keyed by ENDPOINT ("runway/generate", "runway/extend"): these are
  // dedicated non-createTask endpoints whose flat payload carries no model id,
  // so the caller supplies the synthetic key as EstimateRequest.endpoint.
  //
  // runway/generate bills per video by duration × quality. Both fields are
  // REQUIRED by RunwayGenerateRequestSchema, so neither selector takes a
  // fallback: an omitted field fails the estimate rather than guessing a tier.
  // `duration` is a numeric literal union (5 | 10) on the wire, hence
  // scalarKey rather than asString. There is deliberately no "10|1080p" rate —
  // upstream documents the combo as unsupported ("If 10-second video is
  // selected, 1080p resolution cannot be used") and publishes no row for it,
  // so that request fails the estimate instead of quoting an invented price.
  "runway/generate": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      { name: "duration", pick: (p) => scalarKey(p.duration), required: true },
      { name: "quality", pick: (p) => asString(p.quality), required: true },
    ],
    rates: { "5|720p": 0.06, "10|720p": 0.15, "5|1080p": 0.15 },
    source: pricePage("https://kie.ai/runway-api"),
  },

  // runway/extend bills per video by quality alone — RunwayExtendRequestSchema
  // has no duration field, so there is nothing else to key on. The pricing
  // page publishes no separate Extend row, so these are the generate 5s rates
  // for each quality tier; revisit if upstream ever prints an Extend row.
  "runway/extend": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      { name: "quality", pick: (p) => asString(p.quality), required: true },
    ],
    rates: { "720p": 0.06, "1080p": 0.15 },
    source: pricePage("https://kie.ai/runway-api"),
  },

  // Runway Aleph (video-to-video) — endpoint-keyed "aleph/generate". One
  // published rate, 110 credits ($0.55) per video, and AlephGenerateRequest
  // exposes no tier field, so the entry is flat.
  "aleph/generate": flatGenPage(
    0.55,
    "https://docs.kie.ai/runway-api/generate-aleph-video"
  ),

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

  // ---------------------------------------------------------------------
  // createTask image families from the 2026-08-06 pricing pull. All are
  // model-keyed (flat payload `model` + nested `input`), and every rate key
  // mirrors an `input` field's upstream value verbatim.
  //
  // Absent-field fallbacks follow one rule throughout this block: apply the
  // documented upstream default where the model's own docs page publishes one,
  // and omit the fallback where it does not — an omitted field then selects no
  // rate and the estimate fails instead of quoting an invented tier. The
  // ideogram entries below are where that rule visibly splits a family.
  // ---------------------------------------------------------------------

  // Seedream 5 Pro — per image by `input.quality`. The page prices output
  // resolution (1K $0.035, 1.5K $0.035, 2K $0.07) while the schema's only tier
  // knob is quality; docs.kie.ai states "Basic outputs 1K images, while High
  // outputs 2K images", so basic → the $0.035 rows and high → the $0.07 row.
  // The 1.5K row collapses into `basic` at the same price, so no page row is
  // lost. Both live createTask schemas require `quality`; no helper default is
  // applied even though the docs list "basic" as a default.
  //
  // The image-to-image entry adds the exact finite input-image surcharge below
  // (0.5 credits = $0.0025 per image beyond the first, which is free).
  // The page's separate Layer Decomposition rows now have their own callable
  // pricing key below.
  "seedream/5-pro-text-to-image": tieredImagePage(
    "quality",
    { basic: 0.035, high: 0.07 },
    "https://kie.ai/seedream-5-0-pro?model=seedream%2F5-pro-text-to-image"
  ),
  "seedream/5-pro-image-to-image": tieredImagePage(
    "quality",
    { basic: 0.035, high: 0.07 },
    "https://kie.ai/seedream-5-0-pro",
    undefined,
    "2026-08-11",
    seedreamProEditExtra
  ),

  // Seedream 5 Pro layer decomposition — per image by output size. The
  // callable schema exposes auto|1K|1.5K|2K and defaults to auto; KIE only
  // publishes priced 1K/1.5K/2K cells, so auto remains an explicit
  // unsupported selector rather than inheriting a guessed tier.
  "seedream/5-pro-layer-decomposition": tieredImagePage(
    "size",
    { "1K": 0.035, "1.5K": 0.035, "2K": 0.07 },
    "https://kie.ai/seedream-5-0-pro",
    "auto",
    "2026-08-11"
  ),

  // Seedream 4.5 — flat $0.0325/image on both published rows. The schema
  // carries a basic/high quality tier, but the page prices only one rate for
  // the family, so quality is not a rate key here.
  //
  // OQ-3 RESOLVED: the "seedream 4.5" page family's anchors name the model ids
  // `seedream/4.5-text-to-image` and `seedream/4.5-edit` (catalogued
  // KIE_MEDIA_MODELS ids, each with its own createTask schema), so
  // those are the keys — a pricing key must equal what the caller puts in
  // `payload.model`. The ByteDance ids are a DIFFERENT product
  // generation and stay unpriced (fail-safe prohibitive): docs.kie.ai documents
  // `bytedance/seedream` as "Seedream3.0" and both
  // `bytedance/seedream-v4-{edit,text-to-image}` as "Seedream4.0", and none of
  // the three pages publishes a price. Keying $0.0325 to them would quote the
  // 4.5 rate for 3.0/4.0 traffic.
  "seedream/4.5-text-to-image": flatImagePricePage(
    0.0325,
    "https://kie.ai/seedream-4-5?model=seedream%2F4.5-text-to-image"
  ),
  "seedream/4.5-edit": flatImagePricePage(
    0.0325,
    "https://kie.ai/seedream-4-5?model=seedream%2F4.5-edit"
  ),

  // Nano Banana 2 Lite — flat $0.02/image (the page lists one "1k" row, and
  // the schema's only knob is aspect_ratio).
  "nano-banana-2-lite": flatImagePricePage(
    0.02,
    "https://kie.ai/nano-banana-2-lite"
  ),

  // GPT Image 1.5 — per image by `input.quality`: medium $0.02, high $0.11.
  // docs.kie.ai documents the default as "medium" on both models, applied as
  // the absent-field fallback (the t2i zod schema keeps quality required, so
  // the fallback only bites on partial payloads there).
  "gpt-image/1.5-text-to-image": tieredImagePage(
    "quality",
    { medium: 0.02, high: 0.11 },
    "https://kie.ai/gpt-image-1.5?model=gpt-image%2F1.5-text-to-image",
    "medium"
  ),
  "gpt-image/1.5-image-to-image": tieredImagePage(
    "quality",
    { medium: 0.02, high: 0.11 },
    "https://kie.ai/gpt-image-1.5?model=gpt-image%2F1.5-image-to-image",
    "medium"
  ),

  // Imagen 4 — three flat per-image tiers. The page prints the base and Fast
  // rows "per request" and the Ultra row "per image"; the schemas carry no
  // batch field, so one request is one image either way.
  "google/imagen4": flatImagePricePage(
    0.04,
    "https://kie.ai/google/imagen4?model=google%2Fimagen4"
  ),
  "google/imagen4-fast": flatImagePricePage(
    0.02,
    "https://kie.ai/google/imagen4?model=google%2Fimagen4-fast"
  ),
  "google/imagen4-ultra": flatImagePricePage(
    0.06,
    "https://kie.ai/google/imagen4?model=google%2Fimagen4-ultra"
  ),

  // Namespaced Nano Banana ids — $0.02/image each, the same rate as the bare
  // `nano-banana` key above. They are distinct pricing keys because they are
  // distinct model ids on the wire; a caller sending "google/nano-banana"
  // would otherwise miss the table entirely.
  "google/nano-banana": flatImagePricePage(0.02, "https://kie.ai/nano-banana"),
  "google/nano-banana-edit": flatImagePricePage(
    0.02,
    "https://kie.ai/nano-banana?model=google%2Fnano-banana-edit"
  ),

  // Z-Image — flat $0.004/image (aspect_ratio is the only knob).
  "z-image": flatImagePricePage(0.004, "https://kie.ai/z-image"),

  // Flux 2 — per image by `input.resolution`. Flex is the expensive tier
  // (1K $0.07, 2K $0.12), Pro the cheap one (1K $0.025, 2K $0.035). The field
  // is required by the zod schema and documents an upstream default of 1K,
  // applied as the absent-field fallback.
  "flux-2/flex-text-to-image": tieredImagePage(
    "resolution",
    { "1K": 0.07, "2K": 0.12 },
    "https://kie.ai/flux-2?model=flux-2%2Fflex-text-to-image",
    "1K"
  ),
  "flux-2/flex-image-to-image": tieredImagePage(
    "resolution",
    { "1K": 0.07, "2K": 0.12 },
    "https://kie.ai/flux-2?model=flux-2%2Fflex-image-to-image",
    "1K"
  ),
  "flux-2/pro-text-to-image": tieredImagePage(
    "resolution",
    { "1K": 0.025, "2K": 0.035 },
    "https://kie.ai/flux-2?model=flux-2%2Fpro-text-to-image",
    "1K"
  ),
  "flux-2/pro-image-to-image": tieredImagePage(
    "resolution",
    { "1K": 0.025, "2K": 0.035 },
    "https://kie.ai/flux-2?model=flux-2%2Fpro-image-to-image",
    "1K"
  ),

  // Ideogram — per image by `input.rendering_speed`, two rate ladders: V3
  // (TURBO $0.0175 / BALANCED $0.035 / QUALITY $0.05) and Character
  // (TURBO $0.06 / BALANCED $0.09 / QUALITY $0.12).
  //
  // The BALANCED fallback is NOT applied uniformly, because upstream does not
  // document it uniformly: the v3-edit, character, character-edit and
  // character-remix OpenAPI specs print "Default value: `BALANCED`" (mirrored
  // as `default: "BALANCED"` in kie's model-schemas.ts), while
  // v3-text-to-image and v3-remix print the enum with no default at all
  // (verified against docs.kie.ai 2026-08-06). Those two therefore fail the
  // estimate on an omitted rendering_speed rather than quoting the middle
  // tier. NOTE: the v3-text-to-image field *description* in model-schemas.ts
  // still says "documented default BALANCED"; the live spec does not, and the
  // spec wins here.
  //
  // `num_images` is a STRING enum on v3-remix and the character models and is
  // honoured through imageCount's numeric coercion — see that helper.
  "ideogram/v3-text-to-image": tieredImagePage(
    "rendering_speed",
    { TURBO: 0.0175, BALANCED: 0.035, QUALITY: 0.05 },
    "https://kie.ai/ideogram/v3?model=ideogram%2Fv3-text-to-image"
  ),
  "ideogram/v3-edit": tieredImagePage(
    "rendering_speed",
    { TURBO: 0.0175, BALANCED: 0.035, QUALITY: 0.05 },
    "https://kie.ai/ideogram/v3?model=ideogram%2Fv3-edit",
    "BALANCED"
  ),
  "ideogram/v3-remix": tieredImagePage(
    "rendering_speed",
    { TURBO: 0.0175, BALANCED: 0.035, QUALITY: 0.05 },
    "https://kie.ai/ideogram/v3?model=ideogram%2Fv3-remix"
  ),
  "ideogram/character": tieredImagePage(
    "rendering_speed",
    { TURBO: 0.06, BALANCED: 0.09, QUALITY: 0.12 },
    "https://kie.ai/ideogram/character?model=ideogram%2Fcharacter",
    "BALANCED"
  ),
  "ideogram/character-edit": tieredImagePage(
    "rendering_speed",
    { TURBO: 0.06, BALANCED: 0.09, QUALITY: 0.12 },
    "https://kie.ai/ideogram/character?model=ideogram%2Fcharacter-edit",
    "BALANCED"
  ),
  "ideogram/character-remix": tieredImagePage(
    "rendering_speed",
    { TURBO: 0.06, BALANCED: 0.09, QUALITY: 0.12 },
    "https://kie.ai/ideogram/character?model=ideogram%2Fcharacter-remix",
    "BALANCED"
  ),

  // Recraft image utilities — flat per image, no tier field in either schema.
  "recraft/crisp-upscale": flatImagePricePage(
    0.0025,
    "https://kie.ai/recraft-crisp-upscale"
  ),
  "recraft/remove-background": flatImagePricePage(
    0.005,
    "https://kie.ai/recraft-remove-background"
  ),

  // Topaz Image Upscaler — the page's three rows are OUTPUT resolutions
  // (2K $0.05, 4K $0.10, 8K $0.20), but the request schema's only knob is
  // `upscale_factor` ("1"|"2"|"4"), and docs.kie.ai publishes no mapping from
  // a factor to an output tier. Fail closed because the source image's
  // resolution is not carried by the payload.
  "topaz/image-upscale": {
    kind: "perUnit",
    unit: "images",
    units: () => undefined,
    select: [],
    rates: { "": 0 },
    warn: () => [
      "kie 'topaz/image-upscale': billed by OUTPUT resolution (2K $0.05, " +
        "4K $0.10, 8K $0.20) which the request schema cannot express — " +
        "upscale_factor has no documented output mapping, so the estimate " +
        "fails closed",
    ],
    source: pricePage("https://kie.ai/topaz-image-upscale"),
  },

  // Qwen Image — area-billed: $0.02/megapixel for the base pair, $0.03/MP for
  // the edit model (OQ-4). Units are ceil(megapixels per image) × image count,
  // resolved from the `input.image_size` preset through the shared
  // IMAGE_SIZE_DIMENSIONS table; each model's documented schema default is the
  // absent-field fallback.
  //
  // `qwen/image-to-image` has NO size field at all, and docs.kie.ai documents
  // no default output size for it (the output follows the source image, which
  // the payload does not size). Rather than guess an area, it carries the
  // published $0.02/MP rate with no default preset, so the estimate fails with
  // a units-derivation warning — the page rate stays recorded and visible
  // instead of the request falling through as "model not found".
  "qwen/text-to-image": perMegapixel(
    0.02,
    "https://kie.ai/qwen-image",
    "square_hd"
  ),
  "qwen/image-to-image": perMegapixel(0.02, "https://kie.ai/qwen-image"),
  "qwen/image-edit": perMegapixel(
    0.03,
    "https://kie.ai/qwen/image-edit",
    "landscape_4_3"
  ),

  // gpt4o-image/generate — endpoint-keyed. One published rate, 6 credits
  // ($0.03) per image; the schema has no batch field, so one call is one
  // image.
  "gpt4o-image/generate": flatImagePage(0.03, "https://kie.ai/4o-image-api"),

  // Flux Kontext — model-keyed off the FLAT payload's `model` enum (the
  // /api/v1/flux/kontext/generate body has no nested `input`). The keys equal
  // the upstream model ids, so a caller that passes one as
  // EstimateRequest.endpoint resolves the same entry either way.
  // Upstream documents flux-kontext-pro as the default model, but a
  // model-keyed entry cannot apply it: with `payload.model` omitted and no
  // caller endpoint there is no pricing key at all, so the estimate fails by
  // engine rule (same as the veo entries above). Recorded, never applied.
  "flux-kontext-pro": flatImagePage(0.025, "https://kie.ai/flux-kontext-api"),
  "flux-kontext-max": flatImagePage(0.05, "https://kie.ai/flux-kontext-api"),

  // sora-watermark-remover: flat $0.05 per removal (only published rate
  // on the marketplace). Schema has no tier selector.
  "sora-watermark-remover": flatGen(0.05, "openai/sora-2"),

  // ElevenLabs TTS resold through createTask (2026-08-06 pull). kie publishes
  // these per 1000 characters; each entry stores page USD / 1000 as its
  // per-character rate, so units are the character count — the same basis as
  // the elevenlabs provider's own table, which lets a caller compare the two
  // routes to the same model without a unit conversion. Neither schema has a
  // price tier, so all three are flat.
  "elevenlabs/text-to-speech-multilingual-v2": perCharacterPage(
    0.00006,
    "https://kie.ai/elevenlabs-tts?model=elevenlabs%2Ftext-to-speech-multilingual-v2"
  ),
  "elevenlabs/text-to-speech-turbo-2-5": perCharacterPage(
    0.00003,
    "https://kie.ai/elevenlabs-tts?model=elevenlabs%2Ftext-to-speech-turbo-2-5"
  ),
  // Dialogue v3 bills the same way but has no single `text` field: the
  // request is an array of {text, voice} turns, and the charge covers all of
  // them, so units sum every turn's text.
  "elevenlabs/text-to-dialogue-v3": perCharacterPage(
    0.00007,
    "https://kie.ai/elevenlabs/text-to-dialogue-v3",
    dialogueCharacters,
    "2026-08-11"
  ),

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
  // "split_stem"     → $0.25 (Multi-Stem Separation; the page qualifies this
  //                    row "without stemName")
  // Schema marks `type` optional; we don't assume a default.
  // UNMAPPABLE: the page publishes a third row on this same separate-vocals
  // endpoint — "Advanced Split", 20 credits ($0.10) — discriminated by a
  // stem-name argument that SunoVocalRemovalRequest does not have (`type` is
  // its only knob). Schema changes are out of scope, so the row is recorded
  // here rather than priced; it needs a schema field before it can key a rate.
  "suno/vocal-removal-generate": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [{ name: "type", pick: (p) => asString(p.type), required: true }],
    rates: { separate_vocal: 0.05, split_stem: 0.25 },
    source: pricePage(
      "https://kie.ai/suno-api?model=ai-music-api%2Fseparate-vocals",
      "2026-08-11"
    ),
  },

  // New Suno endpoints (5 missing from marketplace)
  "suno/mashup-generate": flatGen(0.06, "suno/suno"),
  "suno/replace-music-section-generate": flatGen(0.025, "suno/suno"),
  "suno/sounds-generate": flatGen(0.0125, "suno/suno"),
  "suno/add-instrumental-generate": flatGen(0.06, "suno/suno"),
  "suno/add-vocals-generate": flatGen(0.06, "suno/suno"),

  // suno/timestamped-lyrics — 0.5 credits ($0.0025) per request, for
  // POST /api/v1/generate/get-timestamped-lyrics. Key follows the existing
  // "suno/<segment>" grammar above.
  "suno/timestamped-lyrics": flatGenPage(
    0.0025,
    "https://kie.ai/suno-api?model=ai-music-api%2FtimeStamped-lyrics"
  ),

  // Suno rows the page publishes at 0 credits. They are entries — not
  // omissions — so an estimate resolves $0 with perUnitUsd 0 instead of
  // failing with "model not found". This flips no gating: kie is
  // provider-wide `prohibitive` in ENDPOINT_COST_POLICIES, so all three
  // dotPaths stay example-gated, `endpoint-cost-tiers.tsv` does not move, and
  // the OTP pay-gate registry keeps gating them.
  //
  // "suno/cover-generate" is POST /api/v1/suno/cover/generate (the cover-image
  // row) — distinct from "suno/upload-cover" above, which is
  // upload-and-cover-audio at $0.06.
  "suno/cover-generate": flatGenPage(
    0,
    "https://kie.ai/suno-api?model=ai-music-api%2Fcover-generate"
  ),
  "suno/persona-generate": flatGenPage(
    0,
    "https://kie.ai/suno-api?model=ai-music-api%2Fgenerate-persona"
  ),
  "suno/midi-generate": flatGenPage(
    0,
    "https://kie.ai/suno-api?model=ai-music-api%2Fgenerate-midi-from-audio"
  ),

  // gemini-omni-video: restructured against the 2026-08-06 pull. Both halves
  // changed shape, not just price.
  //
  // T2V (no video input) still bills per video by duration × resolution, but
  // 720p and 1080p are now the SAME price (63/84/105/126 credits for
  // 4/6/8/10s = $0.315/$0.42/$0.525/$0.63) and 4k is its own column
  // (147/168/189/210 credits = $0.735/$0.84/$0.945/$1.05). The old table had
  // 720p cheaper than 1080p and 4k priced at the 1080p column.
  //
  // V2V (a video_list clip is present) is now flat PER VIDEO by resolution —
  // upstream documents `duration` as ignored when video input is provided, and
  // the page prices it accordingly: 720p and 1080p both 168 credits ($0.84),
  // 4k 252 credits ($1.26). It used to be keyed by duration alone
  // ($0.84–$2.10), so a 10s v2v request was quoted 2.5× its actual price.
  "gemini-omni-video": {
    kind: "perUnit",
    unit: "generations",
    units: () => 1,
    select: [
      {
        name: "mode",
        pick: (p) => (hasVideoListInput(p) ? "v2v" : "t2v"),
      },
      // V2V ignores duration upstream, so the selector yields "" there, which
      // evaluatePerUnit drops from the joined variant key. The v2v rate keys
      // therefore carry no empty segment — writing them as "v2v||720p" (or,
      // in the previous shape, "v2v|4|") makes every V2V request miss the
      // table and price at zero.
      {
        name: "duration",
        pick: (p, hints) =>
          hasVideoListInput(p) ? "" : durationKey(p, hints, 4),
      },
      // Resolution now applies to BOTH modes: v2v is priced per resolution
      // too, so this selector no longer blanks itself for video input.
      {
        name: "resolution",
        pick: (p) => inputResolution(p) ?? "720p",
      },
    ],
    rates: {
      "t2v|4|720p": 0.315,
      "t2v|6|720p": 0.42,
      "t2v|8|720p": 0.525,
      "t2v|10|720p": 0.63,
      "t2v|4|1080p": 0.315,
      "t2v|6|1080p": 0.42,
      "t2v|8|1080p": 0.525,
      "t2v|10|1080p": 0.63,
      "t2v|4|4k": 0.735,
      "t2v|6|4k": 0.84,
      "t2v|8|4k": 0.945,
      "t2v|10|4k": 1.05,
      "v2v|720p": 0.84,
      "v2v|1080p": 0.84,
      "v2v|4k": 1.26,
    },
    source: pricePage("https://kie.ai/gemini-omni"),
  },

  // The two other OTP pay-gated Gemini Omni routes — `api.v1.omni.audio.create`
  // and `api.v1.omni.character.create` (paid-endpoints.ts) — are INTENTIONALLY
  // unpriced: the 2026-08-06 pull publishes no rate for either (0 of 404 rows;
  // the only omni rows are the gemini-omni-video generation cells above). A
  // guessed rate would be worse than none, so both keep the fail-safe
  // `prohibitive` tier they already had and their estimates fail loudly rather
  // than quoting a number. Pinned negatively in tests/unit/cost-pricing.test.ts.
};
