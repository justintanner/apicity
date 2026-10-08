/**
 * Secrets in recorded HARs: request headers (ac-1zmydw) and fal checkpoints
 * (ac-yv3xum).
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
 *
 * A fal response can also carry a `checkpoint` object: a `.safetensors` URL and
 * a `signature` fal issues for it, valid for a day. `redactFalCheckpoints` is
 * the rule the harness applies to a parsed response body before persisting it,
 * and `findLiveFalCheckpoints` reports what that rule would still change in a
 * committed recording. `scripts/check-recording-secrets.mjs`, part of
 * `pnpm run lint:recordings`, runs both finders over every recording.
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

/**
 * The value `redactFalCheckpoints` writes in place of a fal checkpoint's
 * `signature`.
 */
export const FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER = "***";

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * `url` without its query string, keeping any fragment. A `?` that first
 * appears inside the fragment starts no query.
 *
 * @param {string} url
 * @returns {string}
 */
function withoutQuery(url) {
  const query = url.indexOf("?");
  const fragment = url.indexOf("#");
  if (query === -1 || (fragment !== -1 && fragment < query)) return url;
  return url.slice(0, query) + (fragment === -1 ? "" : url.slice(fragment));
}

/**
 * The fields of one checkpoint that still carry signed material: a string
 * `signature` other than the placeholder, and a string `url` with a query. fal
 * signs the separate `signature` field, and no recorded checkpoint URL has
 * carried a query, so the `url` rule is defensive.
 *
 * @param {Record<string, unknown>} checkpoint
 * @returns {Array<"signature" | "url">}
 */
function liveCheckpointFields(checkpoint) {
  /** @type {Array<"signature" | "url">} */
  const fields = [];
  const { signature, url } = checkpoint;
  if (
    typeof signature === "string" &&
    signature !== FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER
  ) {
    fields.push("signature");
  }
  if (typeof url === "string" && withoutQuery(url) !== url) {
    fields.push("url");
  }
  return fields;
}

/**
 * A parsed JSON response body with every fal checkpoint's signed material
 * redacted. A checkpoint is a plain object stored under a key named exactly
 * `checkpoint`, at any depth. Its `signature` becomes the placeholder and its
 * `url` loses its query; its other fields, and the order of every key, stay as
 * recorded. Nothing outside a checkpoint is touched: a kimicoding response's
 * thinking blocks carry a `signature` too, which the next recorded request
 * echoes, so redacting it would break that recording's replay. `redacted` is
 * true only when a value changed.
 *
 * @param {unknown} value a parsed JSON body
 * @returns {{ value: unknown; redacted: boolean }}
 */
export function redactFalCheckpoints(value) {
  if (Array.isArray(value)) {
    let redacted = false;
    const items = value.map((item) => {
      const result = redactFalCheckpoints(item);
      redacted ||= result.redacted;
      return result.value;
    });
    return { value: items, redacted };
  }
  if (!isPlainObject(value)) return { value, redacted: false };

  let redacted = false;
  const entries = Object.entries(value).map(([key, item]) => {
    const result = redactFalCheckpoints(item);
    redacted ||= result.redacted;
    if (key !== "checkpoint" || !isPlainObject(result.value)) {
      return [key, result.value];
    }

    const checkpoint = { ...result.value };
    const live = liveCheckpointFields(checkpoint);
    if (live.includes("signature")) {
      checkpoint.signature = FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER;
    }
    if (live.includes("url")) {
      checkpoint.url = withoutQuery(/** @type {string} */ (checkpoint.url));
    }
    redacted ||= live.length > 0;
    return [key, checkpoint];
  });
  // fromEntries defines every key as an own property, so a body key named
  // `__proto__` stays data rather than becoming the copy's prototype.
  return { value: Object.fromEntries(entries), redacted };
}

/**
 * One fal checkpoint field in a recorded response body that still carries
 * signed material. As for a request secret, the stored value is left out.
 *
 * @typedef {object} LiveFalCheckpoint
 * @property {number} entryIndex index into the HAR's `log.entries`
 * @property {string} path where the checkpoint sits in that entry's response
 *   body, as a JSONPath such as `$.checkpoint`
 * @property {"signature" | "url"} field `signature` when it is not the
 *   placeholder, `url` when it carries a query
 */

/**
 * @param {string} key
 * @returns {string}
 */
function jsonPathMember(key) {
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `.${key}`
    : `[${JSON.stringify(key)}]`;
}

/**
 * Calls `visit` for every fal checkpoint in a parsed JSON value, by the rule
 * `redactFalCheckpoints` applies, with the checkpoint's JSONPath.
 *
 * @param {unknown} value
 * @param {string} path
 * @param {(checkpoint: Record<string, unknown>, path: string) => void} visit
 */
function visitFalCheckpoints(value, path, visit) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      visitFalCheckpoints(item, `${path}[${index}]`, visit)
    );
    return;
  }
  if (!isPlainObject(value)) return;

  for (const [key, item] of Object.entries(value)) {
    const itemPath = `${path}${jsonPathMember(key)}`;
    if (key === "checkpoint" && isPlainObject(item)) visit(item, itemPath);
    visitFalCheckpoints(item, itemPath, visit);
  }
}

/**
 * Every fal checkpoint field that `redactFalCheckpoints` would still change in
 * one parsed HAR's response bodies. Each body is JSON text inside its entry's
 * `content.text`, which is why a grep over the HAR file cannot see one; a body
 * that does not parse as JSON holds nothing this rule reads, here or at
 * persist time. Request bodies are not read: the rule is the harness's
 * response-side one.
 *
 * @param {unknown} har a parsed HAR document (`{ log: { entries } }`)
 * @returns {LiveFalCheckpoint[]}
 */
export function findLiveFalCheckpoints(har) {
  /** @type {LiveFalCheckpoint[]} */
  const findings = [];
  const entries = har?.log?.entries;
  if (!Array.isArray(entries)) return findings;

  entries.forEach((entry, entryIndex) => {
    const text = entry?.response?.content?.text;
    if (typeof text !== "string") return;

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return;
    }
    visitFalCheckpoints(body, "$", (checkpoint, path) => {
      for (const field of liveCheckpointFields(checkpoint)) {
        findings.push({ entryIndex, path, field });
      }
    });
  });

  return findings;
}
