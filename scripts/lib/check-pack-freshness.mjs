/**
 * Pure classification for the release-pack freshness check.
 *
 * This module does no I/O of any kind: it reads no files, spawns no processes
 * and resolves no paths against a real filesystem.
 * `scripts/check-pack-freshness.mjs` performs every process spawn and file read
 * and injects the results — the parsed `gc import status` document, the current
 * `main` commit, the changed-path list, and whether the pinned commit is
 * reachable — and this module decides every verdict.
 *
 * The defect this exists to catch: the city installs a pack from a commit and
 * keeps serving that snapshot forever. `gc import check` validates the install
 * against its own lock, so it exits 0 while the city runs a formula the
 * repository replaced months ago. Comparing the pin against `main` is the only
 * signal that catches it.
 */

/**
 * Three spellings of this pack are live at once, and only one of them appears
 * in `gc import status`:
 *
 * - `gc import status` reports the import as `pack:apicity-release`
 * - `/gc/pack.toml` declares the section as `[imports.apicity-release]`
 * - `gc import why` takes the bare `apicity-release`
 *
 * Matching the bare name here yields a permanent `import-missing` on a
 * perfectly healthy city, so this constant is pinned by the unit test.
 */
export const PACK_IMPORT_NAME = "pack:apicity-release";

/**
 * The repository paths whose divergence means the city serves different
 * behavior than this checkout describes. A change anywhere else in the
 * repository moves `main` without changing what the pack does, so it must not
 * produce a `stale-content` verdict.
 *
 * `formulas/` is load-bearing rather than decorative: `formulas` holds a
 * git-tracked symlink into `.beads/formulas/`, and `.beads/hooks/` holds five
 * tracked files. Only one file under `.beads/formulas/` is tracked — the
 * dozens of others present on a live rig are untracked local pack
 * materializations, invisible to `git diff`, so this watch set cannot
 * manufacture false `stale-content` verdicts out of unrelated pack churn.
 */
export const PACK_CONTENT_PATHS = Object.freeze([
  "pack.toml",
  ".beads/formulas/",
  ".beads/hooks/",
  "formulas/",
]);

export const PACK_FRESHNESS_VERDICT = Object.freeze({
  FRESH: "fresh",
  STALE_CONTENT: "stale-content",
  STALE_PIN: "stale-pin",
  PIN_UNREACHABLE: "pin-unreachable",
  HEAD_UNKNOWN: "head-unknown",
  IMPORT_MISSING: "import-missing",
  SKIPPED: "skipped",
});

/** The city config that declares the pin, and the section that carries it. */
export const PACK_CONFIG_PATH = "/gc/pack.toml";
export const PACK_CONFIG_SECTION = "[imports.apicity-release]";

/**
 * The half of the refresh that is a command, established by running every
 * candidate against the live stale city rather than copied from documentation.
 * Neither verb an operator would reach for first actually re-pins:
 *
 * - `gc import upgrade apicity-release` prints `Upgraded import` and exits 0
 *   while moving only `pin.fetched`. A `sha:` constraint pins exactly, so
 *   there is nothing to upgrade within it — the reassuring output is the trap.
 * - `gc import add /gc/apicity --name apicity-release` exits 1 with
 *   `import already exists`, with or without `--version`.
 *
 * What moves the pin is editing the declared `version` and reinstalling, which
 * is why the rendered message spells out the edit rather than only the command.
 */
export const REFRESH_COMMAND = "gc import install && gc reload";

/**
 * Registration is the one case where `gc import add` is the right verb: it
 * refuses an existing import, but this is the branch where there is none.
 */
export const REGISTER_COMMAND =
  "gc import add /gc/apicity --name apicity-release && gc import install && gc reload";

/** The operator-facing repair for a pin that must move. */
function refreshLines(headCommit) {
  return [
    `  Refresh it: set version = "sha:${headCommit}" under ${PACK_CONFIG_SECTION}`,
    `  in ${PACK_CONFIG_PATH}, then run:`,
    `    ${REFRESH_COMMAND}`,
    "  gc import upgrade exits 0 without moving a sha: pin, and gc import add",
    "  refuses an existing import. Neither one re-pins.",
  ];
}

/** Top-level repository entries a cache path can be re-anchored onto. */
const INSTALLED_PATH_ANCHORS = Object.freeze([
  ".beads",
  "formulas",
  "pack.toml",
]);

/**
 * Lift the one import entry named `name` out of a parsed `gc import status`
 * document. Tolerates both the documented `{ imports: [...] }` envelope and a
 * bare array, because the caller owns the parse and should not have to guess
 * which shape a future `gc` prints.
 */
export function selectImport(statusJson, name) {
  const entries = Array.isArray(statusJson)
    ? statusJson
    : Array.isArray(statusJson?.imports)
      ? statusJson.imports
      : [];

  for (const entry of entries) {
    if (entry && entry.name === name) {
      return entry;
    }
  }

  return null;
}

/**
 * The resolved commit the city actually installed from. `constraint` is
 * deliberately not consulted: it is what was asked for, and only `pin.commit`
 * records what was resolved.
 */
function pinnedCommitOf(entry) {
  const commit = entry?.pin?.commit;

  return typeof commit === "string" && commit.length > 0 ? commit : null;
}

