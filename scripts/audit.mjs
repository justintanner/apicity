#!/usr/bin/env node
// Audit the installed pnpm dependency graph with npm's supported bulk advisory
// endpoint. pnpm 10 uses npm endpoints that were retired in 2026-07.
//
// scripts/audit-exceptions.json lists advisories the gate lets through for a
// limited time because no patched release exists. An entry names one advisory
// (GHSA id) on one package, the reason, and the UTC date the gate fails again.
// Every run prints each active entry. The gate fails on an expired entry, on
// an entry that matches no current advisory, and on every other advisory.
// Adding, extending or renewing an entry is an audit policy change: it needs
// an operator decision, never a lane's own call.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EXCEPTIONS_FILE = "scripts/audit-exceptions.json";
const EXCEPTIONS_URL = new URL("./audit-exceptions.json", import.meta.url);
const EXCEPTION_FIELDS = ["advisory", "package", "reason", "expires"];
const GHSA_ID = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/;
const ADVISORY_URL_GHSA_ID =
  /\/advisories\/(GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4})\/?$/i;
const DAY_MS = 24 * 60 * 60 * 1000;

const BULK_AUDIT_URL =
  "https://registry.npmjs.org/-/npm/v1/security/advisories/bulk";
const PNPM_LIST_MAX_BUFFER = 16 * 1024 * 1024;
const SEVERITY_RANK = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function isResolvedVersion(version) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
    version
  );
}

export function collectPackages(projects) {
  const packages = Object.create(null);

  function collectDependencies(entry) {
    if (!entry || typeof entry !== "object") return;
    for (const field of DEPENDENCY_FIELDS) {
      const dependencies = entry[field];
      if (!dependencies || typeof dependencies !== "object") continue;

      for (const [name, dependency] of Object.entries(dependencies)) {
        if (!dependency || typeof dependency !== "object") continue;
        if (typeof dependency.version === "string") {
          const version = dependency.version;
          if (isResolvedVersion(version)) {
            const versions = packages[name] ?? (packages[name] = new Set());
            versions.add(version);
          }
        }
        collectDependencies(dependency);
      }
    }
  }

  for (const project of projects) collectDependencies(project);

  return Object.fromEntries(
    Object.entries(packages).map(([name, versions]) => [name, [...versions]])
  );
}

export function selectAdvisories(report, auditLevel) {
  const minimumRank = SEVERITY_RANK[auditLevel];
  if (minimumRank === undefined) {
    throw new Error(`Unknown audit level: ${auditLevel}`);
  }

  const findings = [];
  for (const [packageName, advisories] of Object.entries(report)) {
    if (!Array.isArray(advisories)) continue;
    for (const advisory of advisories) {
      const severity = String(advisory.severity ?? "").toLowerCase();
      if ((SEVERITY_RANK[severity] ?? -1) < minimumRank) continue;
      findings.push({
        id: advisory.id,
        packageName,
        severity,
        title: advisory.title ?? "Untitled advisory",
        url: advisory.url,
      });
    }
  }
  return findings;
}

/**
 * @typedef {object} AuditFinding
 * @property {unknown} id
 * @property {string} packageName
 * @property {string} severity
 * @property {string} title
 * @property {unknown} url
 */

/**
 * One entry of scripts/audit-exceptions.json.
 *
 * @typedef {object} AuditException
 * @property {string} advisory GHSA id of the excepted advisory.
 * @property {string} package npm package the advisory is reported against.
 * @property {string} reason Why the gate lets it through, and who decided.
 * @property {string} expires UTC date (YYYY-MM-DD) the gate fails again from.
 */

/** @param {unknown} value */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value */
function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}

/**
 * Parse and validate the text of scripts/audit-exceptions.json. Strict on
 * purpose: a misspelled field must fail the gate, not make an entry that
 * never expires.
 *
 * @param {string} text
 * @returns {AuditException[]}
 */
