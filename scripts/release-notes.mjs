#!/usr/bin/env node
/**
 * Generate the Apicity GitHub release notes for one version.
 *
 *   node scripts/release-notes.mjs --version <x.y.z> \
 *     [--release-bead <id>] [--beads off|enrich]
 *
 * Markdown goes to stdout, diagnostics to stderr. Exit 0 means the notes on
 * stdout are publishable; exit 1 means they are not, and nothing is written to
 * stdout, so `> notes.md` never leaves a half-formed page behind.
 *
 * This file owns every impure operation — `git`, `bd`, `package.json` reads,
 * the exit contract. All rendering decisions live in
 * `scripts/lib/release-notes.mjs`, which is pure and unit-tested.
 *
 * Source precedence: the release commit range `<previousTag>..v<version>` is
 * the only source of `New`/`Updated` by default (REQ-001). `--beads=enrich`
 * additionally pulls beads closed in the window, minus every Gas City workflow
 * bead (REQ-006), for windows whose commit subjects are uninformative. That
 * secondary pass queries a live bead store, so its output is not reproducible
 * run to run the way the default path is (REQ-011).
 *
 * Called from item 3 of sub-step 7 of `mol-apicity-release`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { isGasCityBead, normalize, renderNotes } from "./lib/release-notes.mjs";

/**
 * `bd list --limit 0 --json` over a busy release window is large, and the
 * default 1 MiB buffer truncated it into a parse failure that looked like an
 * empty window. Every command in this file runs with the same ceiling.
 */
export const commandMaxBuffer = 64 * 1024 * 1024;

const USAGE =
  "Usage: node scripts/release-notes.mjs --version <x.y.z> " +
  "[--release-bead <id>] [--beads off|enrich]";

export function parseArgs(argv) {
  // `--release-bead` is the only way in. The heredoc also read a `RELEASE_BEAD`
  // environment variable; nothing in the repository ever set it, so the
  // fallback was an untestable second entry point to the same option.
  const options = {
    version: "",
    releaseBead: "",
    beadMode: "off",
    help: false,
  };

  const take = (name, inline, index) => {
    if (inline !== undefined) {
      if (!inline) throw new Error(`${name} requires a value`);
      return { value: inline, index };
    }
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      throw new Error(`${name} requires a value`);
    }
    return { value: next, index: index + 1 };
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    const [name, ...rest] = arg.split("=");
    const inline = arg.includes("=") ? rest.join("=") : undefined;

    if (name === "--version") {
      const taken = take(name, inline, index);
      options.version = taken.value.replace(/^v/, "");
      index = taken.index;
      continue;
    }

    if (name === "--release-bead") {
      const taken = take(name, inline, index);
      options.releaseBead = taken.value;
      index = taken.index;
      continue;
    }

    if (name === "--beads") {
      const taken = take(name, inline, index);
      if (taken.value !== "off" && taken.value !== "enrich") {
        throw new Error(`--beads must be "off" or "enrich"`);
      }
      options.beadMode = taken.value;
      index = taken.index;
      continue;
    }

    throw new Error(`unknown argument "${arg}"`);
  }

  if (!options.help && !options.version) {
    throw new Error("--version is required");
  }

  return options;
}

/**
 * Soft runner: an unusable command is an empty string. Kept for the callers
 * that genuinely want "absent" rather than "broken" — a tag with no tagger
 * date, a `bd` query against a store that is not there.
 */
function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      maxBuffer: commandMaxBuffer,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Checked runner: failure throws with the command's own stderr attached.
 *
 * With commits promoted to the primary source, `run()`'s error-swallowing
 * became load-bearing: a broken checkout, an unresolvable tag, and a genuinely
 * empty range all reduce to `""`, and reporting all three as "nothing to
 * release" would tell an operator the release is empty when the real fault is
 * a shallow clone. The paths that decide the exit code use this instead.
 */
function runChecked(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      maxBuffer: commandMaxBuffer,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = normalize(error?.stderr || error?.message || "");
    throw new Error(
      `${command} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`
    );
  }
}

