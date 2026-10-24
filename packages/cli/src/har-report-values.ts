/** Small deterministic operations shared by the report's independent analyses. */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function compare(
  a: string | number | null,
  b: string | number | null
): number {
  return a === b ? 0 : a === null ? -1 : b === null ? 1 : a < b ? -1 : 1;
}
export function sanitize(value: unknown): unknown {
  if (typeof value === "string" && value.length > 256)
    return `${value.slice(0, 60)}… <truncated ${value.length} chars>`;
  if (Array.isArray(value)) return value.map(sanitize);
  if (isObject(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sanitize(value[k])])
    );
  return value;
}
export function canonical(value: unknown): string {
  const sorted = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sorted)
      : isObject(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, sorted(v[k])])
          )
        : v;
  return JSON.stringify(sorted(value)) ?? "null";
}
export function normalizeMessage(message: string): string {
  const s = message
    .replace(/\s+/g, " ")
    .trim()
    .replace(/https?:\/\/[^\s"'<>]+/g, "<url>")
    .replace(
      /\b[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\b/gi,
      "<id>"
    )
    .replace(/\b[\da-f]{16,}\b/gi, "<id>")
    .replace(/[A-Za-z0-9_-]{8,}/g, (s) =>
      /[A-Za-z]/.test(s) && /\d/.test(s) ? "<id>" : s
    )
    .replace(/\d+/g, "<n>");
  return s.length > 300 ? s.slice(0, 299) + "…" : s;
}
export function maskedUrl(url: string): { host: string; path: string } {
  try {
    const u = new URL(url);
    return {
      host: u.host.toLowerCase(),
      path: u.pathname
        .split("/")
        .map((s) =>
          /^\d+$/.test(s)
            ? "<n>"
            : /^[\da-f]{16,}$/i.test(s) ||
                /^[\da-f]{8}-[\da-f-]{27}$/i.test(s) ||
                (/^[A-Za-z0-9_-]{8,}$/.test(s) &&
                  /[A-Za-z]/.test(s) &&
                  /\d/.test(s))
              ? "<id>"
              : s
        )
        .join("/"),
    };
  } catch {
    return { host: "", path: normalizeMessage(url.split("?")[0]) };
  }
}
export function timestamp(value: unknown): string | null {
  const n = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
}
export function placeholder(value: unknown): boolean {
  return (
    (isObject(value) &&
      Object.keys(value).length === 1 &&
      "_apicity_placeholder" in value) ||
    (typeof value === "string" &&
      /^<inline (?:.*data URL|base64 data;)/.test(value))
  );
}
export function jsonObject(text: unknown): Record<string, unknown> | null {
  try {
    const v: unknown = typeof text === "string" ? JSON.parse(text) : null;
    return isObject(v) && !placeholder(v) ? v : null;
  } catch {
    return null;
  }
}
export function valueList(values: unknown[]) {
  const counts = new Map<string, { value: unknown; count: number }>();
  for (const value of values) {
    const key = canonical(value);
    const row = counts.get(key) ?? { value: sanitize(value), count: 0 };
    row.count++;
    counts.set(key, row);
  }
  const rows = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || compare(a[0], b[0]))
    .map(([, v]) => v);
  return {
    values: rows.slice(0, 20),
    otherCount: rows.slice(20).reduce((n, r) => n + r.count, 0),
  };
}
export function shape(value: unknown): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  const add = (p: string, v: unknown) => {
    const types = result.get(p) ?? new Set<string>();
    types.add(v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
    result.set(p, types);
  };
  if (isObject(value))
    for (const [key, v] of Object.entries(value)) {
      add(key, v);
      if (isObject(v))
        for (const [k, child] of Object.entries(v)) add(`${key}.${k}`, child);
      if (Array.isArray(v))
        for (const item of v)
          if (isObject(item))
            for (const [k, child] of Object.entries(item))
              add(`${key}[].${k}`, child);
    }
  return result;
}
export function shapeUnion(values: unknown[]) {
  const result = new Map<string, { types: Set<string>; count: number }>();
  for (const value of values)
    for (const [path, types] of shape(value)) {
      const row = result.get(path) ?? { types: new Set<string>(), count: 0 };
      row.count++;
      for (const t of types) row.types.add(t);
      result.set(path, row);
    }
  return result;
}
export function atPath(value: unknown, path: (string | number)[]): unknown {
  for (const key of path)
    value =
      isObject(value) || Array.isArray(value)
        ? (value as Record<string | number, unknown>)[key]
        : undefined;
  return value;
}
export function pathName(path: (string | number)[]): string {
  return path.reduce<string>(
    (s, k) => (typeof k === "number" ? s + "[]" : s ? `${s}.${k}` : k),
    ""
  );
}
export const availability = (reason: string | null) => ({
  available: reason === null,
  reason,
});
