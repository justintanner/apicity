// Coercion helpers used by per-provider pricing entries to read upstream
// payload values. Promoted from extract/messages.ts and extract/kie.ts so
// pricing entries can stand alone without depending on the extract module.

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
