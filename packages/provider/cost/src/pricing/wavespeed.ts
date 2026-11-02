import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asString, hintInputSeconds } from "./helpers";

// WaveSpeed list prices, keyed by the WaveSpeed model id (the path after
// /api/v3/ in its submit URL). Each model page embeds its pricing record:
// base_price in micro-USD, a JSONata-style formula over the request, and the
// discount_rate a running promotion pays, in percent. The rows price the LIST
// amount, before any discount. While a promotion runs WaveSpeed bills less,
// and its billing record carries both figures (price = billed,
// order.origin_price = list). Read 2026-11-02, and checked against free
// quotes (POST /api/v3/model/price) the same day.
const source = (modelId: string) => ({
  url: `https://wavespeed.ai/models/${modelId}`,
  asOf: "2026-11-02",
});

// The requested duration, or the model's default when the request omits it.
// A duration that is present but not a number fails closed.
const requestedSeconds =
  (fallback: number) =>
  (p: Record<string, unknown>): number | undefined =>
    p.duration === undefined ? fallback : asNumber(p.duration);

// The requested duration, capped where the formula caps it.
const cappedSeconds =
  (fallback: number, max: number) =>
  (p: Record<string, unknown>): number | undefined => {
    const duration = requestedSeconds(fallback)(p);
    return duration === undefined ? undefined : Math.min(duration, max);
  };

// Whole seconds for a formula that rounds the duration up and clamps it to
// the model's range.
const clampedSeconds =
  (fallback: number, min: number, max: number) =>
  (p: Record<string, unknown>): number | undefined => {
    const duration = requestedSeconds(fallback)(p);
    if (duration === undefined) return undefined;
    return Math.min(Math.max(Math.ceil(duration), min), max);
  };

const hasItems = (p: Record<string, unknown>, key: string) =>
  Array.isArray(p[key]) && (p[key] as unknown[]).length > 0;

// Seedance bills reference videos by their measured length, clamped to 2 s
// and the model's total, on top of the output seconds, whose default then
// follows the references. Only costHints.inputDurationSeconds can carry that
// length, so a request with reference videos and no hint fails closed.
const seedanceUnits =
  (maxReference: number) =>
  (p: Record<string, unknown>, hints?: CostHints): number | undefined => {
    if (!hasItems(p, "reference_videos")) return requestedSeconds(5)(p);
    const input = hintInputSeconds(hints);
    if (input === undefined) return undefined;
    const reference = Math.min(
      Math.ceil(Math.min(Math.max(input, 2), maxReference)),
      maxReference
    );
    const output = requestedSeconds(Math.max(4, reference))(p);
    return output === undefined ? undefined : Math.max(2, reference) + output;
  };

