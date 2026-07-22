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
