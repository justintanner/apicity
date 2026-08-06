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

// Source stamp for every entry refreshed from the 2026-08-06 kie pricing pull
// (WP1 snapshot `kie-pricing-snapshot-2026-08-06.json`). REQ-008 wants a page
// URL plus an asOf on each touched entry, so the date lives in one place
// rather than being retyped per entry.
const pricePage = (url: string) => ({ url, asOf: "2026-08-06" });

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

// MiniMax H3 (Hailuo 03): 2 tiers by resolution. KIE lists 22.5 credits/s
// ($0.1125) at 768P and 36.5 credits/s ($0.1825) at 2K. Documented
// upstream default is 2K when input.resolution is omitted. Duration is a
// required wire field (int 4–15), so no costHints channel is needed.
// Generation-only rates — KIE also bills optional video-input seconds and
// extra reference images beyond the free first five; those surcharges are
// not modeled here (same scope as other video helpers).
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

const miniMaxH3Video = (slug: string): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: seconds,
  select: [
    {
      name: "resolution",
      pick: (p) => asString(asObject(p.input)?.resolution) ?? "2K",
    },
  ],
  rates: { "768P": 0.1125, "2K": 0.1825 },
  source: { ...src(slug), asOf: "2026-08-06" },
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

  // minimax-h3: 2 tiers by resolution. KIE lists 22.5 credits/s ($0.1125)
  // at 768P and 36.5 credits/s ($0.1825) at 2K (verified kie.ai/pricing
  // 2026-08-06). Documented upstream default is 2K.
  "minimax-h3/text-to-video": miniMaxH3Video("minimax-h3/text-to-video"),
  "minimax-h3/image-to-video": miniMaxH3Video("minimax-h3/image-to-video"),
  "minimax-h3/reference-to-video": miniMaxH3Video(
    "minimax-h3/reference-to-video"
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
      { name: "duration", pick: (p) => scalarKey(p.duration) },
      { name: "quality", pick: (p) => asString(p.quality) },
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
    select: [{ name: "quality", pick: (p) => asString(p.quality) }],
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
    select: [{ name: "type", pick: (p) => asString(p.type) }],
    rates: { separate_vocal: 0.05, split_stem: 0.25 },
    source: { ...src("suno/suno"), asOf: "2026-08-06" },
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
