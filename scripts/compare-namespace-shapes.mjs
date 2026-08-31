#!/usr/bin/env node
// Compare the namespace shape that N sibling refs declare, without merging any
// of them.
//
//   pnpm run namespace-shapes -- --provider fal \
//     --ref feat/fal-google-gemini-omni-flash-ac-6811ea \
//     --ref feat/fal-google-gemini-omni-flash-edit-ac-akefx2
//
// Four slices of `ac-c2cc4j` each declared `fal`'s `geminiOmniFlash`: one as a
// callable, three as an object with a single leaf. No single tree held the
// defect, so every slice's own gate was green and the run reached publish
// unflagged (`RF-1` / `RR-5`, follow-up `ac-j4z1t1`). This is the command that
// reads several trees at once; `scripts/lib/namespace-shape.mjs` does the
// parsing and the comparing, and this file is argument handling, base
// resolution and report formatting on top of it.
//
// Reading is `git show` only - no checkout, no index, no worktree, no network
// (`AC-02`), so it is safe to point at refs someone else is working on.
//
// Exit codes: `0` no collision, `1` at least one collision - so a
// reconciliation slice can gate on it - and `2` for a usage or environment
// error, which is not a report either way.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkNamespaceCollisions,
  readNamespaceShapesFromDir,
  readNamespaceShapesFromRef,
} from "./lib/namespace-shape.mjs";
import { REPO_ROOT, readProviderNames } from "./lib/provider-inventory.mjs";

/** The ref a fan-out branches from when nothing better can be derived. */
const FALLBACK_BASE = "main";

const USAGE = `Usage: pnpm run namespace-shapes -- [options]

  --ref <ref>         A ref to read, repeatable. Read with \`git show\`; never
                      checked out.
  --dir <path>        A checkout to read, repeatable. Any worktree of this
                      repository.
  --provider <name>   Restrict to one provider, repeatable.
                      Default: every provider in the working tree.
  --base <ref>        Compare against this ref instead of the derived base.
                      Default: \`git merge-base\` of the supplied refs, falling
                      back to \`${FALLBACK_BASE}\`.
  --json              Print the raw report instead of the human one.
  --help, -h          Print this message.

With no --ref and no --dir the working tree is the only participant, which is
a valid one-participant run: a comparison needs two.

Exit code 1 when any collision is reported, 0 otherwise, 2 on a usage error.`;

/**
 * @typedef {object} Participant
 * @property {"ref"|"dir"} kind
 * @property {string} value Ref name or checkout path.
 */

/**
 * @typedef {object} Options
 * @property {Participant[]} participants
 * @property {string[]} providers Empty means every provider in the tree.
 * @property {string | null} base Explicit `--base`, or null to derive one.
 * @property {boolean} json
 * @property {boolean} help
 */

/**
 * Parse `argv` into options, or throw with a message the caller prints.
 *
 * Both `--flag value` and `--flag=value` are accepted, as the other scripts in
 * this directory accept them, and a bare `--` is dropped: `pnpm run` forwards
 * the separator itself, so the invocation this command is named in
 * (`pnpm run namespace-shapes -- --provider fal`) arrives with one.
 *
 * @param {string[]} argv
 * @returns {Options}
 */
export function parseArgs(argv) {
  /** @type {Options} */
  const options = {
    participants: [],
    providers: [],
    base: null,
    json: false,
    help: false,
  };

  const tokens = argv.filter((argument) => argument !== "--");

  const valueOf = (flag, inline, index) => {
    if (inline !== undefined) {
      if (inline === "") throw new Error(`${flag} needs a value.`);
      return { value: inline, next: index };
    }
    const value = tokens[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} needs a value.`);
    }
    return { value, next: index + 1 };
  };

  for (let index = 0; index < tokens.length; index++) {
    const argument = tokens[index];
    const separator = argument.indexOf("=");
    const flag = separator === -1 ? argument : argument.slice(0, separator);
    const inline = separator === -1 ? undefined : argument.slice(separator + 1);

    switch (flag) {
      case "--ref":
      case "--dir": {
        const { value, next } = valueOf(flag, inline, index);
        options.participants.push({
          kind: flag === "--ref" ? "ref" : "dir",
          value,
        });
        index = next;
        break;
      }
      case "--provider": {
        const { value, next } = valueOf(flag, inline, index);
        if (!options.providers.includes(value)) options.providers.push(value);
        index = next;
        break;
      }
      case "--base": {
        const { value, next } = valueOf(flag, inline, index);
        options.base = value;
        index = next;
        break;
      }
      case "--json":
        options.json = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument ${argument}.`);
    }
  }

  return options;
}