export function parseAuditExceptions(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `${EXCEPTIONS_FILE} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  if (
    !isPlainObject(data) ||
    Object.keys(data).join(",") !== "exceptions" ||
    !Array.isArray(data.exceptions)
  ) {
    throw new Error(
      `${EXCEPTIONS_FILE} must be an object whose only key is "exceptions", an array`
    );
  }

  const seen = new Set();
  return data.exceptions.map((entry, index) => {
    const where = `${EXCEPTIONS_FILE} exceptions[${index}]`;
    if (!isPlainObject(entry)) throw new Error(`${where} must be an object`);
    for (const field of EXCEPTION_FIELDS) {
      const value = entry[field];
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${where}.${field} must be a non-empty string`);
      }
    }
    const unknown = Object.keys(entry).filter(
      (key) => !EXCEPTION_FIELDS.includes(key)
    );
    if (unknown.length > 0) {
      throw new Error(`${where} has unknown field(s): ${unknown.join(", ")}`);
    }
    const { advisory, package: packageName, reason, expires } = entry;
    if (!GHSA_ID.test(advisory)) {
      throw new Error(
        `${where}.advisory must be a GHSA id (GHSA-xxxx-xxxx-xxxx)`
      );
    }
    if (packageName !== packageName.trim()) {
      throw new Error(`${where}.package must not have surrounding whitespace`);
    }
    if (!isCalendarDate(expires)) {
      throw new Error(`${where}.expires must be a real UTC date, YYYY-MM-DD`);
    }
    const key = `${advisory} ${packageName}`;
    if (seen.has(key)) {
      throw new Error(`${where} repeats ${advisory} on ${packageName}`);
    }
    seen.add(key);
    return { advisory, package: packageName, reason, expires };
  });
}

/**
 * The GHSA id in an advisory URL from the bulk feed, lower-cased, or null.
 * The feed's numeric `id` is reissued when an advisory is revised, so the
 * GHSA id in `url` is the only stable key.
 *
 * @param {unknown} url
 * @returns {string | null}
 */
export function advisoryGhsaId(url) {
  const match = ADVISORY_URL_GHSA_ID.exec(typeof url === "string" ? url : "");
  return match ? match[1].toLowerCase() : null;
}

/**
 * Split the selected findings into blocking and excepted ones.
 *
 * An exception covers a finding only when the package name and the GHSA id
 * both match and `today` is before `expires`. An expired exception covers
 * nothing and is a problem; so is a live one that matches no finding.
 *
 * @param {AuditFinding[]} findings
 * @param {AuditException[]} exceptions
 * @param {string} today UTC date, YYYY-MM-DD.
 * @returns {{
 *   blocking: AuditFinding[],
 *   excepted: { finding: AuditFinding, exception: AuditException, daysLeft: number }[],
 *   problems: string[],
 * }}
 */
export function applyAuditExceptions(findings, exceptions, today) {
  if (!isCalendarDate(today)) {
    throw new Error(`Invalid audit date: ${String(today)}`);
  }
  const excepted = [];
  const problems = [];
  const covered = new Set();

  for (const exception of exceptions) {
    const name = `${exception.advisory} on ${exception.package}`;
    if (today >= exception.expires) {
      problems.push(
        `${name} expired on ${exception.expires}. Remove it from ` +
          `${EXCEPTIONS_FILE}; renewing it needs a new operator decision.`
      );
      continue;
    }
    const matches = findings.filter(
      (finding) =>
        finding.packageName === exception.package &&
        advisoryGhsaId(finding.url) === exception.advisory.toLowerCase()
    );
    if (matches.length === 0) {
      problems.push(
        `${name} matches no current advisory. Remove it from ${EXCEPTIONS_FILE}.`
      );
      continue;
    }
    const daysLeft = Math.round(
      (Date.parse(`${exception.expires}T00:00:00Z`) -
        Date.parse(`${today}T00:00:00Z`)) /
        DAY_MS
    );
    for (const finding of matches) {
      covered.add(finding);
      excepted.push({ finding, exception, daysLeft });
    }
  }

  return {
    blocking: findings.filter((finding) => !covered.has(finding)),
    excepted,
    problems,
  };
}

/** @param {AuditFinding} finding */
function describeFinding(finding) {
  return (
    `- ${finding.severity} ${finding.packageName}: ${finding.title}` +
    (finding.url ? ` (${finding.url})` : "")
  );
}

/**
 * Decide the gate and render what it prints after the package count.
 *
 * @param {AuditFinding[]} findings
 * @param {AuditException[]} exceptions
 * @param {string} today UTC date, YYYY-MM-DD.
 * @param {string} auditLevel
 * @returns {{ failed: boolean, lines: { stream: "log" | "error", text: string }[] }}
 */
