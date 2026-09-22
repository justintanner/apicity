import { lstatSync, type Stats } from "node:fs";

/**
 * The one-line helpers several modules used to restate (review advisory A-3,
 * landed by ac-yrwwpi). Nothing here imports another module of this package,
 * so any module may import it without a cycle.
 *
 * Two same-named neighbours stay where they are on purpose. `errors.ts` keeps
 * its own message helper because that module must remain dependency-free so
 * every command can raise a classified error, and `one-password.ts` keeps its
 * own because it prefers a subprocess's `stderr` over `err.message` — the
 * text that makes a 1Password failure diagnosable.
 */

/** The message of whatever was thrown, for a hint or a wrapped error. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** A plain object: not `null`, not an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * `lstatSync`, answering `undefined` for a path that is missing *or*
 * unreadable — any error at all, not only "no entry".
 *
 * `skill.ts` and `doctor.ts` used to carry one copy each with different
 * bodies: the skill's swallowed every error, the doctor's passed
 * `throwIfNoEntry: false`, which suppresses `ENOENT` alone and still throws
 * on `ENOTDIR` (a path component that is a file) or `EACCES`. `doctor` is a
 * report that always exits 0 and must not crash on a path it can simply
 * report as absent, so the swallowing body is the one that survives.
 */
export function lstat(path: string): Stats | undefined {
  try {
    return lstatSync(path);
  } catch {
    return undefined;
  }
}