/**
 * `git` in the repository, as trimmed text, or `null` when it exits non-zero.
 *
 * @param {string} repoRoot
 * @param {string[]} args
 * @returns {string | null}
 */
function git(repoRoot, args) {
  const result = spawnSync("git", ["-C", repoRoot, "--no-pager", ...args], {
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

/**
 * The ref every participant is compared against.
 *
 * The comparison is base-relative, and that is load-bearing rather than an
 * optimisation: every ref in a fan-out carries the whole tree, so without a
 * base every pre-existing path is "shared by N refs" and every pre-existing
 * callable leaf is a false collision (plan review `PR-1`). A single ref has no
 * meaningful merge-base with itself, so two or more refs are required before
 * `git merge-base` is asked; anything else falls back to `main`.
 *
 * @param {Options} options
 * @param {string} repoRoot
 * @param {(repoRoot: string, args: string[]) => string | null} [runGit]
 * @returns {{ base: string | null, source: string }}
 */
export function resolveBase(options, repoRoot, runGit = git) {
  const verify = (ref, source) =>
    runGit(repoRoot, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`])
      ? { base: ref, source }
      : null;

  if (options.base !== null) {
    return (
      verify(options.base, "--base") ?? {
        base: null,
        source: `--base ${options.base} does not resolve`,
      }
    );
  }

  const refs = options.participants
    .filter((participant) => participant.kind === "ref")
    .map((participant) => participant.value);

  if (refs.length >= 2) {
    const mergeBase = runGit(repoRoot, ["merge-base", ...refs]);
    if (mergeBase) {
      return { base: mergeBase, source: "git merge-base of the supplied refs" };
    }
  }

  return (
    verify(FALLBACK_BASE, `fallback ${FALLBACK_BASE}`) ?? {
      base: null,
      source: `no base: ${FALLBACK_BASE} does not resolve`,
    }
  );
}

/**
 * Read one participant's inventory of one provider.
 *
 * @param {Participant} participant
 * @param {string} provider
 * @param {string} repoRoot
 * @returns {object}
 */
function readParticipant(participant, provider, repoRoot) {
  return participant.kind === "ref"
    ? readNamespaceShapesFromRef(participant.value, provider, repoRoot)
    : readNamespaceShapesFromDir(participant.value, provider);
}

/**
 * Compare every participant of every provider against the resolved base.
 *
 * @param {Options} options
 * @param {string} repoRoot
 * @returns {object} The raw report, which `--json` prints verbatim.
 */
export function buildReport(options, repoRoot) {
  const { base, source } = resolveBase(options, repoRoot);
  const providers =
    options.providers.length > 0
      ? options.providers
      : readProviderNames(repoRoot);
  const participants =
    options.participants.length > 0
      ? options.participants
      : [{ kind: "dir", value: repoRoot }];

  /** @type {Map<string, string | null>} */
  const files = new Map();
  const inventories = [];
  const collisions = [];
  const shared = [];

  for (const provider of providers) {
    const read = participants.map((participant) =>
      readParticipant(participant, provider, repoRoot)
    );
    const baseInventory =
      base === null
        ? null
        : readNamespaceShapesFromRef(base, provider, repoRoot);

    for (const inventory of read) {
      files.set(`${provider} ${inventory.ref}`, inventory.filePath);
      inventories.push({
        provider,
        ref: inventory.ref,
        filePath: inventory.filePath,
        factory: inventory.factory,
        paths: Object.keys(inventory.paths).length,
        unresolved: inventory.unresolved.length,
        duplicates: inventory.duplicates,
      });
    }

    const report = checkNamespaceCollisions(read, baseInventory);
    for (const collision of report.collisions) {
      collisions.push({
        ...collision,
        refs: collision.refs.map((entry) => ({
          ...entry,
          filePath: files.get(`${provider} ${entry.ref}`) ?? null,
        })),
      });
    }
    shared.push(...report.shared);
  }

  return {
    base,
    baseSource: source,
    providers,
    participants,
    inventories,
    collisions,
    shared,
  };
}

/**
 * The human report: one line per participant, naming the dot path, the ref and
 * the shape that ref declares, so the reader can act on it without re-deriving
 * the collision from N worktrees (`BR-11`, `US-4`).
 *
 * @param {ReturnType<typeof buildReport>} report
 * @returns {string}
 */
export function formatReport(report) {
  const lines = [];
  const scope =
    report.providers.length === 1
      ? report.providers[0]
      : `${report.providers.length} providers`;
  lines.push(
    `${report.participants.length} participant(s), ${scope}, base ` +
      `${report.base ?? "(none)"} - ${report.baseSource}`
  );

  const collisionPaths = new Set(
    report.collisions.map((entry) => `${entry.provider} ${entry.dotPath}`)
  );

  if (report.collisions.length > 0) {
    lines.push("");
    for (const collision of report.collisions) {
      lines.push(`COLLISION  ${collision.provider}  ${collision.dotPath}`);
      const width = Math.max(
        ...collision.refs.map((entry) => entry.ref.length)
      );
      for (const entry of collision.refs) {
        const where = entry.filePath
          ? `${entry.filePath}:${entry.line ?? "?"}`
          : "<no factory file>";
        lines.push(
          `  ${entry.ref.padEnd(width)}  ${entry.shape.padEnd(22)}  ${where}`
        );
      }
    }
  }

  if (report.shared.length > 0) {
    lines.push("");
    lines.push(`Shared namespaces - ${report.shared.length}`);
    for (const entry of report.shared) {
      const key = `${entry.provider} ${entry.dotPath}`;
      const collides = collisionPaths.has(key) ? "  (collision)" : "";
      lines.push(
        `  ${entry.provider}  ${entry.dotPath}  [${entry.shape}]  ` +
          `${entry.refs.length} refs${collides}`
      );
      for (const ref of entry.refs) lines.push(`    ${ref}`);
    }
  }

  lines.push("");
  lines.push(
    `${report.collisions.length} collision(s), ${report.shared.length} shared ` +
      "namespace(s)."
  );
  if (report.participants.length < 2) {
    lines.push("A comparison needs two or more participants.");
  }
  return lines.join("\n");
}

/**
 * @param {string[]} [argv]
 * @param {object} [io]
 * @returns {number} The intended process exit code.
 */
export function main(argv = process.argv.slice(2), io = {}) {
  const { stdout = process.stdout, stderr = process.stderr } = io;
  const write = (stream, text) => stream.write(`${text}\n`);

  /** @type {Options} */
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    write(stderr, `namespace-shapes: ${error.message}`);
    write(stderr, USAGE);
    return 2;
  }

  if (options.help) {
    write(stdout, USAGE);
    return 0;
  }

  for (const participant of options.participants) {
    if (participant.kind !== "dir") continue;
    if (!fs.existsSync(path.join(participant.value, "packages", "provider"))) {
      write(
        stderr,
        `namespace-shapes: --dir ${participant.value} is not a checkout of ` +
          "this repository."
      );
      return 2;
    }
  }

  // A --ref that does not resolve reads as an empty tree, and an empty tree
  // never participates in a comparison - so without this a mistyped ref
  // reports "0 collisions" and exits 0, which is the false green this command
  // exists to prevent (review `RF-1`). A ref that resolves but carries no such
  // provider is a different case and keeps the non-fatal stderr note below, so
  // naming a provider that lives only on a sibling branch still works.
  for (const participant of options.participants) {
    if (participant.kind !== "ref") continue;
    const resolved = git(REPO_ROOT, [
      "rev-parse",
      "--verify",
      "--quiet",
      `${participant.value}^{commit}`,
    ]);
    if (resolved) continue;
    write(
      stderr,
      `namespace-shapes: --ref ${participant.value} does not resolve.`
    );
    return 2;
  }

  const report = buildReport(options, REPO_ROOT);

  // `resolveBase` already detects an unresolvable --base and records it in
  // `baseSource`, and nothing acted on it: the run degraded into the unbased
  // mode, where every pre-existing path is a false collision, and still exited
  // 1 as though it were a report (review `RF-2`). Only an explicit --base is an
  // error here - the unbased fallback, where no --base was given and `main`
  // itself is missing, keeps its behaviour.
  if (options.base !== null && report.base === null) {
    write(stderr, `namespace-shapes: ${report.baseSource}.`);
    return 2;
  }

  // A provider no participant carries contributes nothing, so the run reports
  // "0 collisions" for it - which is the false green this whole command exists
  // to prevent, and a mistyped --provider is the easy way to reach it. Absence
  // is not an error (a package can exist only on a sibling branch, and the
  // reader still resolves it when named), so this is a note on stderr rather
  // than a non-zero exit, and --json stdout stays machine-readable.
  const located = new Set(
    report.inventories
      .filter((entry) => entry.filePath !== null)
      .map((entry) => entry.provider)
  );
  for (const provider of report.providers) {
    if (located.has(provider)) continue;
    write(
      stderr,
      `namespace-shapes: no ${provider} factory in any participant, so it ` +
        "contributed nothing to this report."
    );
  }

  write(
    stdout,
    options.json ? JSON.stringify(report, null, 2) : formatReport(report)
  );
  return report.collisions.length > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