export function auditReport(findings, exceptions, today, auditLevel) {
  const { blocking, excepted, problems } = applyAuditExceptions(
    findings,
    exceptions,
    today
  );
  /** @type {{ stream: "log" | "error", text: string }[]} */
  const lines = [];
  /** @param {string} text */
  const error = (text) => lines.push({ stream: "error", text });

  if (excepted.length > 0) {
    error(
      `Audit exception active (${excepted.length}): known and unfixed, let ` +
        `through until the date shown.`
    );
    for (const { finding, exception, daysLeft } of excepted) {
      error(describeFinding(finding));
      error(
        `  excepted until ${exception.expires} (${daysLeft} ` +
          `${daysLeft === 1 ? "day" : "days"} left): ${exception.reason}`
      );
    }
  }

  const failed = blocking.length > 0 || problems.length > 0;
  if (!failed) {
    lines.push({
      stream: "log",
      text:
        excepted.length === 0
          ? "No known vulnerabilities found"
          : "No other known vulnerabilities found",
    });
    return { failed, lines };
  }

  if (blocking.length > 0) {
    const noun = blocking.length === 1 ? "vulnerability" : "vulnerabilities";
    error(`${blocking.length} ${auditLevel}-or-higher ${noun} found:`);
    for (const finding of blocking) error(describeFinding(finding));
  }
  if (problems.length > 0) {
    const noun = problems.length === 1 ? "problem" : "problems";
    error(`${problems.length} audit exception ${noun}:`);
    for (const problem of problems) error(`- ${problem}`);
  }
  return { failed, lines };
}

function parseArgs(argv) {
  let auditLevel = "moderate";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--audit-level") {
      auditLevel = argv[++i] ?? "";
    } else if (arg.startsWith("--audit-level=")) {
      auditLevel = arg.slice("--audit-level=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (SEVERITY_RANK[auditLevel] === undefined) {
    throw new Error(`Unknown audit level: ${auditLevel}`);
  }
  return auditLevel;
}

/**
 * Result shape consumed by {@link installedPackages}. Only the fields the
 * function reads are declared, so a test can inject a small honest fake
 * without satisfying the full `spawnSync` overload set. `spawnSync`'s richer
 * `SpawnSyncReturns` remains assignable to this shape.
 *
 * @typedef {object} PnpmListResult
 * @property {Error} [error]
 * @property {number | null} status
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * Collect resolved dependency versions from the `pnpm list` inventory. The
 * command runner is injectable for testing and typed by the fields this
 * function reads, not the full `spawnSync` overload set; `spawnSync` (the
 * default) remains assignable to it.
 *
 * @param {(command: string, args: readonly string[], options: import("node:child_process").SpawnSyncOptionsWithStringEncoding) => PnpmListResult} [runCommand]
 * @returns {Record<string, string[]>}
 */
export function installedPackages(runCommand = spawnSync) {
  const result = runCommand(
    "pnpm",
    ["list", "--recursive", "--depth", "Infinity", "--json", "--lockfile-only"],
    { encoding: "utf8", maxBuffer: PNPM_LIST_MAX_BUFFER }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "pnpm list failed");
  }
  return collectPackages(JSON.parse(result.stdout));
}

async function main() {
  const auditLevel = parseArgs(process.argv.slice(2));
  const exceptions = parseAuditExceptions(readFileSync(EXCEPTIONS_URL, "utf8"));
  const packages = installedPackages();
  const response = await fetch(BULK_AUDIT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(packages),
  });
  if (!response.ok) {
    throw new Error(
      `npm bulk advisory request failed (${response.status}): ${(
        await response.text()
      ).slice(0, 500)}`
    );
  }

  const findings = selectAdvisories(await response.json(), auditLevel);
  const report = auditReport(
    findings,
    exceptions,
    new Date().toISOString().slice(0, 10),
    auditLevel
  );
  console.log(`Audited ${Object.keys(packages).length} resolved packages.`);
  for (const line of report.lines) {
    if (line.stream === "error") console.error(line.text);
    else console.log(line.text);
  }
  if (report.failed) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
