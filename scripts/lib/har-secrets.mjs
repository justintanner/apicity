/**
 * Request-side secrets in recorded HARs (ac-1zmydw).
 *
 * Before Polly persists a recording, `redactPersistedHarSecrets` in
 * `tests/harness.ts` overwrites the value of every request header named in
 * `PERSISTED_REQUEST_HEADER_PLACEHOLDERS` with that header's placeholder. The
 * table lives here rather than in the harness so that a node script can read it
 * without loading Polly. The harness imports it, applies it and re-exports it,
 * so the names and placeholders have one definition, not two.
 *
 * `findUnredactedRequestSecrets` is the corpus check built on that table. A
 * committed HAR whose request carries one of those headers with any other value
 * was edited by hand or written by a regressed harness, and either way may hold
 * a live key bound for a public repository.
 * `tests/unit/har-request-secrets.test.ts` runs it over every recording.
 */

/**
 * Request headers the harness redacts at persist time, keyed by lower-case
 * name, each mapped to the exact value it writes in place of the original.
 */
export const PERSISTED_REQUEST_HEADER_PLACEHOLDERS = Object.freeze({
  authorization: "Bearer ***",
  "x-api-key": "***",
  "xi-api-key": "***",
  "x-goog-api-key": "***",
  "x-amz-security-token": "***",
});

/**
 * Headers the corpus check holds to a placeholder although the harness does
 * not redact them. ac-1zmydw names `api-key` among the provider-key headers a
 * recording must never carry raw. Adding it to the table above would change
 * what the harness redacts, which that bead puts out of scope, so it is kept
 * here instead. No committed recording carries one, so the first that does
 * fails the check until the harness is taught to redact it.
 */
export const GUARD_ONLY_REQUEST_HEADER_PLACEHOLDERS = Object.freeze({
  "api-key": "***",
});

/**
 * @param {Readonly<Record<string, string>>} table
 * @param {unknown} name
 * @returns {string | undefined}
 */
function placeholderIn(table, name) {
  if (typeof name !== "string") return undefined;
  const key = name.toLowerCase();
  // An own-property check, so a header named `constructor` or `toString`
  // never resolves through Object.prototype.
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * The placeholder the harness writes for one request header, matched
 * case-insensitively, or `undefined` when the harness keeps the header's value
 * as recorded.
 *
 * @param {string | undefined} name
 * @returns {string | undefined}
 */
export function persistedRequestHeaderPlaceholder(name) {
  return placeholderIn(PERSISTED_REQUEST_HEADER_PLACEHOLDERS, name);
}

/**
 * One request header that should hold a placeholder and does not. The recorded
 * value is deliberately left out, so no report can copy a live key into a log.
 *
 * @typedef {object} UnredactedRequestSecret
 * @property {number} entryIndex index into the HAR's `log.entries`
 * @property {number} headerIndex index into that entry's `request.headers`
 * @property {string} name the header name as recorded
 * @property {string} placeholder the only value a committed recording may hold
 */

/**
 * Every request header in one parsed HAR that is named in either table above,
 * in any letter case, and does not hold exactly that name's placeholder.
 *
 * @param {unknown} har a parsed HAR document (`{ log: { entries } }`)
 * @returns {UnredactedRequestSecret[]}
 */
export function findUnredactedRequestSecrets(har) {
  /** @type {UnredactedRequestSecret[]} */
  const findings = [];
  const entries = har?.log?.entries;
  if (!Array.isArray(entries)) return findings;

  entries.forEach((entry, entryIndex) => {
    const headers = entry?.request?.headers;
    if (!Array.isArray(headers)) return;

    headers.forEach((header, headerIndex) => {
      const name = header?.name;
      const placeholder =
        placeholderIn(PERSISTED_REQUEST_HEADER_PLACEHOLDERS, name) ??
        placeholderIn(GUARD_ONLY_REQUEST_HEADER_PLACEHOLDERS, name);
      if (placeholder === undefined || header.value === placeholder) return;
      findings.push({ entryIndex, headerIndex, name, placeholder });
    });
  });

  return findings;
}
