import { ALIBABA_CHAT } from "./alibaba-chat";
import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asObject, asString, hintInputSeconds } from "./helpers";

const source = {
  url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
};

// Media rates below are the **International**-region rows of the Model
// Studio pricing page, read on 2026-07-20, so they carry their own asOf
// stamp rather than inheriting the older global PRICING_AS_OF. The page also
// publishes a Chinese-mainland column at different figures (e.g. $0.086012/s
// for wan2.7-i2v against $0.10/s international) — do not mix the two.
const mediaSource = { ...source, asOf: "2026-07-20" };
const wan27ImageSource = { ...source, asOf: "2026-07-22" };
const wan27VideoSource = { ...source, asOf: "2026-11-05" };

// DashScope image endpoints carry the batch count in `parameters.n`
// (1-12 for wan2.7-image*, 1-6 for the qwen-image* family). Absent means a
// single image. Alibaba bills per *successfully generated* image and does
// not vary the rate by resolution or aspect ratio, so there is no selector.
const imageCount = (p: Record<string, unknown>): number =>
  asNumber(asObject(p.parameters)?.n) ?? 1;

const flatImage = (
  perUnit: number,
  rateSource: typeof mediaSource = mediaSource
): ModelPricing => ({
  kind: "perUnit",
  unit: "images",
  units: imageCount,
  select: [],
  rates: { "": perUnit },
  source: rateSource,
});

// wan2.7 video bills per second by resolution: the International rows of the
// pricing page print $0.10 at 720P and $0.15 at 1080P for both models (read
// 2026-11-05), and both API references default `parameters.resolution` to 1080P.
const WAN_27_VIDEO_RATES: Record<string, number> = {
  "720P": 0.1,
  "1080P": 0.15,
};
const wan27Resolution: PerUnitPricing["select"][number] = {
  name: "resolution",
  pick: (p) => asString(asObject(p.parameters)?.resolution) ?? "1080P",
};

// `parameters.duration` is the requested output length in seconds, with an
// upstream default of 5.
const videoSeconds = (p: Record<string, unknown>): number => {
  const duration = asNumber(asObject(p.parameters)?.duration);
  return duration !== undefined && duration > 0 ? duration : 5;
};

// wan2.7-videoedit bills both videos: usage.duration, "used for billing", is
// input_video_duration + output_video_duration in the API reference, and the
// pricing page's rule for this table says the same. The output keeps its source's
// length, and `parameters.duration` only truncates it (omitted or 0 does not). The
// request carries no length for the source, so an edit prices only through
// costHints.inputDurationSeconds. alibaba_1329897167/wan-videoedit_1470878067 kept
// a 5.02 s source and reported 5.02 + 5.02 = 10.04.
const videoEditSeconds = (
  p: Record<string, unknown>,
  hints?: CostHints
): number | undefined => {
  const input = hintInputSeconds(hints);
  if (input === undefined) return undefined;
  const duration = asNumber(asObject(p.parameters)?.duration);
  return (
    input +
    (duration !== undefined && duration > 0 ? Math.min(duration, input) : input)
  );
};

export const alibaba: Record<string, ModelPricing> = {
  // Historical catalog identity retained for consumers. The scoped selector
  // refuses this retired model because the current card has no rate.
  "qwen3.5-0.8b": {
    kind: "tokens",
    rate: { input: 0.01, output: 0.04 },
    source: { ...source, asOf: "2026-04-30" },
  },
  ...Object.fromEntries(
    Object.entries(ALIBABA_CHAT).map(([model, scopes]) => {
      const band = (scopes["Chinese mainland"] ??
        scopes.International ??
        Object.values(scopes)[0])![0];
      return [
        model,
        {
          kind: "tokens",
          rate: { input: band[2], output: band[3] },
          source: { ...source, asOf: "2026-11-04" },
        } satisfies ModelPricing,
      ];
    })
  ),

  // Image — Qwen Image 2.0 (text-to-image) and the Qwen Image Edit family.
  "qwen-image-2.0": flatImage(0.035),
  "qwen-image-2.0-pro": flatImage(0.075),
  "qwen-image-edit": flatImage(0.045),
  "qwen-image-edit-plus": flatImage(0.03),
  "qwen-image-edit-max": flatImage(0.075),

  // Image — Wan 2.7, International-region list rates.
  "wan2.7-image": flatImage(0.03, wan27ImageSource),
  "wan2.7-image-pro": flatImage(0.075, wan27ImageSource),

  // Video — Wan 2.7 image-to-video and instruction-based video editing.
  "wan2.7-i2v": {
    kind: "perUnit",
    unit: "seconds",
    units: videoSeconds,
    select: [wan27Resolution],
    rates: WAN_27_VIDEO_RATES,
    source: wan27VideoSource,
  },
  "wan2.7-videoedit": {
    kind: "perUnit",
    unit: "seconds",
    units: videoEditSeconds,
    select: [wan27Resolution],
    rates: WAN_27_VIDEO_RATES,
    warn: (_p, hints) =>
      hintInputSeconds(hints) === undefined
        ? [
            "alibaba 'wan2.7-videoedit': an edit bills its source's seconds beside its output's, and the request carries no length for the source; pass costHints.inputDurationSeconds",
          ]
        : [],
    source: wan27VideoSource,
  },
};
