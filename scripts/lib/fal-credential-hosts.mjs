/**
 * Which fal credential a recording's host requires, and whether the test that
 * replays it is actually wired to that credential.
 *
 * fal splits its surface across two credentials: the admin key reaches the
 * platform API on `api.fal.ai` (pricing, usage, analytics, model registry),
 * and the generation key reaches the inference and storage hosts. Replay never
 * contacts fal, so a miswired `apiKey` passes every gate in this repository
 * and only fails the next `dev:record` — against a paid account, after the
 * mistake has already been committed. That is the gap this module closes
 * (ac-wt8fzl, split out of the credential work in ac-hzepzf REQ-010).
 *
 * All domain logic lives here as pure functions so
 * `tests/unit/recording-credential-hosts.test.ts` can drive it with synthetic
 * inputs instead of only the committed corpus.
 *
 * Recording-name parsing is NOT re-derived here: `SETUP_RE`, `CONST_RE`,
 * `normalizeName`, `resolveArg`, and `dirToRecordingName` come from
 * `scripts/lib/recording-names.mjs`, which `check-orphan-recordings.mjs`
 * already uses for the same join (REQ-021). Both `g`-flagged regexes are
 * consumed with `matchAll` only.
 */
import fs from "node:fs";
import path from "node:path";
import {
  CONST_RE,
  dirToRecordingName,
  normalizeName,
  resolveArg,
  SETUP_RE,
} from "./recording-names.mjs";

/**
 * Host to credential class.
 *
 * `queue.fal.run` has zero recordings today and is listed anyway, so a future
 * queue fixture classifies rather than failing as an unknown host.
 */
export const FAL_HOST_CREDENTIALS = Object.freeze({
  "api.fal.ai": "admin",
  "fal.run": "generation",
  "queue.fal.run": "generation",
  "rest.fal.ai": "generation",
  "v3b.fal.media": "generation",
});

/** Credential class to the environment variable a call site must reference. */
export const CREDENTIAL_ENV = Object.freeze({
  admin: "FAL_ADMIN_API_KEY",
  generation: "FAL_API_KEY",
});

/**
 * Resolve the single `fal_*` directory under a recordings root.
 *
 * Polly names the directory with a namespace hash (`fal_2801268556` today).
 * Matching the prefix rather than the literal keeps this rename-resistant,
 * while throwing on zero, several, or an empty match means a hash change fails
 * loudly instead of turning the guard into a silent no-op.
 *
 * @param {string} recordingsRoot
 * @returns {string} absolute path to the fal recordings directory
 */
export function resolveFalRecordingsDir(recordingsRoot) {
  const matches = fs
    .readdirSync(recordingsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^fal_\d+$/.test(entry.name))
    .map((entry) => path.join(recordingsRoot, entry.name));

  if (matches.length !== 1) {
    throw new Error(
      `expected exactly one fal_* directory under ${recordingsRoot}, found ${matches.length}` +
        (matches.length > 1
          ? `: ${matches.map((m) => path.basename(m)).join(", ")}`
          : "")
    );
  }
  const harCount = listHarFiles(matches[0]).length;
  if (harCount === 0) {
    throw new Error(
      `${path.basename(matches[0])} holds no recording.har files; the fal ` +
        "namespace hash likely changed and this guard would check nothing"
    );
  }
  return matches[0];
}

/**
 * Every `recording.har` under a directory, recursively.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function listHarFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHarFiles(full));
    else if (entry.name === "recording.har") out.push(full);
  }
  return out.sort();
}

/**
 * Read the distinct request hosts a recording contacts.
 *
 * @param {string} harPath
 * @returns {{hosts: string[], recordingName: string | null}}
 */
export function readRecordingHosts(harPath) {
  const har = JSON.parse(fs.readFileSync(harPath, "utf8"));
  const hosts = new Set();
  for (const entry of har.log?.entries ?? []) {
    const url = entry.request?.url;
    if (typeof url !== "string") continue;
    try {
      hosts.add(new URL(url).hostname);
    } catch {
      // A malformed URL is not a host; the recording still fails below as
      // unknown-host rather than being silently dropped.
      hosts.add(url);
    }
  }
  return {
    hosts: [...hosts].sort(),
    recordingName: har.log?._recordingName ?? null,
  };
}

