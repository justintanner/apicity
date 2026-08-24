import fs from "node:fs";
import path from "node:path";
import {
  CONST_RE,
  SETUP_RE,
  dirToRecordingName,
  normalizeName,
  resolveArg,
} from "./recording-names.mjs";
import { repoRoot } from "./provider-scope.mjs";

/**
 * fal serves two credential classes from distinct hosts: the admin API at
 * `api.fal.ai` needs `FAL_ADMIN_API_KEY`, while every generation host needs
 * `FAL_API_KEY`. A recording replays from disk whichever key its test names, so
 * a mis-wired test only surfaces as a 403 during a paid re-record. This module
 * pins the mapping by reading the committed HAR corpus and the `setupPolly*`
 * call sites that reference it — filesystem and source parsing only, with no
 * network I/O, no Polly instance, and no provider import.
 *
 * Recording and call site are joined on the normalized recording slug, using
 * the same scanner and normalizer as `check-orphan-recordings.mjs`, so the two
 * guards cannot disagree about what a recording is called.
 *
 * Association is file-scoped and fails loud. A test file must name exactly one
 * `FAL_*` credential expression; every fal recording in that file is judged
 * against it. Block scoping would resolve nothing useful, because most call
 * sites put `setupPolly` in a `beforeEach` block and `createFal` in the `it`
 * block. The forward constraint is one credential class per fal test file: a
 * file that needs both must be split, and the ambiguity failure says so.
 */

export const FAL_HOST_CREDENTIALS = {
  "api.fal.ai": "admin",
  "fal.run": "generation",
  "queue.fal.run": "generation",
  "rest.fal.ai": "generation",
  "v3b.fal.media": "generation",
};

export const CREDENTIAL_ENV = {
  admin: "FAL_ADMIN_API_KEY",
  generation: "FAL_API_KEY",
};

function walkFiles(dir, predicate) {
  const files = [];
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function displayPath(testsDir, file) {
  return path
    .relative(path.dirname(path.resolve(testsDir)), file)
    .split(path.sep)
    .join("/");
}

function closestOccurrence(occurrences, line) {
  return [...occurrences].sort((left, right) => {
    const distance = Math.abs(left.line - line) - Math.abs(right.line - line);
    return distance || left.line - right.line;
  })[0];
}

function recordingFiles(dir) {
  return walkFiles(dir, (file) => path.basename(file) === "recording.har");
}

/** Resolve the one fail-loud fal Polly namespace below tests/recordings. */
export function resolveFalRecordingsDir(recordingsRoot) {
  const root = path.resolve(recordingsRoot);
  const matches = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("fal_"))
    .map((entry) => path.join(root, entry.name))
    .sort();

  if (matches.length !== 1) {
    throw new Error(
      `expected exactly one fal_* recordings directory under ${root}, found ${matches.length}`
    );
  }

  const [falDir] = matches;
  const count = recordingFiles(falDir).length;
  if (count === 0) {
    throw new Error(
      `fal recordings directory contains no recording.har files: ${falDir}`
    );
  }

  return falDir;
}

/** Read the sorted request-host set and optional Polly recording identity. */
export function readRecordingHosts(harPath) {
  const har = JSON.parse(fs.readFileSync(harPath, "utf8"));
  const hosts = new Set();

  for (const entry of har.log?.entries ?? []) {
    const requestUrl = entry.request?.url;
    if (typeof requestUrl === "string") {
      hosts.add(new URL(requestUrl).hostname.toLowerCase());
    }
  }

  return {
    hosts: [...hosts].sort(),
    recordingName: har.log?._recordingName ?? null,
  };
}

/** Classify a recording's complete request-host set without a default. */
export function classifyHosts(hosts, table = FAL_HOST_CREDENTIALS) {
  const normalizedHosts = [...new Set(hosts)].sort();
  const unknownHost = normalizedHosts.find(
    (host) => !Object.hasOwn(table, host)
  );

  if (unknownHost || normalizedHosts.length === 0) {
    return {
      ok: false,
      reason: "unknown-host",
      host: unknownHost ?? "(no-host)",
    };
  }

  const credentials = new Set(normalizedHosts.map((host) => table[host]));
  if (credentials.size > 1) {
    return {
      ok: false,
      reason: "mixed-classes",
      hosts: normalizedHosts,
    };
  }

  return {
    ok: true,
    credential: credentials.values().next().value,
    host: normalizedHosts[0],
  };
}

/** Resolve the credential class named by a source expression. */
export function credentialForExpression(expression) {
  if (expression.includes("FAL_ADMIN_API_KEY")) return "admin";
  if (expression.includes("FAL_API_KEY")) return "generation";
  return null;
}

/**
 * Scan fal setupPolly call sites and associate each with the one FAL_* apiKey
 * expression in its file. Computed setup names remain explicit failures.
 */
