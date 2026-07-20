import type { ModelPricing } from "./types";
import { asNumber, asObject } from "./helpers";

const source = {
  url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
};

// Media rates below are the **International**-region rows of the Model
// Studio pricing page, read on 2026-07-20, so they carry their own asOf
// stamp rather than inheriting the older global PRICING_AS_OF. The page also
// publishes a Chinese-mainland column at different figures (e.g. $0.086012/s
// for wan2.7-i2v against $0.10/s international) — do not mix the two.
const mediaSource = { ...source, asOf: "2026-07-20" };

// DashScope image endpoints carry the batch count in `parameters.n`
// (1-12 for wan2.7-image*, 1-6 for the qwen-image* family). Absent means a
// single image. Alibaba bills per *successfully generated* image and does
// not vary the rate by resolution or aspect ratio, so there is no selector.
const imageCount = (p: Record<string, unknown>): number =>
  asNumber(asObject(p.parameters)?.n) ?? 1;

const flatImage = (perUnit: number): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [],
  rates: { "": perUnit },
  source: mediaSource,
});

// `parameters.duration` is the requested output length in seconds. The
// schema also accepts the literal 0, which asks the model to match the
// source clip — that length is only known upstream, so both the 0 case and
// the omitted case fall back to the upstream 5s default.
const videoSeconds = (p: Record<string, unknown>): number => {
  const duration = asNumber(asObject(p.parameters)?.duration);
  return duration !== undefined && duration > 0 ? duration : 5;
};

// wan2.7 video bills per second of generated output. There is deliberately
// no resolution selector: the pricing table publishes a single 720P row per
// wan2.7 video model, so a 1080P request — which the request schema accepts
// — has no separately published rate. A flat entry keeps every payload the
// schema allows estimable; add a selector if Alibaba publishes a 1080P tier.
const flatVideo = (perUnit: number): ModelPricing => ({
  kind: "perUnit",
  unit: "seconds",
  units: videoSeconds,
  select: [],
  rates: { "": perUnit },
  source: mediaSource,
});

export const alibaba: Record<string, ModelPricing> = {
  "qwen3.6-plus": {
    kind: "tokens",
    rate: { input: 0.325, output: 1.95 },
    source,
  },
  "qwen3.5-0.8b": {
    kind: "tokens",
    rate: { input: 0.01, output: 0.04 },
    source,
  },

  // Image — Qwen Image 2.0 (text-to-image) and the Qwen Image Edit family.
  "qwen-image-2.0": flatImage(0.035),
  "qwen-image-2.0-pro": flatImage(0.075),
  "qwen-image-edit": flatImage(0.045),
  "qwen-image-edit-plus": flatImage(0.03),
  "qwen-image-edit-max": flatImage(0.075),

  // Image — Wan 2.7. Note the non-pro `wan2.7-image` tier ($0.03/image) is
  // not registered in slugs.ts, so it has no entry here.
  "wan2.7-image-pro": flatImage(0.075),

  // Video — Wan 2.7 image-to-video and instruction-based video editing.
  "wan2.7-i2v": flatVideo(0.1),
  "wan2.7-videoedit": flatVideo(0.1),
};
