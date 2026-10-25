// AUTO-GENERATED from packages/provider/har/src/match-har-to-endpoint.mjs; do not edit.
// Edit the canonical file and run `pnpm run gen:shared`.
/** @typedef {{provider: string, method: string, fullUrl: string, dotPath: string}} EndpointRow */
/** @typedef {{request?: {url?: string, method?: string}}} RequestEntry */
/**
 * Match a HAR request entry to a row in scripts/endpoint-docs.tsv.
 *
 * Three passes, in order — first match wins:
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
 *
 *   3. Spanning: full URL again, but a placeholder listed for the row's
 *      provider in SEGMENT_SPANNING_PLACEHOLDERS covers one or more whole
 *      segments. fal endpoint ids are `owner/model[/variant]`, so only this
 *      pass matches `POST queue.fal.run/fal-ai/flux/dev` to v1.queue.submit
 *      (`https://queue.fal.run/{endpoint_id}`). It runs after the lenient
 *      pass, so a fal model row keeps a queue submit to its own path.
 */

/**
 * Placeholders whose values span path segments, by provider. The fal queue
 * rows interpolate the endpoint id unencoded (`fal-ai/flux/dev`).
 * @type {Record<string, string[]>}
 */
const SEGMENT_SPANNING_PLACEHOLDERS = { fal: ["endpoint_id"] };

/** @param {string} fullUrl @param {string[]} [spanning] @returns {RegExp} */
export function compileTsvUrlPattern(fullUrl, spanning = []) {
  const stripped = stripQueryMarker(fullUrl).split("?")[0];
  const escaped = escapeRegExp(stripped).replace(
    /\\\{([^}]+)\\\}/g,
    (_, name) => (spanning.includes(name) ? "[^/]+(?:/[^/]+)*" : "[^/]+")
  );
  return new RegExp(`^${escaped}$`);
}

/** @param {RequestEntry} entry @param {EndpointRow} tsvRow @returns {boolean} */
export function matchHarEntryStrict(entry, tsvRow) {
  if (!entry?.request?.url || !entry?.request?.method) return false;
  if (entry.request.method.toUpperCase() !== tsvRow.method.toUpperCase()) {
    return false;
  }
  return compileTsvUrlPattern(tsvRow.fullUrl).test(
    stripQueryMarker(entry.request.url).split("?")[0]
  );
}

/** @param {RequestEntry} entry @param {EndpointRow} tsvRow @returns {boolean} */
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
 * Full-URL match in which the row provider's segment-spanning placeholders
 * cover one or more whole segments. False for a row without one, which only
 * the strict match can claim.
 */
/** @param {RequestEntry} entry @param {EndpointRow} tsvRow @returns {boolean} */
export function matchHarEntrySpanning(entry, tsvRow) {
  if (!entry?.request?.url || !entry?.request?.method) return false;
  if (entry.request.method.toUpperCase() !== tsvRow.method.toUpperCase()) {
    return false;
  }
  const spanning = (
    SEGMENT_SPANNING_PLACEHOLDERS[tsvRow.provider] ?? []
  ).filter((name) => tsvRow.fullUrl.includes(`{${name}}`));
  if (spanning.length === 0) return false;
  return compileTsvUrlPattern(tsvRow.fullUrl, spanning).test(
    stripQueryMarker(entry.request.url).split("?")[0]
  );
}

/**
 * Find the best-matching TSV row for a HAR entry. Strict pass over all
 * rows first; if nothing matches, lenient pass scoped to `provider`,
 * picking the row with the longest placeholder-stripped path; then the
 * spanning pass over all rows.
 */
/** @template {EndpointRow} T
 * @param {RequestEntry} entry @param {T[]} tsvRows
 * @param {{provider?: string | null}} options @returns {T | null} */
export function findMatchingRow(entry, tsvRows, { provider } = {}) {
  for (const row of tsvRows) {
    if (matchHarEntryStrict(entry, row)) return row;
  }
  if (provider) {
    let best = null;
    let bestLen = -1;
    for (const row of tsvRows) {
      if (row.provider !== provider) continue;
      if (!matchHarEntryLenient(entry, row)) continue;
      const stripped = pathSegments(row.fullUrl).filter(
        (s) => !isPlaceholder(s)
      );
      if (stripped.length > bestLen) {
        best = row;
        bestLen = stripped.length;
      }
    }
    if (best) return best;
  }
  for (const row of tsvRows) {
    if (matchHarEntrySpanning(entry, row)) return row;
  }
  return null;
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