function runJson(command, args) {
  const output = run(command, args);
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function git(args) {
  return run("git", args);
}

function bd(args) {
  return runJson("bd", [...args, "--json"]);
}

export function readPackages() {
  const dirs = [
    "packages/mcp-server",
    ...readdirSync("packages/provider", { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `packages/provider/${entry.name}`),
  ];

  // Deliberately unsorted: `renderNotes()` owns REQ-008's ordering so the pure
  // function can be proven to sort from an unsorted input. Sorting here as well
  // made the code and that comment disagree about who owns the requirement.
  return dirs
    .filter((dir) => existsSync(`${dir}/package.json`))
    .map((dir) => JSON.parse(readFileSync(`${dir}/package.json`, "utf8")))
    .filter((pkg) => pkg.name && pkg.name.startsWith("@apicity/"));
}

export function findPreviousTag(currentTag) {
  const nearest = git([
    "describe",
    "--tags",
    "--abbrev=0",
    `${currentTag}^`,
    "--match",
    "v[0-9]*",
  ]);
  if (nearest) return nearest;

  return (
    git([
      "tag",
      "--merged",
      currentTag,
      "--sort=-version:refname",
      "--list",
      "v*",
    ])
      .split("\n")
      .find((tag) => tag && tag !== currentTag) || ""
  );
}

export function tagDate(tag) {
  const taggerDate = git([
    "for-each-ref",
    `refs/tags/${tag}`,
    "--format=%(taggerdate:iso-strict)",
  ]);
  if (taggerDate) return taggerDate;
  return git(["log", "-1", "--format=%cI", tag]);
}

export function readCommits(range) {
  return runChecked("git", ["log", "--format=%h%x09%s", range])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, ...subjectParts] = line.split("\t");
      return { hash, subject: subjectParts.join("\t") };
    });
}

export function releaseVersionFromTag(tag) {
  return tag.replace(/^v/, "");
}

export function isReleaseTrackingIssue(issue) {
  const title = String(issue.title || "");
  const reason = String(issue.close_reason || "");
  return (
    /^release( apicity)? v?\d+\.\d+\.\d+/i.test(title) ||
    /^release \d+\.\d+\.\d+/i.test(title) ||
    /published apicity v?\d+\.\d+\.\d+/i.test(reason)
  );
}

/**
 * Process beads that are not changelog material. The `mol`/type/title rules
 * catch molecule machinery; the `isGasCityBead` test catches Gas City workflow
 * beads, which carry plain `ac-*` ids, ordinary types, and human-looking
 * titles and so passed every other rule here (REQ-006).
 */
export function isInfrastructureIssue(issue) {
  const id = String(issue.id || "");
  const parent = String(issue.parent || "");
  const title = String(issue.title || "");
  return (
    isGasCityBead(issue) ||
    /\bmol\b/i.test(id) ||
    /\bmol\b/i.test(parent) ||
    ["molecule", "gate", "convoy", "step", "wisp", "order"].includes(
      issue.issue_type
    ) ||
    /^mol[-: ]/i.test(title) ||
    /^(order|nudge):/i.test(title)
  );
}

