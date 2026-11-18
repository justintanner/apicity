import { SEEDANCE_2P5_SIZES, seedanceTokens } from "../seedance";
import type { CostHints } from "../types";
import { asObject, asString, hintInputSeconds } from "./helpers";
import type { ModelPricing } from "./types";

function hasWanReferenceVideo(payload: Record<string, unknown>): boolean {
  const media = asObject(payload.input)?.media;
  return (
    Array.isArray(media) &&
    media.some((item) => asObject(item)?.type === "reference_video")
  );
}

function hasSeedanceReferenceVideo(p: Record<string, unknown>): boolean {
  return (
    Array.isArray(p.content) &&
    p.content.some((part) => asObject(part)?.type === "video_url")
  );
}

function nunchuxSeedanceTokens(
  p: Record<string, unknown>,
  hints?: CostHints
): number | string {
  const seconds =
    p.duration === undefined ? hints?.durationSeconds : p.duration;
  if (typeof seconds !== "number" || !Number.isInteger(seconds) || seconds < 4)
    return "Seedance requires the output duration in whole seconds (at least 4). Supply duration or costHints.durationSeconds.";
  const resolution = p.resolution === undefined ? "720p" : p.resolution;
  if (resolution !== "480p" && resolution !== "720p")
    return "Seedance 2.5 prices 480p and 720p.";
  const inputSeconds = hasSeedanceReferenceVideo(p)
    ? hintInputSeconds(hints)
    : 0;
  if (inputSeconds === undefined)
    return "Seedance bills the input frames of reference videos. Pass their total length in costHints.inputDurationSeconds.";
  const hasFrame =
    Array.isArray(p.content) &&
    p.content.some((part) => {
      const item = asObject(part);
      return item?.type === "image_url" && item.role !== "reference_image";
    });
  // Text-only and reference-image receipts returned 16:9. A first frame sets the shape.
  const ratio = hasFrame ? hints?.aspectRatio : "16:9";
  // The first-frame receipt reports an adaptive 281:374 shape. At 480p
  // the matching integer dimensions are 562 x 748: 97 frames yield
  // 39,820.77 tokens and the vendor billed 39,820 whole tokens.
  if (resolution === "480p" && ratio === "281:374")
    return Math.floor(seedanceTokens([562, 748], seconds, inputSeconds));
  const sizes = SEEDANCE_2P5_SIZES[resolution]!;
  if (ratio === undefined || !Object.hasOwn(sizes, ratio))
    return "Seedance follows the input frame. Pass its supported aspect ratio in costHints.aspectRatio.";
  return Math.round(seedanceTokens(sizes[ratio]!, seconds, inputSeconds));
}

export const nunchux: Record<string, ModelPricing> = {
  // Both /pricing and /v1/pricing list 480P/720P/1080P at $0.05/$0.10/$0.20
  // per second, with at most 15 seconds of billable reference video.
  "wan3.0-video": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const duration = asObject(p.parameters)?.duration;
      const output = duration === undefined ? 5 : duration;
      if (
        typeof output !== "number" ||
        !Number.isInteger(output) ||
        output < 2 ||
        output > 30
      )
        return undefined;
      if (!hasWanReferenceVideo(p)) return output;
      const input = hintInputSeconds(hints);
      if (input === undefined) return undefined;
      const seconds = output + Math.min(input, 15);
      return seconds <= 30 ? seconds : undefined;
    },
    warn: (p, hints) =>
      hasWanReferenceVideo(p) && hintInputSeconds(hints) === undefined
        ? [
            "Wan reference videos bill by length. Pass their total seconds in costHints.inputDurationSeconds.",
          ]
        : [],
    select: [
      {
        name: "resolution",
        required: true,
        pick: (p) => {
          const resolution = asObject(p.parameters)?.resolution;
          return resolution === undefined ? "1080P" : asString(resolution);
        },
      },
    ],
    rates: { "480P": 0.05, "720P": 0.1, "1080P": 0.2 },
    source: { url: "https://nunchux.ai/pricing", asOf: "2026-11-18" },
  },
  // Both feeds list 480p|720p/default at $10.70/M completion tokens and
  // 480p|720p/video_input at $6.40/M. Neither feed splits the rate by audio.
  // A silent 480p, 16:9, 4-second render reported 38,830 completion tokens.
  "dreamina-seedance-2-5-260628": {
    kind: "perUnit",
    unit: "tokens",
    units: (p, hints) => {
      const result = nunchuxSeedanceTokens(p, hints);
      return typeof result === "number" ? result : undefined;
    },
    warn: (p, hints) => {
      const result = nunchuxSeedanceTokens(p, hints);
      return typeof result === "string" ? [result] : [];
    },
    select: [
      {
        name: "video input",
        pick: (p) => (hasSeedanceReferenceVideo(p) ? "video_input" : "default"),
      },
    ],
    rates: { default: 10.7 / 1e6, video_input: 6.4 / 1e6 },
    source: { url: "https://nunchux.ai/pricing", asOf: "2026-11-18" },
  },
  // /pricing and /v1/pricing quote 0.03024 / 0.04536 / 0.1017 USD
  // after Google's standard 10% discount. The table stores list USD.
  "gemini-nano-banana-2.1": {
    kind: "perUnit",
    unit: "images",
    units: () => 1,
    select: [
      {
        name: "image_size",
        required: true,
        pick: (p) => {
          const size = asObject(p.response_format)?.image_size;
          return size === undefined ? "4K" : asString(size);
        },
      },
    ],
    rates: { "1K": 0.0336, "2K": 0.0504, "4K": 0.113 },
    source: { url: "https://nunchux.ai/pricing", asOf: "2026-11-18" },
  },
};
