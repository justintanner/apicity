import path from "node:path";

/**
 * Match the first argument to every `setupPolly*` helper variant, mirroring
 * the static recording-reference scan in `check-orphan-recordings.mjs`.
 */
export const SETUP_RE = /setupPolly\w*\(\s*([^),]+?)\s*[),]/g;

/**
 * Match simple string-valued `const` and `let` declarations, mirroring the
 * static names that the recording-reference scanner can resolve.
 */
export const CONST_RE = /(?:const|let)\s+(\w+)\s*=\s*"([^"]+)"/g;

/**
 * Normalize dots to hyphens within each name segment, mirroring
 * `recordingExists()` in `tests/harness.ts`.
 */
export function normalizeName(name) {
  return name
    .split("/")
    .map((segment) => segment.replace(/\./g, "-"))
    .join("/");
}

/**
 * Resolve a literal or statically declared recording-name argument, mirroring
 * the static argument handling in `check-orphan-recordings.mjs`.
 */
export function resolveArg(arg, consts) {
  const trimmed = arg.trim();
  const literal = trimmed.match(/^"([^"]+)"$/) || trimmed.match(/^`([^`$]+)`$/);
  if (literal) return literal[1];
  if (consts.has(trimmed)) return consts.get(trimmed);
  return null; // computed / template name -- cannot statically resolve
}

/**
 * Convert a recordings-relative directory to its canonical recording name,
 * mirroring the per-segment suffix lookup in `recordingExists()`.
 */
export function dirToRecordingName(relativeDir) {
  return relativeDir
    .split(path.sep)
    .map((segment) => segment.replace(/_\d+$/, ""))
    .join("/");
}
