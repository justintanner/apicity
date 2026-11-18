import { asObject, asString, hintInputSeconds } from "./helpers";
import type { ModelPricing } from "./types";

function hasWanReferenceVideo(payload: Record<string, unknown>): boolean {
  const media = asObject(payload.input)?.media;
  return (
    Array.isArray(media) &&
    media.some((item) => asObject(item)?.type === "reference_video")
  );
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
