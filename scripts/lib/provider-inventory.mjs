/**
 * The single definition of "which providers this monorepo ships", plus the
 * pure checking logic the documentation guard consumes.
 *
 * The provider list was restated by hand in three prose surfaces — `CLAUDE.md`,
 * `AGENTS.md`, and `README.md` — with nothing tying any of them to the
 * directories on disk. It drifted: at `469efc28` the repository held 29
 * provider directories while `CLAUDE.md` named 23, and `googleflow` was absent
 * from the overview even though `CLAUDE.md`'s own Code Conventions section
 * cited `packages/provider/googleflow/src/zod.ts` as the canonical example for
 * open model-identifier enums. These files are the first thing an agent reads,
 * so a missing provider is invisible to planning and review, and an endpoint
 * can be filed against a provider the docs claim does not exist (ac-gk1mlr).
 *
 * The same gap applies to the root `package.json` build aliases: `googleflow`
 * had no `build:*` script while every other provider directory did (ac-qclky0),
 * and `CLAUDE.md`'s `build:<name>` list named 25 of 30 (ac-e1h1yj).
 *
 * This module derives all three inventories — provider directories, `build:*`
 * aliases, and `doc-gen:*` aliases — from the repository itself, and
 * `checkProviderInventoryDocs` fails a documented surface that no longer
 * matches, in either direction.
 *
 * Unlike `scripts/lib/fast-gate-steps.mjs`, whose contract is a hand-written
 * list, this module's source of truth is the filesystem, so it necessarily
 * reads from disk. The reading and the checking are kept apart: `read*` touch
 * the filesystem, `check*` are pure string-in/problems-out, which is what lets
 * the guard test drive the checkers with synthetic inventories.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Repository root, resolved from this module's own location. */
export const REPO_ROOT = path.resolve(HERE, "..", "..");

/** Documentation surfaces that must name every provider. */
export const PROVIDER_DOC_SURFACES = Object.freeze([
  "CLAUDE.md",
  "AGENTS.md",
  "README.md",
]);

/**
 * Packages that live outside `packages/provider/` but ship as `@apicity/*`.
 *
 * `mcp-server` is a real published package with its own build alias, so the
 * alias checks must expect it; it is not a provider, so the provider-list
 * checks must not.
 */
export const NON_PROVIDER_PACKAGES = Object.freeze(["mcp-server"]);

/**
 * Providers with no generated README, and why.
 *
 * `cost` is hand-written prose about estimation rather than an endpoint
 * surface, so `doc-gen` has nothing to generate for it. Every other provider
 * directory must carry a `doc-gen:<name>` alias.
 */
export const DOC_GEN_EXEMPT = Object.freeze({
  cost: "README is hand-written; the package exposes no endpoint surface",
});

/**
 * Provider directory names, sorted, read from `packages/provider/`.
 *
 * @param {string} [repoRoot]
 * @returns {string[]}
 */
export function readProviderNames(repoRoot = REPO_ROOT) {
  const dir = path.join(repoRoot, "packages", "provider");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) =>
      fs.existsSync(path.join(dir, entry.name, "package.json"))
    )
    .map((entry) => entry.name)
    .sort();
}

/**
 * Read the root `package.json` scripts map.
 *
 * @param {string} [repoRoot]
 * @returns {Record<string, string>}
 */
export function readRootScripts(repoRoot = REPO_ROOT) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")
  );
  return manifest.scripts ?? {};
}

/**
 * Alias suffixes that name a mode rather than a package.
 *
 * `doc-gen:check` is the generated-README drift check that `ci:local` runs, not
 * a per-package alias, so it must not be read as a package named `check`.
 */
export const RESERVED_ALIAS_SUFFIXES = Object.freeze(["check"]);

/**
 * Names carried by `<prefix>:<name>` scripts, sorted.
 *
 * `build:mcp-server` is a legitimate alias for a package outside
 * `packages/provider/`, so the returned set is compared against providers plus
 * `NON_PROVIDER_PACKAGES` rather than providers alone.
 *
 * @param {Record<string, string>} scripts
 * @param {string} prefix
 * @returns {string[]}
 */
export function aliasNames(scripts, prefix) {
  const head = `${prefix}:`;
  return Object.keys(scripts)
    .filter((name) => name.startsWith(head))
    .map((name) => name.slice(head.length))
    .filter((name) => !name.includes(":"))
    .filter((name) => !RESERVED_ALIAS_SUFFIXES.includes(name))
    .sort();
}

/**
 * Every alias name the `build:*` set must hold, sorted.
 *
 * @param {string[]} providers
 * @returns {string[]}
 */
export function expectedBuildAliases(providers) {
  return [...providers, ...NON_PROVIDER_PACKAGES].sort();
}

/**
 * Every alias name the `doc-gen:*` set must hold, sorted.
 *
 * @param {string[]} providers
 * @returns {string[]}
 */
export function expectedDocGenAliases(providers) {
  return providers.filter((name) => !(name in DOC_GEN_EXEMPT)).sort();
}