/**
 * Classify a recording's hosts into one credential class.
 *
 * Never defaults and never skips. `["rest.fal.ai", "v3b.fal.media"]` is a
 * legitimate two-host generation recording (`storage-upload-initiate`), not a
 * mix — the mix that matters is admin alongside generation.
 *
 * @param {string[]} hosts
 * @param {Readonly<Record<string, string>>} [table]
 * @returns {{ok: true, credential: string, host: string} | {ok: false, reason: string, host?: string, hosts?: string[]}}
 */
export function classifyHosts(hosts, table = FAL_HOST_CREDENTIALS) {
  if (hosts.length === 0) return { ok: false, reason: "no-hosts" };

  const classes = new Set();
  for (const host of hosts) {
    const credential = table[host];
    if (!credential) return { ok: false, reason: "unknown-host", host };
    classes.add(credential);
  }
  if (classes.size > 1) return { ok: false, reason: "mixed-classes", hosts };

  const credential = [...classes][0];
  const host = hosts.find((h) => table[h] === credential);
  return { ok: true, credential, host };
}

/**
 * Classify an `apiKey` expression by the fal environment variable it names.
 *
 * The ADMIN name is tested FIRST and returns immediately: `FAL_ADMIN_API_KEY`
 * does not contain `FAL_API_KEY` as a substring, but the ordering makes that
 * independent of how either name is spelled later (REQ-009).
 *
 * @param {string} expr
 * @returns {"admin" | "generation" | null}
 */
export function credentialForExpression(expr) {
  if (expr.includes("FAL_ADMIN_API_KEY")) return "admin";
  if (expr.includes("FAL_API_KEY")) return "generation";
  return null;
}

const API_KEY_RE = /apiKey:\s*([^,\n}]+)/g;

/**
 * One `setupPolly*` call site and the credential its file is wired to.
 *
 * Named rather than inlined as `object`: `tests/tsconfig.json` sets
 * `allowJs: true, checkJs: false`, so this module is never type-checked itself,
 * but its inferred types ARE enforced at every TypeScript call site. A bare
 * `object` return type makes `site.distinctExpressionCount` a TS2339 error in
 * the guard test — which `typecheck:tests` catches and a Vitest run does not.
 *
 * @typedef {object} FalCallSite
 * @property {string} file - repo-relative path
 * @property {number} line - 1-based line of the setup call
 * @property {string | null} keyExpression - the file's single FAL_* apiKey expression
 * @property {number | null} keyLine - 1-based line of that expression
 * @property {number} distinctExpressionCount - distinct FAL_* expressions in the file
 */

/**
 * Walk `tests/**\/*.test.ts` and collect fal recording call sites.
 *
 * Association is FILE-scoped and fails loud. 57 of the fal `setupPolly*` sites
 * sit in a `beforeEach(` block while the matching `createFal({ apiKey })` sits
 * in the `it(` block, so an `it(`-bounded search resolves none of them. Every
 * file holding a fal recording site carries exactly one `FAL_*` expression
 * today; a file with zero or two fails rather than being guessed at.
 *
 * Filtering on `FAL_` — an environment reference — rather than `apiKey:` alone
 * structurally excludes the hundreds of literal `apiKey: "fal-test-key"`
 * occurrences under `tests/`.
 *
 * @param {string} testsDir
 * @returns {{sites: Map<string, FalCallSite[]>, unresolved: string[]}}
 */
