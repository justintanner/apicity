/**
 * Pick the canonical "green-path" HAR entry for an endpoint when several
 * recordings hit the same URL. Selection rule:
 *
 *   1. Manual override: if `override` is provided, prefer the candidate whose
 *      _recordingName ends with `/${override}` (suffix match on the slug).
 *   2. Naming convention: prefer entries whose _recordingName ends with
 *      `-hello`, `-basic`, or `-simple`. The project already uses these slugs
 *      for canonical happy-path tests (e.g. chat-hello, embeddings-hello).
 *   3. Smallest payload: shortest stringified body.
 *   4. Tie-break: alphabetical _recordingName.
 *
 * `candidates` are objects of shape:
 *   { recordingName: string, payload: unknown, payloadString: string }
 *
 * Returns the chosen candidate, or null when the array is empty.
 */

const GREEN_SUFFIXES = ["-hello", "-basic", "-simple"];

export function selectGreenPath(candidates, override) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (override) {
    const pinned = candidates.find((c) =>
      c.recordingName.endsWith(`/${override}`)
    );
    if (pinned) return pinned;
  }

  const conventional = candidates.filter((c) =>
    GREEN_SUFFIXES.some((suffix) => c.recordingName.endsWith(suffix))
  );
  const pool = conventional.length > 0 ? conventional : candidates;

  return [...pool].sort((a, b) => {
    const sizeDiff = a.payloadString.length - b.payloadString.length;
    if (sizeDiff !== 0) return sizeDiff;
    return a.recordingName.localeCompare(b.recordingName);
  })[0];
}