const REGION = (id) => ({
  start: new RegExp(`<!--\\s*provider-inventory:${id}:start\\s*-->`, "g"),
  end: new RegExp(`<!--\\s*provider-inventory:${id}:end\\s*-->`, "g"),
});

/**
 * Extract the text between a marked region's delimiters.
 *
 * Returns `{ region }` on success or `{ problems }` when the anchors are
 * missing, duplicated, or inverted. An absent anchor fails rather than
 * silently checking nothing.
 *
 * @param {string} surface
 * @param {string} text
 * @param {string} id
 * @returns {{region: string, problems?: undefined} | {region?: undefined, problems: string[]}}
 */
export function readRegion(surface, text, id) {
  const { start: startRe, end: endRe } = REGION(id);
  const starts = [...text.matchAll(startRe)];
  const ends = [...text.matchAll(endRe)];
  const problems = [];
  if (starts.length !== 1) {
    problems.push(
      `${surface}: expected exactly one <!-- provider-inventory:${id}:start --> marker, found ${starts.length}`
    );
  }
  if (ends.length !== 1) {
    problems.push(
      `${surface}: expected exactly one <!-- provider-inventory:${id}:end --> marker, found ${ends.length}`
    );
  }
  if (problems.length > 0) return { problems };

  const regionStart = starts[0].index + starts[0][0].length;
  if (ends[0].index < regionStart) {
    return {
      problems: [
        `${surface}: the <!-- provider-inventory:${id}:end --> marker appears before its :start marker`,
      ],
    };
  }
  return { region: text.slice(regionStart, ends[0].index) };
}

/**
 * Check one marked region against the names it must enumerate.
 *
 * Pure: strings in, human-readable problem strings out — empty when clean.
 * Both directions are reported, so deleting a provider from disk without
 * updating the prose is as red as adding one.
 *
 * `mention` builds the exact substring a name must appear as. Surfaces
 * legitimately format the same inventory differently — CLAUDE.md writes
 * `` `@apicity/kie` ``, the README links `[@apicity/kie](...)`, the build list
 * writes `build:kie` — so the caller supplies the shape rather than the guard
 * guessing at it.
 *
 * @param {string} surface
 * @param {string} text
 * @param {string} id
 * @param {string[]} names
 * @param {(name: string) => string} mention
 * @returns {string[]}
 */
export function checkRegionNames(surface, text, id, names, mention) {
  const found = readRegion(surface, text, id);
  if (found.problems) return found.problems;

  const problems = [];
  for (const name of names) {
    if (!found.region.includes(mention(name))) {
      problems.push(
        `${surface}: '${name}' is in the repository but missing from the ${id} region (expected to find ${JSON.stringify(mention(name))})`
      );
    }
  }
  return problems;
}

/**
 * Check every documented inventory on one surface.
 *
 * `inventories` is injectable so the guard test can drive the checker with a
 * synthetic provider list — that is what turns "adding a provider fails the
 * docs" from a manual procedure into an assertion.
 *
 * @param {string} surface
 * @param {string} text
 * @param {{providers: string[], buildAliases: string[], docGenAliases: string[]}} inventories
 * @returns {string[]}
 */
export function checkProviderInventoryDocs(surface, text, inventories) {
  const problems = checkRegionNames(
    surface,
    text,
    "providers",
    inventories.providers,
    (name) => `@apicity/${name}`
  );

  // Only CLAUDE.md documents the script aliases; the other surfaces carry no
  // such region, and a missing region there is not drift.
  for (const [id, names, mention] of [
    ["claude-build-scripts", inventories.buildAliases, (n) => `build:${n}`],
    [
      "claude-doc-gen-scripts",
      inventories.docGenAliases,
      (n) => `doc-gen:${n}`,
    ],
  ]) {
    const { problems: anchorProblems } = readRegion(surface, text, id);
    const absent =
      anchorProblems &&
      anchorProblems.some((problem) => problem.includes("found 0"));
    if (absent) continue;
    problems.push(...checkRegionNames(surface, text, id, names, mention));
  }

  return problems;
}

/**
 * Check a script-alias set in the root `package.json` against the repository.
 *
 * This is the half no prose region can catch: a provider directory with no
 * `build:<name>` alias at all, which is what `ac-qclky0` was filed for.
 *
 * @param {string[]} actual
 * @param {string[]} expected
 * @param {string} prefix
 * @returns {string[]}
 */
export function checkAliasCoverage(actual, expected, prefix) {
  const have = new Set(actual);
  const want = new Set(expected);
  const problems = [];
  for (const name of expected) {
    if (!have.has(name)) {
      problems.push(
        `package.json: '${prefix}:${name}' is missing — every provider directory needs a single-package alias`
      );
    }
  }
  for (const name of actual) {
    if (!want.has(name)) {
      problems.push(
        `package.json: '${prefix}:${name}' has no matching package — remove the alias or restore the package`
      );
    }
  }
  return problems;
}
