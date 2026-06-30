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
 *      at runtime). The lenient rule: drop a leading API version segment and
 *      treat `{paramName}` placeholders in the TSV path as optional
 *      single-segment wildcards; pass if the resulting TSV pattern matches a
 *      contiguous window of the HAR path's segments. When several provider
 *      rows match leniently, the row with the longest placeholder-stripped
 *      path wins (most specific).
 */

export function compileTsvUrlPattern(fullUrl) {
  const stripped = stripQueryMarker(fullUrl).split("?")[0];
  const escaped = escapeRegExp(stripped).replace(/\\\{[^}]+\\\}/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

export function matchHarEntryStrict(entry, tsvRow) {
  if (!entry?.request?.url || !entry?.request?.method) return false;
  if (entry.request.method.toUpperCase() !== tsvRow.method.toUpperCase()) {
    return false;
  }
  return compileTsvUrlPattern(tsvRow.fullUrl).test(
    stripQueryMarker(entry.request.url).split("?")[0]
  );
}

export function matchHarEntryLenient(entry, tsvRow) {
  if (!entry?.request?.url || !entry?.request?.method) return false;
  if (entry.request.method.toUpperCase() !== tsvRow.method.toUpperCase()) {
    return false;
  }
  const harSegs = comparablePathSegments(entry.request.url);
  const tsvSegs = comparablePathSegments(tsvRow.fullUrl);
  if (!tsvSegs.some((s) => !isPlaceholder(s))) return harSegs.length === 0;
  return matchesContiguousSegmentPattern(tsvSegs, harSegs);
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
  const path = stripQueryMarker(stripHost(url)).split("?")[0].split("#")[0];
  return path.split("/").filter((s) => s.length > 0);
}

function comparablePathSegments(url) {
  const segs = pathSegments(url);
  if (segs.length > 0 && /^v\d+(?:\.\d+)?$/i.test(segs[0])) {
    return segs.slice(1);
  }
  return segs;
}

function isPlaceholder(seg) {
  return seg.startsWith("{") && seg.endsWith("}");
}

function matchesContiguousSegmentPattern(pattern, haystack) {
  if (pattern.length === 0) return true;
  const literalCount = pattern.filter((s) => !isPlaceholder(s)).length;
  if (literalCount > haystack.length) return false;
  for (let start = 0; start <= haystack.length; start++) {
    let indexes = new Set([start]);
    for (const segment of pattern) {
      const nextIndexes = new Set();
      for (const index of indexes) {
        if (isPlaceholder(segment)) {
          nextIndexes.add(index);
          if (index < haystack.length) nextIndexes.add(index + 1);
        } else if (haystack[index] === segment) {
          nextIndexes.add(index + 1);
        }
      }
      indexes = nextIndexes;
      if (indexes.size === 0) break;
    }
    if (indexes.size > 0) return true;
  }
  return false;
}

function stripHost(url) {
  if (url.startsWith("/")) return url;
  const m = url.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  return m ? (m[1] ?? "/") : url;
}

function stripQueryMarker(url) {
  return url.replace(/\{query\}/g, "");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