export function scanFalCallSites(testsDir) {
  const root = path.resolve(testsDir);
  const files = walkFiles(root, (file) => file.endsWith(".test.ts"));
  const sites = new Map();
  const unresolved = [];
  const apiKeyPattern = /apiKey\s*:\s*([^,\n}]*FAL_[A-Z0-9_]*[^,\n}]*)/g;

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const relativeFile = displayPath(root, file);
    const constants = new Map();
    for (const match of source.matchAll(CONST_RE)) {
      constants.set(match[1], match[2]);
    }

    const keyOccurrences = [...source.matchAll(apiKeyPattern)].map((match) => ({
      expression: match[1].trim().replace(/\s+/g, " "),
      line: lineAt(source, match.index),
    }));
    const distinctExpressions = [
      ...new Set(keyOccurrences.map(({ expression }) => expression)),
    ].sort();
    const fileSites = [];
    const fileUnresolved = [];

    for (const match of source.matchAll(SETUP_RE)) {
      const rawCapture = match[1].trim();
      const line = lineAt(source, match.index);
      const resolved = resolveArg(rawCapture, constants);
      if (resolved === null) {
        fileUnresolved.push(`${relativeFile}:${line}: ${rawCapture}`);
        continue;
      }

      const recordingName = normalizeName(resolved);
      if (!recordingName.startsWith("fal/")) continue;

      const closest = closestOccurrence(keyOccurrences, line);
      fileSites.push({
        recordingName,
        site: {
          file: relativeFile,
          line,
          keyExpression:
            distinctExpressions.length === 1
              ? distinctExpressions[0]
              : distinctExpressions.join(" | "),
          keyLine: closest?.line ?? null,
          distinctExpressionCount: distinctExpressions.length,
        },
      });
    }

    // An unresolvable argument is reported wherever it appears: a computed
    // name could name a fal recording, and there is no way to tell without
    // resolving it. Repo-wide there are zero such captures today.
    unresolved.push(...fileUnresolved);

    for (const { recordingName, site } of fileSites) {
      const existing = sites.get(recordingName);
      if (existing) existing.push(site);
      else sites.set(recordingName, [site]);
    }
  }

  return { sites, unresolved };
}

/** Audit every fal recording against its test file's credential expression. */
export function auditFalCredentialWiring({
  recordingsRoot = path.join(repoRoot, "tests", "recordings"),
  testsDir = path.join(repoRoot, "tests"),
} = {}) {
  const falDir = resolveFalRecordingsDir(recordingsRoot);
  const harFiles = recordingFiles(falDir);
  const { sites, unresolved } = scanFalCallSites(testsDir);
  const failures = new Set(
    unresolved.map((entry) => `unresolvable fal recording argument at ${entry}`)
  );
  const summary = { total: harFiles.length, admin: 0, generation: 0 };

  for (const harPath of harFiles) {
    const relativeDir = path.relative(falDir, path.dirname(harPath));
    const slug = `fal/${dirToRecordingName(relativeDir)}`;
    const { hosts, recordingName } = readRecordingHosts(harPath);
    const classification = classifyHosts(hosts);

    if (
      recordingName !== null &&
      (typeof recordingName !== "string" ||
        normalizeName(recordingName) !== slug)
    ) {
      failures.add(
        `${slug} recording metadata name ${String(recordingName)} does not match its directory slug`
      );
    }

    if (!classification.ok) {
      if (classification.reason === "unknown-host") {
        failures.add(`${slug} has unknown host ${classification.host}`);
      } else {
        failures.add(
          `${slug} mixes credential classes across hosts ${classification.hosts.join(", ")}`
        );
      }
    } else {
      summary[classification.credential]++;
    }

    const recordingSites = sites.get(slug) ?? [];
    if (recordingSites.length === 0) {
      failures.add(`${slug} has no setupPolly call site`);
      continue;
    }
    if (!classification.ok) continue;

    for (const site of recordingSites) {
      if (site.distinctExpressionCount === 0) {
        failures.add(
          `${slug} (${classification.host}) has no FAL_* apiKey expression in ${site.file} ` +
            `(recording site ${site.file}:${site.line})`
        );
        continue;
      }

      if (site.distinctExpressionCount > 1) {
        failures.add(
          `${slug} (${classification.host}) has ambiguous FAL_* apiKey expressions in ` +
            `${site.file}: ${site.keyExpression}; split the file so each holds one ` +
            "credential class, or extend the guard to block-scoped association"
        );
        continue;
      }

      const foundCredential = credentialForExpression(site.keyExpression);
      if (foundCredential === null) {
        failures.add(
          `${slug} (${classification.host}) has an unrecognized credential expression ` +
            `${site.keyExpression} at ${site.file}:${site.keyLine ?? "?"}`
        );
        continue;
      }

      if (foundCredential !== classification.credential) {
        const expected = CREDENTIAL_ENV[classification.credential];
        failures.add(
          `${slug} (${classification.host}) expects process.env.${expected}, ` +
            `found ${site.keyExpression} at ${site.file}:${site.keyLine ?? "?"} ` +
            `(recording site ${site.file}:${site.line})`
        );
      }
    }
  }

  return { summary, failures: [...failures].sort() };
}
