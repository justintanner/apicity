#!/usr/bin/env node
// Audit the installed pnpm dependency graph with npm's supported bulk advisory
// endpoint. pnpm 10 uses npm endpoints that were retired in 2026-07.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BULK_AUDIT_URL =
  "https://registry.npmjs.org/-/npm/v1/security/advisories/bulk";
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

function installedPackages() {
  const result = spawnSync(
    "pnpm",
    ["list", "--recursive", "--depth", "Infinity", "--json", "--lockfile-only"],
    { encoding: "utf8" }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "pnpm list failed");
  }
  return collectPackages(JSON.parse(result.stdout));
}

async function main() {
  const auditLevel = parseArgs(process.argv.slice(2));
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
  console.log(`Audited ${Object.keys(packages).length} resolved packages.`);
  if (findings.length === 0) {
    console.log("No known vulnerabilities found");
    return;
  }

  const noun = findings.length === 1 ? "vulnerability" : "vulnerabilities";
  console.error(`${findings.length} ${auditLevel}-or-higher ${noun} found:`);
  for (const finding of findings) {
    console.error(
      `- ${finding.severity} ${finding.packageName}: ${finding.title}` +
        (finding.url ? ` (${finding.url})` : "")
    );
  }
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