/**
 * Map an installed pack file inside the city's content-addressed cache back
 * onto its repository-relative path, by re-anchoring on the earliest watched
 * top-level entry in the path. The cache layout is undocumented, so this only
 * ever runs behind the opt-in `--installed` flag.
 *
 * Earliest rather than latest: a cache path is a cache prefix followed by a
 * repository subtree, so the repository-relative path begins at the first
 * anchor. Anchoring on the last one turns
 * `<cache>/.beads/formulas/mol-apicity-release.formula.toml` into
 * `formulas/mol-apicity-release.formula.toml`, dropping a real directory —
 * which happens to resolve for this one file, because `formulas` holds a
 * symlink into `.beads/formulas/`, and would silently compare the wrong file
 * for any other.
 */
export function installedComparisonPath(installedPath) {
  if (typeof installedPath !== "string" || installedPath.length === 0) {
    return null;
  }

  const segments = installedPath.split("/").filter((segment) => segment !== "");

  for (let index = 0; index < segments.length; index += 1) {
    if (INSTALLED_PATH_ANCHORS.includes(segments[index])) {
      return segments.slice(index).join("/");
    }
  }

  return null;
}

/**
 * Map the collected facts onto one verdict.
 *
 * `pin-unreachable` is checked before commit equality on purpose: a pin this
 * repository cannot resolve makes every downstream comparison meaningless, and
 * reporting `fresh` from a comparison that could not be performed is the single
 * most expensive way this check could be wrong.
 *
 * `head-unknown` is checked before both of them for the same reason and one
 * more: an unresolvable `main` is equally unperformable, and it is the one
 * input every later branch interpolates into the repair line it prints. Decided
 * here, no other branch can ever render a commit it does not have.
 */
export function classifyPackFreshness({
  gcAvailable,
  entry,
  headCommit,
  changedPaths,
  pinReachable,
}) {
  const paths = Array.isArray(changedPaths) ? changedPaths : [];
  const pinnedCommit = pinnedCommitOf(entry);
  const head =
    typeof headCommit === "string" && headCommit.length > 0 ? headCommit : null;
  const facts = { pinnedCommit, headCommit: head, changedPaths: paths };

  if (gcAvailable === false) {
    return {
      ...facts,
      verdict: PACK_FRESHNESS_VERDICT.SKIPPED,
      exitCode: 0,
      lines: [
        "skipped: the gc CLI is not on PATH, so pack freshness was NOT verified.",
        "  This is not a pass. Nothing here says the city is serving current pack",
        "  content; re-run where Gas City is installed before believing it is.",
      ],
    };
  }

  if (pinnedCommit === null) {
    return {
      ...facts,
      verdict: PACK_FRESHNESS_VERDICT.IMPORT_MISSING,
      exitCode: 1,
      lines: [
        `import-missing: gc import status reports no ${PACK_IMPORT_NAME} entry`,
        "  carrying a resolved pin commit. The city is not importing this",
        "  repository's release pack, so nothing it runs comes from here.",
        "  Register it with:",
        `    ${REGISTER_COMMAND}`,
      ],
    };
  }

  if (head === null) {
    return {
      ...facts,
      verdict: PACK_FRESHNESS_VERDICT.HEAD_UNKNOWN,
      exitCode: 1,
      lines: [
        `head-unknown: ${PACK_IMPORT_NAME} is pinned at ${pinnedCommit}, but main`,
        "  could not be resolved in this checkout, so freshness could not be",
        "  decided. A --single-branch clone, a release worktree cut from stable or",
        "  a shallow CI checkout can carry the pinned history with no local main.",
        "  Fetch main here, or re-run this check where it resolves.",
        "  No repair line follows on purpose: re-pinning onto a commit this",
        "  checkout cannot name would be a guess, not a fix.",
      ],
    };
  }

  if (pinReachable === false) {
    return {
      ...facts,
      verdict: PACK_FRESHNESS_VERDICT.PIN_UNREACHABLE,
      exitCode: 1,
      lines: [
        `pin-unreachable: ${PACK_IMPORT_NAME} is pinned at ${pinnedCommit}, which is`,
        "  not in this repository's local history, so freshness cannot be decided.",
        "  Fetch the missing history, or re-pin onto a commit that exists.",
        ...refreshLines(head),
      ],
    };
  }

  if (pinnedCommit === head) {
    return {
      ...facts,
      verdict: PACK_FRESHNESS_VERDICT.FRESH,
      exitCode: 0,
      lines: [
        `fresh: ${PACK_IMPORT_NAME} is pinned at ${pinnedCommit}, which is main.`,
        "  This verifies the pin, not the installed bytes. Run gc import check for",
        "  the installed-copy half: pin equality and that check together imply the",
        "  city is serving current pack content, and neither one alone does.",
      ],
    };
  }

  if (paths.length > 0) {
    return {
      ...facts,
      verdict: PACK_FRESHNESS_VERDICT.STALE_CONTENT,
      exitCode: 1,
      lines: [
        `stale-content: ${PACK_IMPORT_NAME} is pinned at ${pinnedCommit},`,
        `  main is at ${head}, and watched pack content differs across that range.`,
        "  The city is serving pack behavior this repository has already replaced.",
        "  Changed pack paths:",
        ...paths.map((path) => `    ${path}`),
        ...refreshLines(head),
      ],
    };
  }

  return {
    ...facts,
    verdict: PACK_FRESHNESS_VERDICT.STALE_PIN,
    exitCode: 1,
    lines: [
      `stale-pin: ${PACK_IMPORT_NAME} is pinned at ${pinnedCommit} and main is at`,
      `  ${head}, but no watched pack path changed across that range, so the served`,
      "  pack content is unchanged and no behavior is currently withheld.",
      "  Re-pin anyway, so that the next pack change is not silently withheld.",
      ...refreshLines(head),
    ],
  };
}

export function renderPackFreshnessMessage(result) {
  return result.lines.join("\n");
}