const seedanceSelect: PerUnitPricing["select"] = [
  {
    name: "videoInput",
    pick: (p) => (hasItems(p, "reference_videos") ? "video" : "no-video"),
  },
  { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
];

// A video edit bills the input clip's seconds as well as the output's. Only
// costHints.inputDurationSeconds can carry the input's length, so an edit
// without it fails closed.
const editedVideoWarn =
  (modelId: string) =>
  (_p: Record<string, unknown>, hints?: CostHints): string[] =>
    hintInputSeconds(hints) === undefined
      ? [
          `wavespeed '${modelId}': the input video bills by its length; pass costHints.inputDurationSeconds`,
        ]
      : [];

// FLUX 3 rounds the duration up and caps it at 20 s, and compares the
// resolution lowercased.
const flux3Units = (p: Record<string, unknown>): number | undefined => {
  const duration = requestedSeconds(5)(p);
  return duration === undefined ? undefined : Math.min(Math.ceil(duration), 20);
};

const flux3Select: PerUnitPricing["select"] = [
  {
    name: "resolution",
    pick: (p) => asString(p.resolution)?.toLowerCase() ?? "720p",
  },
];

// Reference videos bill by their length, which only
// costHints.inputDurationSeconds can carry.
const referenceVideosWarn =
  (modelId: string) =>
  (p: Record<string, unknown>, hints?: CostHints): string[] =>
    hasItems(p, "reference_videos") && hintInputSeconds(hints) === undefined
      ? [
          `wavespeed '${modelId}': reference_videos bill by their length; pass costHints.inputDurationSeconds`,
        ]
      : [];

export const wavespeed: Record<string, ModelPricing> = {
  // base_price 100000 micros, discount_rate 95 on 2026-11-02. Formula:
  //   {"total_price": base_price * (resolution = "1080p" ? 2 :
  //   (resolution = "480p" ? 0.5 : 1)) * $min([$max([$ceil(duration), 2]),
  //   30])}
  "alibaba/wan-3.0/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: clampedSeconds(5, 2, 30),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    source: source("alibaba/wan-3.0/text-to-video"),
  },
  // base_price 45000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": $ceil(duration * (resolution = "480p" ? 25000 :
  //   base_price))}
  // The ceil rounds micro-USD, so whole seconds bill exactly.
  "heygen/video-1.0/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: requestedSeconds(5),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "768p" },
    ],
    rates: { "480p": 0.025, "768p": 0.045 },
    source: source("heygen/video-1.0/text-to-video"),
  },
  // base_price 100000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": base_price * $min([duration, 15]) *
  //   (resolution = "768p" ? 1 : 1.4)}
  "minimax/h3/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: cappedSeconds(5, 15),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "768p" },
    ],
    rates: { "768p": 0.1, "2k": 0.14 },
    source: source("minimax/h3/text-to-video"),
  },
  // base_price 360000 micros, discount_rate 90 on 2026-11-02. Formula:
  //   {"total_price": ($scale := (resolution = "4k" ? 10 :
  //   resolution = "1080p" ? 5 : resolution = "720p" ? 2 : 1);
  //   $count(reference_videos) > 0 ? ($reference_duration :=
  //   $min([$ceil(get_duration(reference_videos, min=2, max=30,
  //   total=30)), 30]); 110000 * $scale * ($max([2, $reference_duration]) +
  //   (duration ? duration : $max([4, $reference_duration])))) :
  //   (base_price / 2) * $scale * duration)}
  "bytedance/seedance-2.5/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seedanceUnits(30),
    select: seedanceSelect,
    rates: {
      "no-video|480p": 0.18,
      "no-video|720p": 0.36,
      "no-video|1080p": 0.9,
      "no-video|4k": 1.8,
      "video|480p": 0.11,
      "video|720p": 0.22,
      "video|1080p": 0.55,
      "video|4k": 1.1,
    },
    warn: referenceVideosWarn("bytedance/seedance-2.5/text-to-video"),
    source: source("bytedance/seedance-2.5/text-to-video"),
  },
  // base_price 170000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": base_price * $min([$ceil($number(duration)), 20]) *
  //   ($lowercase($string(resolution)) = "1080p" ? 29 / 17 : 1)}
  // so 1080p bills 0.29 USD/s.
  "black-forest-labs/flux-3/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: flux3Units,
    select: flux3Select,
    rates: { "720p": 0.17, "1080p": 0.29 },
    source: source("black-forest-labs/flux-3/text-to-video"),
  },
  // base_price 240000 micros, discount_rate 90 on 2026-11-02. Formula:
  //   {"total_price": ($scale := (resolution = "4k" ? 10 :
  //   resolution = "1080p" ? 5 : resolution = "720p" ? 2 : 1);
  //   $count(reference_videos) > 0 ? ($ref :=
  //   $min([$ceil(get_duration(reference_videos, min=2, max=15,
  //   total=15)), 15]); 75000 * $scale * ($max([2, $ref]) +
  //   (duration ? duration : $max([4, $ref])))) :
  //   (base_price / 2) * $scale * duration)}
  "bytedance/seedance-2.0/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: seedanceUnits(15),
    select: seedanceSelect,
    rates: {
      "no-video|480p": 0.12,
      "no-video|720p": 0.24,
      "no-video|1080p": 0.6,
      "no-video|4k": 1.2,
      "video|480p": 0.075,
      "video|720p": 0.15,
      "video|1080p": 0.375,
      "video|4k": 0.75,
    },
    warn: referenceVideosWarn("bytedance/seedance-2.0/text-to-video"),
    source: source("bytedance/seedance-2.0/text-to-video"),
  },
  // base_price 100000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": base_price * (duration ? duration : 8) *
  //   (resolution = "360p" ? 0.3 : resolution = "1080p" ? 1.5 :
  //   resolution = "4k" ? 3 : 1)}
  "google/gemini-omni-1.1-flash/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: requestedSeconds(8),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "360p": 0.03, "720p": 0.1, "1080p": 0.15, "4k": 0.3 },
    source: source("google/gemini-omni-1.1-flash/text-to-video"),
  },
  // base_price 100000 micros, discount_rate 100 on 2026-11-02. The formula
  // is the text-to-video one; the input image adds nothing:
  //   {"total_price": base_price * $min([duration, 15]) *
  //   (resolution = "768p" ? 1 : 1.4)}
  "minimax/h3/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: cappedSeconds(5, 15),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "768p" },
    ],
    rates: { "768p": 0.1, "2k": 0.14 },
    source: source("minimax/h3/image-to-video"),
  },
  // base_price 360000 micros, discount_rate 90 on 2026-11-02. Formula:
  //   {"total_price": base_price * (resolution = "4k" ? 5 :
  //   (resolution = "1080p" ? 2.5 : (resolution = "720p" ? 1 : 0.5))) *
  //   duration}
  "bytedance/seedance-2.5/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: requestedSeconds(5),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.18, "720p": 0.36, "1080p": 0.9, "4k": 1.8 },
    source: source("bytedance/seedance-2.5/image-to-video"),
  },
  // base_price 100000 micros, discount_rate 100 on 2026-11-02. The formula
  // is the text-to-video one; the input image adds nothing:
  //   {"total_price": base_price * (duration ? duration : 8) *
  //   (resolution = "360p" ? 0.3 : resolution = "1080p" ? 1.5 :
  //   resolution = "4k" ? 3 : 1)}
  "google/gemini-omni-1.1-flash/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: requestedSeconds(8),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "360p": 0.03, "720p": 0.1, "1080p": 0.15, "4k": 0.3 },
    source: source("google/gemini-omni-1.1-flash/image-to-video"),
  },
  // base_price 100000 micros, discount_rate 95 on 2026-11-02. The formula
  // is the text-to-video one; the input image adds nothing:
  //   {"total_price": base_price * (resolution = "1080p" ? 2 :
  //   (resolution = "480p" ? 0.5 : 1)) * $min([$max([$ceil(duration), 2]),
  //   30])}
  "alibaba/wan-3.0/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: clampedSeconds(5, 2, 30),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    source: source("alibaba/wan-3.0/image-to-video"),
  },
  // base_price 240000 micros, discount_rate 90 on 2026-11-02. Formula:
  //   {"total_price": base_price * (resolution = "4k" ? 5 :
  //   (resolution = "1080p" ? 2.5 : (resolution = "720p" ? 1 : 0.5))) *
  //   duration}
  "bytedance/seedance-2.0/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: requestedSeconds(5),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.12, "720p": 0.24, "1080p": 0.6, "4k": 1.2 },
    source: source("bytedance/seedance-2.0/image-to-video"),
  },
  // base_price 170000 micros, discount_rate 100 on 2026-11-02. The formula
  // is the text-to-video one; the input image adds nothing:
  //   {"total_price": base_price * $min([$ceil($number(duration)), 20]) *
  //   ($lowercase($string(resolution)) = "1080p" ? 29 / 17 : 1)}
  "black-forest-labs/flux-3/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: flux3Units,
    select: flux3Select,
    rates: { "720p": 0.17, "1080p": 0.29 },
    source: source("black-forest-labs/flux-3/image-to-video"),
  },
  // base_price 140000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": (resolution = "480p" ? 80000 : resolution = "720p" ?
  //   base_price : 250000) * $min([duration, 15]) + 10000}
  // The 10000 micros are the input image, billed once per request.
  "x-ai/grok-imagine-video-v1.5/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: cappedSeconds(6, 15),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.08, "720p": 0.14, "1080p": 0.25 },
    extra: () => 0.01,
    source: source("x-ai/grok-imagine-video-v1.5/image-to-video"),
  },
  // base_price 140000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": (resolution = "1080p" ? 180000 : (resolution = "480p"
  //   ? 70000 : base_price)) * duration}
  "alibaba/happyhorse-1.1/image-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: requestedSeconds(5),
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.07, "720p": 0.14, "1080p": 0.18 },
    source: source("alibaba/happyhorse-1.1/image-to-video"),
  },
  // base_price 100000 micros, discount_rate 100 on 2026-11-02. Formula:
  //   {"total_price": ($source := $min([$ceil(get_duration(video, min=1,
  //   max=15, total=15)), 15]); $output := $min([duration ? duration :
  //   $max([2, $source]), 15]); base_price * (resolution = "1080p" ? 2 :
  //   (resolution = "480p" ? 0.5 : 1)) * ($source + $output))}
  "alibaba/wan-3.0/video-edit": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const input = hintInputSeconds(hints);
      if (input === undefined) return undefined;
      const source = Math.min(Math.ceil(Math.min(Math.max(input, 1), 15)), 15);
      const output = requestedSeconds(Math.max(2, source))(p);
      return output === undefined ? undefined : source + Math.min(output, 15);
    },
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    warn: editedVideoWarn("alibaba/wan-3.0/video-edit"),
    source: source("alibaba/wan-3.0/video-edit"),
  },
  // base_price 300000 micros, discount_rate 95 on 2026-11-02. Formula:
  //   {"total_price": (base_price / 3) * (resolution = "1080p" ? 2 :
  //   (resolution = "480p" ? 0.5 : 1)) * ($min([duration, 30]) +
  //   $ceil($min([get_duration(reference_videos, min=1, max=15,
  //   total=15), 15])))}
  // Reference images and audio add nothing; reference videos add their
  // length, clamped to 1-15 s and rounded up.
  "alibaba/wan-3.0/reference-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const output = cappedSeconds(5, 30)(p);
      if (output === undefined || !hasItems(p, "reference_videos")) {
        return output;
      }
      const input = hintInputSeconds(hints);
      return input === undefined
        ? undefined
        : output + Math.ceil(Math.min(Math.max(input, 1), 15));
    },
    select: [
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
    rates: { "480p": 0.05, "720p": 0.1, "1080p": 0.2 },
    warn: referenceVideosWarn("alibaba/wan-3.0/reference-to-video"),
    source: source("alibaba/wan-3.0/reference-to-video"),
  },
};
