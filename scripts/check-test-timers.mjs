#!/usr/bin/env node
// Regression guard for the fal/xai test-speedup epic (ac-6lf6).
//
// The epic converted fal/xai retry/backoff/rate-limit unit tests from REAL
// `setTimeout` sleeps (which actually burned 100+200+400+800ms of wall time per
// test) to `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()`. Without a
// guard, a new fal/xai test that sleeps for real would silently re-introduce the
// slowdown. This check fails the build (exit 1) when a fal/xai test file calls a
// REAL timer (`setTimeout(`, `setInterval(`, or imports `node:timers/promises`)
// without installing fake timers.
//
// Scope (deliberate): ONLY fal/xai test files — the files this epic cleaned up.
// Other providers (kimicoding, fireworks, alibaba, …) still use real-timer
// sleeps in their tests; converting them is separate, larger work tracked in its
// own follow-up bead. Broadening this guard's scope without first converting
// those files would fail the build on a clean tree.
//
// Rule (per file):
//   - Files that call `vi.useFakeTimers()` are EXEMPT: their `setTimeout` is
//     fake-clock-controlled, not a real sleep.
//   - Otherwise, any `setTimeout(` / `setInterval(` CALL or a
//     `node:timers/promises` import is a violation. (String references such as
//     `vi.spyOn(globalThis, "setTimeout")` and identifiers like `setTimeoutSpy`
//     are not calls and do not match.)
//   - ALLOWLIST entries below are documented, audited exceptions.
//
// Usage:
//   node scripts/check-test-timers.mjs           # fail on any new violation
//   node scripts/check-test-timers.mjs --provider xai
//   node scripts/check-test-timers.mjs --list    # list scanned fal/xai files
//   node scripts/check-test-timers.mjs --help
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_DIRS = ["tests/unit", "tests/functional", "tests/integration"];

// Documented, audited exceptions. Key: repo-relative path. Value: why the real
// timer is legitimate. Keep this list short — every entry is a slow-test escape
// hatch, so it must justify itself.
const ALLOWLIST = new Map([
  [
    "tests/integration/xai-documents-search.test.ts",
    'Real sleep is guarded behind `ctx.mode !== "replay"`; it only runs while ' +
      "live-recording the HAR (waiting for xAI to index a document) and never " +
      "executes in replay/CI, so it adds no wall-time to the test suite.",
  ],
]);

// A fal/xai test file: basename is `<p>.test.ts` / `<p>-*.test.ts`, or it lives
// under a `fal/` or `xai/` subdirectory. Mirrors scripts/test-provider.mjs so
// the guard's scope matches `pnpm test:provider fal|xai`.
export function timerGuardProviderForFile(relPath) {
  if (!relPath.endsWith(".test.ts")) return false;
  const base = path.basename(relPath);
  const segments = relPath.split(path.sep);
  for (const p of ["fal", "xai"]) {
    if (base === `${p}.test.ts` || base.startsWith(`${p}-`)) return p;
    if (segments.includes(p)) return p;
  }
  return "";
}

export function isFalXaiTestFile(relPath) {
  return Boolean(timerGuardProviderForFile(relPath));
}

