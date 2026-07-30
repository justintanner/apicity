/**
 * Pure rendering for the Apicity GitHub release notes.
 *
 * This module holds every decision that turns a release window into changelog
 * markdown, and nothing that reads the world: no `fs`, no `child_process`, no
 * `Date`. That is what makes the output reproducible for the same input
 * (REQ-011) and unit-testable without a git checkout or a live bead store.
 *
 * The generator used to live as a `node <<'NODE'` heredoc inside
 * `.beads/formulas/mol-apicity-release.formula.toml`, where it derived
 * `New`/`Updated` from the beads closed in the release window and only fell
 * back to commits when that set was empty. In this rig the closed-bead window
 * is never empty and is dominated by Gas City workflow beads, so the v0.8.4
 * notes came out as ~400 unpublishable lines ("Implement owned work",
 * "Prepare item worktree", ...). The precedence is now inverted: the release
 * commit range is the only source of `New`/`Updated` by default (REQ-001), and
 * beads are an opt-in enrichment pass that can never contribute a Gas City line
 * (REQ-006).
 *
 * All impure work — git, `bd`, package.json reads, the CLI exit contract —
 * lives in `scripts/release-notes.mjs`.
 */

/** Trailing bead-id suffix, e.g. " (ac-8j6lex)" or " (ac-h7kvm.23.3)". */
const BEAD_SUFFIX = /\s*\(ac-[0-9a-z.]+\)\s*$/;

/** Bead metadata keys that mark a bead as Gas City workflow machinery. */
const GAS_CITY_METADATA_KEYS = ["gc.step_ref", "gc.kind", "gc.root_bead_id"];

export function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip a conventional-commit prefix ("feat(openai): " -> "openai: ") so the
// line reads as a plain, user-facing description with no internal tags.
export function humanize(text) {
  const value = normalize(text);
  const match = /^(\w+)(?:\(([^)]*)\))?!?:\s*(.*)$/.exec(value);
  if (!match || !match[3]) return value;
  const scope = match[2] ? `${match[2]}: ` : "";
  return normalize(`${scope}${match[3]}`);
}

export function conventionalType(text) {
  const match = /^(\w+)(?:\([^)]*\))?!?:/.exec(normalize(text));
  return match ? match[1].toLowerCase() : "";
}

/**
 * Remove a trailing bead-id suffix (REQ-003). The `ac-` grammar is this rig's
 * own, dotted ids included; a generic `[a-z]+-[0-9a-z.]+` would eat legitimate
 * parenthesised text.
 */
export function stripBeadSuffix(text) {
  return normalize(String(text || "").replace(BEAD_SUFFIX, ""));
}

/**
 * The single rendering path for every emitted line, so REQ-003 and REQ-004
 * hold by construction no matter which source produced the text.
 */
export function renderLine(subject) {
  return stripBeadSuffix(humanize(subject));
}

/**
 * REQ-002's three release-commit forms: `chore(release):`, `fix(release):`, and
 * a bare `@apicity/* → <version>`.
 *
 * The second alternative anchors on start-of-subject-or-whitespace rather than
 * `\b`. `@` is a non-word character, so `\b@apicity` asserts a transition that
 * only exists when the *preceding* character is a word character — never at the
 * start of a subject and never after a space, which is exactly where the bare
 * form appears. With `\b` the clause matched only inside `chore(release):
 * @apicity/* → 0.8.4`, where alternative 1 had already matched, so the third
 * form REQ-002 names never fired on its own.
 *
 * That anchoring made the clause's tail matter: a bare `\d` also matched prose
 * like `docs: link @apicity/* to 3 worked examples`, and a `true` here *drops*
 * the commit from New/Updated with no diagnostic. REQ-002's form names a
 * version, so require `<major>.<minor>` rather than any digit.
 */
export function isReleaseCommit(commit) {
  return (
    /^(chore|fix)\(release\):/i.test(commit.subject) ||
    /(?:^|\s)@apicity\/\*\s+(to|→)\s+v?\d+\.\d+/i.test(commit.subject)
  );
}

// New = user-visible additions (feat/add/new); everything else is an Updated
// change (fix/perf/refactor/improve/...).
export function classifyCommit(commit) {
  const prefix = conventionalType(commit.subject);
  if (prefix === "feat") return "new";
  if (prefix) return "updated";
  return /^(add|new|introduce|implement|support|create)\b/i.test(
    normalize(commit.subject)
  )
    ? "new"
    : "updated";
}

