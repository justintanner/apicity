/**
 * Shared parsing for the two directions of the recording-name mapping:
 * the `setupPolly*()` name a test asks for, and the directory slug a
 * `recording.har` actually lives under.
 *
 * `scripts/check-orphan-recordings.mjs` grew this logic first, to find
 * recordings no test references and references with no recording. The fal
 * credential-wiring guard (`tests/unit/recording-credential-hosts.test.ts`)
 * needs exactly the same join, in the same direction, to decide which test
 * call site replays which recording. Re-deriving the regexes there would mean
 * two copies of a parser that has to agree byte for byte with
 * `recordingExists()` in `tests/harness.ts` (ac-wt8fzl, REQ-021).
 *
 * `EXISTS_RE` — the `recordingExists(` scanner — deliberately stays in
 * `check-orphan-recordings.mjs`. It serves that script's reverse-direction job
 * only, and nothing else needs it.
 *
 * Consume `SETUP_RE` and `CONST_RE` with `String.prototype.matchAll` ONLY.
 * Both carry the `g` flag, and now that they are module-level objects shared
 * by two callers, a `while ((m = RE.exec(src)))` loop would mutate `lastIndex`
 * on the shared object and silently skip matches for whichever caller ran
 * second. `matchAll` clones the regex internally.
 */

/**
 * Matches any `setupPolly*(` call and captures its first argument.
 *
 * Newline-tolerant (`\s` matches `\n`), which is what resolves the wrapped
 * call sites whose recording name sits on the following line, and
 * variant-agnostic, so `setupPolly(`, `setupPollyIgnoringBody(`, and any
 * future `setupPolly*` variant are covered with no change here.
 *
 * The capture keeps its surrounding quotes and also matches non-literals, so
 * it is only half the parser — pass every capture through `resolveArg`.
 */
export const SETUP_RE = /setupPolly\w*\(\s*([^),]+?)\s*[),]/g;

/**
 * Matches a file-local `const`/`let` bound to a string literal.
 *
 * Test files routinely hoist a recording name into a constant and pass the
 * identifier to `setupPolly`, so resolving those bindings is required to read
 * the name at all.
 */
export const CONST_RE = /(?:const|let)\s+(\w+)\s*=\s*"([^"]+)"/g;

/**
 * Normalize a recording name to its on-disk form.
 *
 * Mirrors `recordingExists()` in `tests/harness.ts`, which replaces dots with
 * hyphens per path segment: `fal/gpt-image-1.5` is stored as
 * `fal/gpt-image-1-5`.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeName(name) {
  return name
    .split("/")
    .map((segment) => segment.replace(/\./g, "-"))
    .join("/");
}

/**
 * Resolve a captured `setupPolly` argument to its static recording name.
 *
 * Returns `null` for a computed or template argument, which the caller must
 * treat as an explicit failure rather than a skip — a name that cannot be read
 * is a recording the guard cannot check.
 *
 * @param {string} arg - raw capture from `SETUP_RE`, quotes included
 * @param {Map<string, string>} consts - file-local bindings from `CONST_RE`
 * @returns {string | null}
 */
export function resolveArg(arg, consts) {
  const trimmed = arg.trim();
  const literal = trimmed.match(/^"([^"]+)"$/) || trimmed.match(/^`([^`$]+)`$/);
  if (literal) return literal[1];
  if (consts.has(trimmed)) return consts.get(trimmed);
  return null; // computed / template name -- cannot statically resolve
}

/**
 * Convert a recordings-relative directory path to its canonical name.
 *
 * Polly appends a `_<digits>` namespace hash to each path segment on disk;
 * stripping it per segment recovers the name the test asked for.
 *
 * Takes an ALREADY-RELATIVE path and closes over nothing, unlike the
 * `check-orphan-recordings.mjs` original, which took an absolute directory and
 * closed over that script's module-level `recordingsDir`. Callers pass
 * `path.relative(recordingsRoot, path.dirname(harFile))`.
 *
 * @param {string} relativeDir - path relative to `tests/recordings`
 * @returns {string}
 */
export function dirToRecordingName(relativeDir) {
  return relativeDir
    .split(/[\\/]/)
    .map((segment) => segment.replace(/_\d+$/, ""))
    .join("/");
}