// Pure detector: returns the real-timer violations in a single file's source.
// Exported so tests can seed a violation and assert the guard catches it.
export function findTimerViolations(source) {
  // Fake timers installed → setTimeout/setInterval are clock-controlled, not
  // real sleeps. Treat the whole file as safe.
  if (/\bvi\.useFakeTimers\s*\(/.test(source)) return [];

  const violations = [];
  const lines = source.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let code = lines[i];

    // Strip block comments (/* ... */) so commented examples don't trip us.
    if (inBlockComment) {
      const end = code.indexOf("*/");
      if (end === -1) continue;
      code = code.slice(end + 2);
      inBlockComment = false;
    }
    code = code.replace(/\/\*.*?\*\//g, "");
    const open = code.indexOf("/*");
    if (open !== -1) {
      inBlockComment = true;
      code = code.slice(0, open);
    }
    // Strip line comments.
    code = code.replace(/\/\/.*$/, "");

    if (/\b(?:setTimeout|setInterval)\s*\(/.test(code)) {
      violations.push({
        line: i + 1,
        rule: "real-timer-call",
        code: lines[i].trim(),
      });
    }
    if (/\bfrom\s+["']node:timers\/promises["']/.test(code)) {
      violations.push({
        line: i + 1,
        rule: "node-timers-promises",
        code: lines[i].trim(),
      });
    }
  }
  return violations;
}

function parseArgs(argv) {
  const options = {
    providers: new Set(),
    list: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--list") {
      options.list = true;
      continue;
    }
    if (arg === "--provider" || arg === "--providers") {
      if (i + 1 >= argv.length) {
        throw new Error(`${arg} requires a comma-separated provider list`);
      }
      i++;
      addProviders(options.providers, argv[i]);
      continue;
    }
    if (arg.startsWith("--provider=") || arg.startsWith("--providers=")) {
      addProviders(options.providers, arg.slice(arg.indexOf("=") + 1));
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function addProviders(providers, value) {
  for (const provider of value.split(",")) {
    const normalized = provider.trim();
    if (normalized) providers.add(normalized);
  }
}

function usage() {
  console.log(
    "Flags fal/xai test files that use REAL timers instead of " +
      "vi.useFakeTimers().\n\n" +
      "  --provider <list>  comma-separated provider filter, e.g. fal,xai\n" +
      "  --list             list the fal/xai test files the guard scans\n" +
      "  --help             show this help"
  );
}

function selectedTimerProviders(providers) {
  const selected = new Set();
  for (const provider of providers) {
    if (provider === "fal" || provider === "xai") selected.add(provider);
  }
  return selected;
}

function scopeLabel(providers) {
  return providers.size > 0 ? ` [providers: ${[...providers].join(", ")}]` : "";
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function collectFalXaiFiles(providers = new Set()) {
  const selected = selectedTimerProviders(providers);
  if (providers.size > 0 && selected.size === 0) return [];

  const files = [];
  for (const dir of TEST_DIRS) {
    for (const full of walk(path.join(root, dir))) {
      const rel = path.relative(root, full);
      const provider = timerGuardProviderForFile(rel);
      if (provider && (selected.size === 0 || selected.has(provider))) {
        files.push(rel);
      }
    }
  }
  return files.sort();
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  if (options.help) {
    usage();
    return 0;
  }

  const files = collectFalXaiFiles(options.providers);
  const label = scopeLabel(options.providers);

  if (options.list) {
    for (const rel of files) console.log(rel);
    console.log(`\n${files.length} fal/xai test files in scope${label}.`);
    return 0;
  }

  if (files.length === 0 && options.providers.size > 0) {
    console.log(`✓ check-test-timers: no fal/xai test files in scope${label}.`);
    return 0;
  }

  const offenders = [];
  for (const rel of files) {
    if (ALLOWLIST.has(rel)) continue;
    const source = fs.readFileSync(path.join(root, rel), "utf8");
    const violations = findTimerViolations(source);
    if (violations.length > 0) offenders.push({ rel, violations });
  }

  if (offenders.length === 0) {
    console.log(
      `✓ check-test-timers: ${files.length} fal/xai test files, no real-timer ` +
        `regressions (${ALLOWLIST.size} allowlisted)${label}.`
    );
    return 0;
  }

  console.error("✗ check-test-timers: real timers found in fal/xai tests.\n");
  console.error(
    "These files sleep on the real clock, which slows the suite. Use " +
      "vi.useFakeTimers() + vi.advanceTimersByTimeAsync(), as in " +
      "tests/unit/xai-middleware.test.ts. If the real timer is unavoidable " +
      "(e.g. record-only paths), add the file to ALLOWLIST in " +
      "scripts/check-test-timers.mjs with a reason.\n"
  );
  for (const { rel, violations } of offenders) {
    console.error(`  ${rel}`);
    for (const v of violations) {
      console.error(`    ${rel}:${v.line}  [${v.rule}]  ${v.code}`);
    }
  }
  console.error(`\n${offenders.length} file(s) with real-timer regressions.`);
  return 1;
}

// Run as CLI only (importing for tests must not exit the process).
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}