export function isAdministrativeClosureIssue(issue) {
  const reason = normalize(
    [issue.close_reason, issue.metadata?.close_reason].filter(Boolean).join(" ")
  );

  return (
    /^(cancell?ed|closed) per user request\b/i.test(reason) ||
    /^cancell?ed\b/i.test(reason) ||
    /\bmass-cancell?ed\b/i.test(reason) ||
    /^molecule (cleanup|autoclose):/i.test(reason) ||
    /\bsubtree force-closed\b/i.test(reason)
  );
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function shippedInPreviousRelease(issue, previousTag) {
  if (!previousTag) return false;
  const previousVersion = releaseVersionFromTag(previousTag);
  const text = [issue.title, issue.description, issue.close_reason, issue.notes]
    .map(normalize)
    .join(" ");

  return new RegExp(
    `\\b(v?${escapeRegExp(previousVersion)}|@apicity/[^\\s]+@${escapeRegExp(
      previousVersion
    )})\\b`,
    "i"
  ).test(text);
}

export function findPreviousReleaseIssue(previousTag) {
  if (!previousTag) return null;

  const needles = [previousTag, releaseVersionFromTag(previousTag)];
  const byId = new Map();
  for (const needle of needles) {
    const rows = bd([
      "list",
      "--status=closed",
      "--title",
      needle,
      "--limit",
      "0",
    ]);
    if (Array.isArray(rows)) {
      for (const issue of rows) byId.set(issue.id, issue);
    }
  }

  return (
    [...byId.values()]
      .filter((issue) => isReleaseTrackingIssue(issue))
      .sort((a, b) => {
        const aTime = Date.parse(a.closed_at || "") || 0;
        const bTime = Date.parse(b.closed_at || "") || 0;
        return bTime - aTime;
      })[0] || null
  );
}

export function readClosedWork(
  previousRelease,
  previousTag,
  currentDate,
  releaseBead
) {
  const previousDate = previousRelease?.closed_at || tagDate(previousTag);
  const args = ["list", "--status=closed", "--sort", "closed", "--limit", "0"];
  if (previousDate) args.push("--closed-after", previousDate);
  if (currentDate) args.push("--closed-before", currentDate);

  const issues = bd(args);
  const work = Array.isArray(issues) ? issues : [];
  return {
    previousDate,
    // No standalone `isGasCityBead` filter: `isInfrastructureIssue()` opens
    // with that exact test, so a second one here gave REQ-006 two enforcement
    // points inside one function and neither could fail alone. The deliberate
    // defence-in-depth copy is the one in `renderNotes()`, which guards a
    // different code path.
    work: work
      .filter((issue) => issue.id !== releaseBead)
      .filter((issue) => !isReleaseTrackingIssue(issue))
      .filter((issue) => !isInfrastructureIssue(issue))
      .filter((issue) => !isAdministrativeClosureIssue(issue))
      .filter((issue) => !shippedInPreviousRelease(issue, previousTag)),
  };
}

function fail(message) {
  console.error(`release-notes: ${message}`);
  process.exit(1);
}

function main(argv) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(`release-notes: ${error.message}\n${USAGE}`);
    process.exit(1);
  }

  if (options.help) {
    console.log(USAGE);
    return;
  }

  const currentTag = `v${options.version}`;

  const previousTag = findPreviousTag(currentTag);
  if (!previousTag) {
    fail(
      `could not resolve the release tag before ${currentTag}. The checkout ` +
        "is missing tags rather than the release being empty — run " +
        "`git fetch --tags` and retry."
    );
  }

  const range = `${previousTag}..${currentTag}`;

  // The tag is created earlier in the same sub-step, so an empty tag date means
  // a broken invocation. It used to fall back to the wall clock, the last
  // source of run-to-run variance in the output (REQ-011).
  const currentDate = tagDate(currentTag);
  if (!currentDate) {
    fail(
      `${currentTag} has no tag or commit date. Create the tag before ` +
        "generating release notes."
    );
  }

  let commits;
  try {
    commits = readCommits(range);
  } catch (error) {
    fail(
      `could not read the commit range ${range} — ${error.message}. The ` +
        "checkout is missing history rather than the release being empty."
    );
  }

  let beads = [];
  if (options.beadMode === "enrich") {
    const previousRelease = findPreviousReleaseIssue(previousTag);
    beads = readClosedWork(
      previousRelease,
      previousTag,
      currentDate,
      options.releaseBead
    ).work;
  }

  const notes = renderNotes({
    version: options.version,
    commits,
    beads,
    // Thunk, not an array: a release with nothing publishable must not depend
    // on the package tree being readable before it can say so.
    packages: readPackages,
    beadMode: options.beadMode,
    range,
  });

  if (!notes.markdown) {
    for (const diagnostic of notes.diagnostics) {
      console.error(`release-notes: ${diagnostic}`);
    }
    process.exit(1);
  }

  process.stdout.write(notes.markdown);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
