import type { ModelPricing } from "./types";
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
  // Reference videos bill by their measured length, which only
  // costHints.inputDurationSeconds can carry.
  "bytedance/seedance-2.5/text-to-video": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      if (!hasItems(p, "reference_videos")) return requestedSeconds(5)(p);
      const input = hintInputSeconds(hints);
      if (input === undefined) return undefined;
      const reference = Math.min(
        Math.ceil(Math.min(Math.max(input, 2), 30)),
        30
      );
      const output = requestedSeconds(Math.max(4, reference))(p);
      return output === undefined ? undefined : Math.max(2, reference) + output;
    },
    select: [
      {
        name: "videoInput",
        pick: (p) => (hasItems(p, "reference_videos") ? "video" : "no-video"),
      },
      { name: "resolution", pick: (p) => asString(p.resolution) ?? "720p" },
    ],
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
    warn: (p, hints) =>
      hasItems(p, "reference_videos") && hintInputSeconds(hints) === undefined
        ? [
            "wavespeed 'bytedance/seedance-2.5/text-to-video': reference_videos bill by their length; pass costHints.inputDurationSeconds",
          ]
        : [],
    source: source("bytedance/seedance-2.5/text-to-video"),
  },
};
