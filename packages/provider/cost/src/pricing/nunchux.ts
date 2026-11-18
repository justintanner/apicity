import {
  SEEDANCE_2P0_SIZES,
  SEEDANCE_2P5_SIZES,
  seedanceTokens,
} from "../seedance";
import type { CostHints } from "../types";
import { asObject, asString, hintInputSeconds } from "./helpers";
import type { ModelPricing, PerUnitPricing } from "./types";

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

type SeedanceVersion = "2.0" | "2.5";

function nunchuxSeedanceTokens(
  version: SeedanceVersion,
  p: Record<string, unknown>,
  hints?: CostHints
): number | string {
  const seconds =
    p.duration === undefined ? hints?.durationSeconds : p.duration;
  if (typeof seconds !== "number" || !Number.isInteger(seconds) || seconds < 4)
    return "Seedance requires the output duration in whole seconds (at least 4). Supply duration or costHints.durationSeconds.";
  const resolution = p.resolution === undefined ? "720p" : p.resolution;
  if (
    resolution !== "480p" &&
    resolution !== "720p" &&
    !(resolution === "1080p" && version === "2.0")
  )
    return version === "2.0"
      ? "Seedance 2.0 prices 480p, 720p and 1080p."
      : "Seedance 2.5 prices 480p and 720p.";
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
  // The 2.5 first-frame receipt reports an adaptive 281:374 shape. At 480p
  // the matching integer dimensions are 562 x 748: 97 frames yield
  // 39,820.77 tokens and the vendor billed 39,820 whole tokens.
  if (version === "2.5" && resolution === "480p" && ratio === "281:374")
    return Math.floor(seedanceTokens([562, 748], seconds, inputSeconds));
  const sizes = version === "2.0" ? SEEDANCE_2P0_SIZES : SEEDANCE_2P5_SIZES;
  const shapes = sizes[resolution]!;
  if (ratio === undefined || !Object.hasOwn(shapes, ratio))
    return "Seedance follows the input frame. Pass its supported aspect ratio in costHints.aspectRatio.";
  return Math.round(seedanceTokens(shapes[ratio]!, seconds, inputSeconds));
}

function seedancePricing(
  version: SeedanceVersion,
  rates: PerUnitPricing["rates"]
): PerUnitPricing {
  return {
    kind: "perUnit",
    unit: "tokens",
    units: (p, hints) => {
      const result = nunchuxSeedanceTokens(version, p, hints);
      return typeof result === "number" ? result : undefined;
    },
    warn: (p, hints) => {
      const result = nunchuxSeedanceTokens(version, p, hints);
      return typeof result === "string" ? [result] : [];
    },
    select: [
      {
        name: "1080p tier",
        pick: (p) => (p.resolution === "1080p" ? "1080p" : undefined),
      },
      {
        name: "video input",
        pick: (p) => (hasSeedanceReferenceVideo(p) ? "video_input" : "default"),
      },
    ],
    rates,
    source: { url: "https://nunchux.ai/pricing", asOf: "2026-11-18" },
  };
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
  // Both /pricing and /v1/pricing list wan2.7-videoedit at $0.10/$0.15 per
  // second for 720P/1080P (no 480P) with input_video_billed true and
  // max_billable_input_video_seconds 10: the source clip bills as well.
  "wan2.7-videoedit": {
    kind: "perUnit",
    unit: "seconds",
    units: (p, hints) => {
      const source = hintInputSeconds(hints);
      if (source === undefined) return undefined;
      const duration = asObject(p.parameters)?.duration;
      if (
        duration !== undefined &&
        (typeof duration !== "number" ||
          !Number.isInteger(duration) ||
          duration < 2 ||
          duration > 10)
      )
        return undefined;
      const output = duration ?? source;
      return output + Math.min(source, output, 10);
    },
    warn: (_p, hints) =>
      hintInputSeconds(hints) === undefined
        ? [
            "Wan 2.7 edits bill the source clip's length. Pass it in costHints.inputDurationSeconds.",
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
    rates: { "720P": 0.1, "1080P": 0.15 },
    source: { url: "https://nunchux.ai/pricing", asOf: "2026-11-18" },
  },
  // Both feeds list 480p|720p/default at $10.70/M completion tokens and
  // 480p|720p/video_input at $6.40/M. Neither feed splits the rate by audio.
  // A silent 480p, 16:9, 4-second render reported 38,830 completion tokens.
  "dreamina-seedance-2-5-260628": seedancePricing("2.5", {
    default: 10.7 / 1e6,
    video_input: 6.4 / 1e6,
  }),
  // Both public and account feeds quote $7.00/$4.30 per million tokens
  // at 480p and 720p, and $7.70/$4.70 at 1080p (default/reference video).
  "dreamina-seedance-2-0-260128": seedancePricing("2.0", {
    default: 7 / 1e6,
    video_input: 4.3 / 1e6,
    "1080p|default": 7.7 / 1e6,
    "1080p|video_input": 4.7 / 1e6,
  }),
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
