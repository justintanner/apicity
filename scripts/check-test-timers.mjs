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
export function isFalXaiTestFile(relPath) {
  if (!relPath.endsWith(".test.ts")) return false;
  const base = path.basename(relPath);
  const segments = relPath.split(path.sep);
  for (const p of ["fal", "xai"]) {
    if (base === `${p}.test.ts` || base.startsWith(`${p}-`)) return true;
    if (segments.includes(p)) return true;
  }
  return false;
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

function collectFalXaiFiles() {
  const files = [];
  for (const dir of TEST_DIRS) {
    for (const full of walk(path.join(root, dir))) {
      const rel = path.relative(root, full);
      if (isFalXaiTestFile(rel)) files.push(rel);
    }
  }
  return files.sort();
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      "Flags fal/xai test files that use REAL timers instead of " +
        "vi.useFakeTimers().\n\n" +
        "  --list   list the fal/xai test files the guard scans\n" +
        "  --help   show this help"
    );
    return 0;
  }

  const files = collectFalXaiFiles();

  if (argv.includes("--list")) {
    for (const rel of files) console.log(rel);
    console.log(`\n${files.length} fal/xai test files in scope.`);
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
        `regressions (${ALLOWLIST.size} allowlisted).`
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