export function scanFalCallSites(testsDir) {
  const sites = new Map();
  const unresolved = [];

  for (const file of listTestFiles(testsDir)) {
    const source = fs.readFileSync(file, "utf8");
    const relFile = path.relative(path.dirname(testsDir), file);

    const consts = new Map();
    for (const match of source.matchAll(CONST_RE))
      consts.set(match[1], match[2]);

    const keyMatches = [...source.matchAll(API_KEY_RE)]
      .map((match) => ({
        expression: match[1].trim(),
        line: lineOf(source, match.index),
      }))
      .filter((entry) => entry.expression.includes("FAL_"));
    const distinct = new Set(keyMatches.map((entry) => entry.expression));

    for (const match of source.matchAll(SETUP_RE)) {
      const raw = match[1];
      const line = lineOf(source, match.index);
      const resolved = resolveArg(raw, consts);
      if (resolved === null) {
        // Only report captures that could plausibly be a fal recording; a
        // computed name in another provider's file is not this guard's
        // business. There are zero such captures repo-wide today.
        unresolved.push(`${relFile}:${line}: ${raw.trim()}`);
        continue;
      }
      const slug = normalizeName(resolved);
      if (!slug.startsWith("fal/")) continue;

      const list = sites.get(slug) ?? [];
      list.push({
        file: relFile,
        line,
        keyExpression: keyMatches[0]?.expression ?? null,
        keyLine: keyMatches[0]?.line ?? null,
        distinctExpressionCount: distinct.size,
      });
      sites.set(slug, list);
    }
  }
  return { sites, unresolved };
}

/**
 * Join the recording corpus to the call sites and report every mismatch.
 *
 * @param {{recordingsRoot: string, testsDir: string}} options
 * @returns {{summary: {total: number, admin: number, generation: number}, failures: string[]}}
 */
export function auditFalCredentialWiring({ recordingsRoot, testsDir }) {
  const falDir = resolveFalRecordingsDir(recordingsRoot);
  const { sites, unresolved } = scanFalCallSites(testsDir);
  const failures = [];
  const summary = { total: 0, admin: 0, generation: 0 };

  // An unreadable recording name is a recording this guard cannot check, so it
  // is a failure rather than a skip (second half of REQ-010).
  for (const entry of unresolved) {
    failures.push(
      `unresolvable setupPolly argument at ${entry} — the guard cannot tell ` +
        "which recording this replays"
    );
  }

  for (const harPath of listHarFiles(falDir)) {
    const slug =
      "fal/" + dirToRecordingName(path.relative(falDir, path.dirname(harPath)));
    summary.total += 1;

    const { hosts, recordingName } = readRecordingHosts(harPath);
    if (recordingName && normalizeName(recordingName) !== slug) {
      failures.push(
        `${slug}: HAR _recordingName "${recordingName}" does not normalize to ` +
          "its directory slug"
      );
      continue;
    }

    const classified = classifyHosts(hosts);
    if (!classified.ok) {
      failures.push(
        classified.reason === "unknown-host"
          ? `${slug}: host ${classified.host} is not in FAL_HOST_CREDENTIALS — ` +
              "add it with its credential class"
          : `${slug}: mixes credential classes across hosts ${(classified.hosts ?? hosts).join(", ")}`
      );
      continue;
    }
    summary[classified.credential] += 1;

    const expected = CREDENTIAL_ENV[classified.credential];
    const callSites = sites.get(slug) ?? [];
    if (callSites.length === 0) {
      failures.push(
        `${slug} (${classified.host}) has no setupPolly* call site in tests/`
      );
      continue;
    }

    for (const site of callSites) {
      if (site.distinctExpressionCount !== 1) {
        failures.push(
          `${slug} (${classified.host}) at ${site.file}:${site.line}: the file ` +
            `holds ${site.distinctExpressionCount} distinct FAL_* apiKey ` +
            "expressions, so the credential cannot be associated — split the " +
            "file so each holds one credential class, or extend the guard to " +
            "block-scoped association"
        );
        continue;
      }
      const found = site.keyExpression ?? "(none)";
      if (credentialForExpression(found) !== classified.credential) {
        failures.push(
          `${slug} (${classified.host}) expects process.env.${expected}, found ` +
            `${found} at ${site.file}:${site.keyLine ?? site.line} ` +
            `(recording site ${site.file}:${site.line})`
        );
      }
    }
  }
  return { summary, failures };
}

function listTestFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "recordings" || entry.name === "node_modules")
        continue;
      out.push(...listTestFiles(full));
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out.sort();
}

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (source[i] === "\n") line += 1;
  return line;
}