// Same split for a bead, read from its type/labels or its title's
// conventional-commit prefix / leading verb.
export function classifyIssue(issue) {
  const type = normalize(issue.issue_type).toLowerCase();
  const labels = (
    Array.isArray(issue.labels)
      ? issue.labels.join(" ")
      : String(issue.labels || "")
  ).toLowerCase();
  const title = normalize(issue.title);
  const prefix = conventionalType(title);
  if (prefix === "feat") return "new";
  if (prefix) return "updated";
  if (type === "feature" || /\b(feature|enhancement)\b/.test(labels)) {
    return "new";
  }
  if (
    /^(add|adds|added|new|introduce|implement|support|create|enable|expose)\b/i.test(
      title
    )
  ) {
    return "new";
  }
  return "updated";
}

/**
 * A Gas City workflow bead carries at least one of `gc.step_ref`, `gc.kind`,
 * or `gc.root_bead_id` in its metadata (REQ-006). Their ids (`ac-*`), types
 * (`task`/`bug`), and titles ("Implement owned work") are indistinguishable
 * from hand-filed work, so metadata is the only reliable signal.
 */
export function isGasCityBead(bead) {
  const metadata = bead && typeof bead === "object" ? bead.metadata : null;
  if (!metadata || typeof metadata !== "object") return false;
  return GAS_CITY_METADATA_KEYS.some((key) => normalize(metadata[key]) !== "");
}

function appendSection(lines, heading, items) {
  if (!items.length) return;
  lines.push(`## ${heading}`, "");
  for (const item of items) lines.push(`- ${item}`);
  lines.push("");
}

/**
 * Render the notes for one release.
 *
 * @param {object} input
 * @param {string} input.version         Release version without the `v`.
 * @param {{hash?: string, subject: string}[]} input.commits
 *   Commits in the release range, in `git log` order (reverse chronological).
 *   That order is preserved: it is what reproduces the published line order.
 * @param {object[]} [input.beads]       Closed beads, used only when enriching.
 * @param {object[]|(() => object[])} [input.packages]
 *   `@apicity/*` package manifests, or a thunk returning them. The thunk form
 *   exists so a caller can avoid reading the filesystem for a release that
 *   turns out to have nothing publishable (REQ-012).
 * @param {"off"|"enrich"} [input.beadMode]  Secondary source, off by default.
 * @param {string} [input.range]         Range label used in the diagnostic.
 * @returns {{markdown: string, newItems: string[], updatedItems: string[],
 *   diagnostics: string[]}}
 *   `markdown` is `""` when there is nothing publishable; `diagnostics` is
 *   then non-empty and the caller must abort rather than publish empty
 *   sections.
 */
export function renderNotes({
  version,
  commits = [],
  beads = [],
  packages = [],
  beadMode = "off",
  range = "",
}) {
  const newItems = [];
  const updatedItems = [];
  const seen = new Set();

  for (const commit of commits.filter((commit) => !isReleaseCommit(commit))) {
    const line = renderLine(commit.subject);
    if (!line) continue;
    seen.add(line);
    (classifyCommit(commit) === "new" ? newItems : updatedItems).push(line);
  }

  // Enrichment is opt-in (REQ-007). The Gas City exclusion is re-applied here
  // even though the caller already filters, so REQ-006 holds on any code path
  // whatever a future caller passes in.
  if (beadMode === "enrich") {
    for (const bead of beads) {
      if (isGasCityBead(bead)) continue;
      const line = renderLine(bead.title);
      if (!line || seen.has(line)) continue;
      seen.add(line);
      (classifyIssue(bead) === "new" ? newItems : updatedItems).push(line);
    }
  }

  if (newItems.length + updatedItems.length === 0) {
    return {
      markdown: "",
      newItems,
      updatedItems,
      diagnostics: [`no publishable commits in ${range || `v${version}`}`],
    };
  }

  // Sorting lives here rather than in the caller's package reader so REQ-008
  // is guaranteed by the pure function and provable from an unsorted input.
  const packageList = [
    ...(typeof packages === "function" ? packages() : packages),
  ].sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const lines = [`# Apicity v${version}`, ""];
  appendSection(lines, "New", newItems);
  appendSection(lines, "Updated", updatedItems);
  lines.push("## Published Packages", "");
  for (const pkg of packageList) {
    lines.push(`- \`${pkg.name}@${pkg.version}\``);
  }

  return {
    markdown: `${lines.join("\n")}\n`,
    newItems,
    updatedItems,
    diagnostics: [],
  };
}
