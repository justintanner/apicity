// Coercion helpers used by per-provider pricing entries to read upstream
// payload values. Promoted from extract/messages.ts and extract/kie.ts so
// pricing entries can stand alone without depending on the extract module.

import type { CostHints } from "../types";

export function asString(x: unknown): string | undefined {
  return typeof x === "string" ? x : undefined;
}

export function asNumber(x: unknown): number | undefined {
  return typeof x === "number" && Number.isFinite(x) ? x : undefined;
}

export function asObject(x: unknown): Record<string, unknown> | undefined {
  return x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : undefined;
}

// Coerces durations published by kie schemas. Most use a number of seconds,
// kling uses "5s"/"10s" strings, grok-imagine/image-to-video uses bare
// "6"-"30" digit strings.
export function coerceSeconds(d: unknown): number | undefined {
  const n = asNumber(d);
  if (n !== undefined) return n;
  const s = asString(d);
  if (s) {
    const m = s.match(/^(\d+(?:\.\d+)?)/);
    if (m) {
      const v = Number(m[1]);
      if (Number.isFinite(v)) return v;
    }
  }
  return undefined;
}

// Reads the caller-declared duration out of the cost-only hint channel. Lives
// here rather than in kie.ts because xai applies the same rule.
//
// asNumber already rejects non-numbers, NaN and Infinity, so `> 0` is the only
// rule this adds: a zero, negative or unusable hint is treated as ABSENT and
// falls through to the entry's remaining duration tiers and then to the
// missing-units warning — never to a negative or NaN usd. The positivity rule
// deliberately applies at the hint tier only; coerceSeconds keeps its current
// behaviour, so a payload carrying a negative wire duration prices exactly as
// it does today.
export function hintSeconds(hints?: CostHints): number | undefined {
  const n = asNumber(hints?.durationSeconds);
  return n !== undefined && n > 0 ? n : undefined;
}

// Reads the caller-declared total length of the request's VIDEO INPUTS out of
// the cost-only hint channel, for the kie entries that bill
// (input video duration + output video duration) x unit price. Same
// acceptance rule as hintSeconds: a zero, negative or non-numeric value is
// treated as ABSENT, so the entry fails closed rather than pricing a negative
// or NaN input length.
export function hintInputSeconds(hints?: CostHints): number | undefined {
  const n = asNumber(hints?.inputDurationSeconds);
  return n !== undefined && n > 0 ? n : undefined;
}

// Valid fixed dimensions for the GPT Image 2 family.
export function gptImageDimensions(width: unknown, height: unknown) {
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    return undefined;
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const pixels = width * height;
  if (width % 16 !== 0 || height % 16 !== 0) return undefined;
  if (long > 3840 || long / short > 3) return undefined;
  if (pixels < 655_360 || pixels > 8_294_400) return undefined;
  return { width, height };
}

// Output tokens per image, as the image generation guide's calculator computes
// them: the long edge takes the quality's patch count, the short edge that
// count scaled by the aspect ratio and rounded half to even. The recorded
// gpt-image-2 calls at medium 1024x1024 billed exactly its 1756 tokens.
export function gptImageOutputTokens(
  patches: number,
  width: number,
  height: number
): number {
  const scaled = patches / (Math.max(width, height) / Math.min(width, height));
  const floor = Math.floor(scaled);
  const shortPatches =
    scaled - floor === 0.5 ? floor + (floor % 2) : Math.round(scaled);
  return Math.ceil((patches * shortPatches * (2e6 + width * height)) / 4e6);
}
