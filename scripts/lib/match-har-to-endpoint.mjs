/**
 * Match a HAR request entry to a row in scripts/endpoint-docs.tsv.
 *
 * Two passes, in order — first match wins:
 *
 *   1. Strict: full URL (host + path) must match exactly. `{paramName}` in
 *      the TSV `fullUrl` becomes `[^/]+`. This handles concrete URLs that
 *      filled in path params (e.g. `/v1/files/file_abc123`).
 *
 *   2. Lenient: provider-scoped, path-only, segment subsequence match.
 *      Some providers route the same factory function through multiple host
 *      shapes (fal: `api.fal.ai/v1/<model>` in the TSV vs `fal.run/<model>`
 *      at runtime) or expose overloaded paths (openai chat completions:
 *      `/v1/chat/completions` and `/v1/chat/completions/{id}` share one
 *      function). The lenient rule: drop `{paramName}` placeholders from the
 *      TSV path; pass if the resulting segments form a contiguous
 *      subsequence of the HAR path's segments, or vice versa. When several
 *      provider rows match leniently, the row with the longest
 *      placeholder-stripped path wins (most specific).
 */

export function compileTsvUrlPattern(fullUrl) {
  const stripped = fullUrl.split("?")[0];
  const escaped = escapeRegExp(stripped).replace(/\\\{[^}]+\\\}/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

export function matchHarEntryStrict(entry, tsvRow) {
  if (!entry?.request?.url || !entry?.request?.method) return false;
  if (entry.request.method.toUpperCase() !== tsvRow.method.toUpperCase()) {
    return false;
  }
  return compileTsvUrlPattern(tsvRow.fullUrl).test(
    entry.request.url.split("?")[0]
  );
}

export function matchHarEntryLenient(entry, tsvRow) {
  if (!entry?.request?.url || !entry?.request?.method) return false;
  if (entry.request.method.toUpperCase() !== tsvRow.method.toUpperCase()) {
    return false;
  }
  const harSegs = pathSegments(entry.request.url);
  const tsvSegs = pathSegments(tsvRow.fullUrl).filter((s) => !isPlaceholder(s));
  if (tsvSegs.length === 0) return harSegs.length === 0;
  return (
    isContiguousSubsequence(tsvSegs, harSegs) ||
    isContiguousSubsequence(harSegs, tsvSegs)
  );
}

/**
 * Find the best-matching TSV row for a HAR entry. Strict pass over all
 * rows first; if nothing matches, lenient pass scoped to `provider`,
 * picking the row with the longest placeholder-stripped path.
 */
export function findMatchingRow(entry, tsvRows, { provider } = {}) {
  for (const row of tsvRows) {
    if (matchHarEntryStrict(entry, row)) return row;
  }
  if (!provider) return null;
  let best = null;
  let bestLen = -1;
  for (const row of tsvRows) {
    if (row.provider !== provider) continue;
    if (!matchHarEntryLenient(entry, row)) continue;
    const stripped = pathSegments(row.fullUrl).filter((s) => !isPlaceholder(s));
    if (stripped.length > bestLen) {
      best = row;
      bestLen = stripped.length;
    }
  }
  return best;
}

function pathSegments(url) {
  const path = stripHost(url).split("?")[0].split("#")[0];
  return path.split("/").filter((s) => s.length > 0);
}

function isPlaceholder(seg) {
  return seg.startsWith("{") && seg.endsWith("}");
}

function isContiguousSubsequence(needle, haystack) {
  if (needle.length === 0) return true;
  if (needle.length > haystack.length) return false;
  outer: for (
    let start = 0;
    start <= haystack.length - needle.length;
    start++
  ) {
    for (let i = 0; i < needle.length; i++) {
      if (haystack[start + i] !== needle[i]) continue outer;
    }
    return true;
  }
  return false;
}

function stripHost(url) {
  if (url.startsWith("/")) return url;
  const m = url.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  return m ? (m[1] ?? "/") : url;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
