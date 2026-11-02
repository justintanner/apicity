import type { ModelPricing } from "./types";
import { asNumber, asString } from "./helpers";

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

// Whole seconds as WaveSpeed bills them: the requested duration rounded up
// and clamped to the model's range, or the model's default when the request
// omits it. A duration that is present but not a number fails closed.
const clampedSeconds =
  (fallback: number, min: number, max: number) =>
  (p: Record<string, unknown>): number | undefined => {
    const duration = p.duration === undefined ? fallback : asNumber(p.duration);
    if (duration === undefined) return undefined;
    return Math.min(Math.max(Math.ceil(duration), min), max);
  };

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
};
