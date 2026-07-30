#!/usr/bin/env node
// Regression guard for ignore patterns that shadow TRACKED files (ac-90e8p9).
//
// `ac-8xf2p3` quieted a red `format:check` in shared rig checkouts by hand-adding
// scratch classes to `.prettierignore` and to `ignores` in `eslint.config.mjs`.
// Both are enumerated lists, and an enumerated ignore list fails in two
// directions that are NOT symmetrical:
//
//   - the NOISY direction — a scratch class no pattern covers. `format:check`
//     goes red for reasons unrelated to the change under test. Loud, and it
//     announces itself.
//   - the DANGEROUS direction — a pattern grows until it shadows a file that is
//     actually tracked. Nothing goes red. The file silently stops being checked
//     and ships unformatted or unlinted, and the gate still reports green.
//
// This check asserts ONLY the dangerous direction: "no tracked file is hidden
// from a gate". The inverse ("every untracked path is ignored") is deliberately
// NOT asserted — it is permanently noisy in agent checkouts, where untracked
// scratch is the normal state, and asserting it would recreate the exact
// failure mode `ac-8xf2p3` existed to remove.
//
// Input: `git ls-files`, never a filesystem walk. Two axes are evaluated —
// Prettier's ignore configuration (`.prettierignore` + the root `.gitignore`)
// and ESLint's flat-config `ignores`. Files already shadowed today are recorded
// in BASELINE as documented classes; the check's value is what it says about
// the NEXT entry.
//
// HERMETICITY — the part that is easy to get wrong.
//   Taking the input from `git ls-files` makes the input set untracked-blind. It
//   does NOT make the verdicts untracked-blind. `git check-ignore` run in this
//   repository consults every `.gitignore` in the working tree — tracked or not
//   — plus `.git/info/exclude` and the developer's global `core.excludesFile`,
//   all at higher precedence than the file we care about. Prettier's default
//   `--ignore-path` reads only the root `.gitignore` and `.prettierignore`. One
//   untracked `scripts/.gitignore` is therefore enough to make a naive
//   implementation report a tracked, Prettier-checked script as shadowed: a
//   checkout-dependent false-positive gate failure, i.e. the new source of
//   local-only red.
//
//   So the Prettier axis is evaluated inside a throwaway `git init` repository
//   under the OS temp directory, carrying copies of exactly two files — the root
//   `.gitignore` and `.prettierignore` — with `info/exclude` truncated and
//   global/system git config pinned to an empty file. The verdict is a function
//   of those two files and the `git ls-files` list, and of nothing else in the
//   working tree or the environment. No nested `.gitignore` can mask a root
//   match, because none is present to mask it.
//
//   Known limit of the model: `.prettierignore` is supplied via
//   `core.excludesFile`, which git ranks BELOW `.gitignore`, whereas Prettier
//   applies both ignore files together. Where the two files disagree about one
//   path the resolved answer is not guaranteed to match Prettier's. Measured
//   set-identical on the tree at `f6a9798b` (~99 paths, zero difference in
//   either direction against a `prettier.getFileInfo` loop over every tracked
//   file). The git form is also ~900x faster: 20 ms against 18 s.
//
// BASELINE CLASSES — a class glob broader than the file set it was written for
// is a hole. `packages/provider/*/README.md` reads like the generated-README
// class, but it also matches `packages/provider/cost/README.md`, which is
// hand-written and stays in the gate solely because of the
// `!packages/provider/cost/README.md` negation in `.prettierignore`. The day
// that negation is deleted, the class would absorb the file and the guard would
// stay green on the one README the design singles out as deliberately checked.
// Classes must therefore be written as tightly as the rationale that justifies
// them; where tightness is not enough, SENTINELS below names the file outright.
//
// ESLINT ATTRIBUTION — flat config does not expose WHICH `ignores` entry matched
// (`calculateConfigForFile` throws for ignored paths). Failures on that axis are
// attributed to `eslint.config.mjs` with no line number, and the report says so
// rather than printing a misleading one.
//
// Usage:
//   node scripts/check-ignore-shadow.mjs          # fail on any unbaselined shadow
//   node scripts/check-ignore-shadow.mjs --list   # list every shadowed tracked file
//   node scripts/check-ignore-shadow.mjs --help
//
// There is deliberately no `--fix`: auto-adding a baseline entry would defeat
// the guard.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Requirements mechanic 3: ESLint's `isPathIgnored` conflates "ignored" with
// "not a lintable file type". Flat config has no `files` entry for `.md`,
// `.json`, `.har` and most of the tree, so it returns true for roughly half of
// every tracked file. Filtering to the extensions the flat config actually
// lints cuts that to a few dozen, which is the usable signal. This filter is
// load-bearing, not cosmetic — without it the ESLint axis is meaningless.
// The current absolutes are printed by `--list`; they are deliberately not
// pinned here, because a comment that names a count goes stale in silence.
//
// The authority is the *resolved* config, not the literal `files:` blocks in
// `eslint.config.mjs`. `.cts` and `.mts` appear in neither, yet the spread-in
// `tseslint.configs.recommended` still lints them — `isPathIgnored` is false
// for both. Re-check with `isPathIgnored("probe.cts")` after changing that
// config: an extension missing here is a file the ESLint axis never examines
// and never reports. No `.cts`/`.mts` file is tracked today, so including them
// changes no current count; the point is that the first one to land reaches
// this axis.
const LINTABLE = /\.(?:js|mjs|cjs|ts|tsx|cts|mts)$/;

const PRETTIER = "prettier";
const ESLINT = "eslint";
const ESLINT_SOURCE = "eslint.config.mjs";

// Documented baseline: tracked files that are deliberately shadowed today.
// `axis` scopes each class so a Prettier-only rationale cannot silence an
// ESLint finding, and so staleness can be evaluated per axis.
const BASELINE = [
  {
    id: "generated-examples-json",
    axis: PRETTIER,
    // Deliberately NOT narrowed the way `generated-readmes` is, even though
    // both globs have the same 29-provider-directories / 28-matched-files
    // shape: `packages/provider/cost/` has no `src/example.*` at all, and no
    // negation protects one. If cost ever gained one it would be generated
    // too, so absorption by this class would be correct.
    globs: ["packages/provider/*/src/example.json"],
    why:
      "Written by `pnpm run gen:examples`; the generator owns the formatting " +
      "and `gen:examples:check` guards drift, so Prettier has nothing to add.",
  },
  {
    id: "generated-examples-ts",
    axis: "both",
    globs: ["packages/provider/*/src/example.ts"],
    why:
      "Written by `pnpm run gen:examples` as a JSON-shaped TS literal. Ignored " +
      "on both axes: the generator owns formatting, and linting a generated " +
      "literal reports on the generator rather than on anything a human edits.",
  },
  {
    id: "generated-readmes",
    axis: PRETTIER,
    globs: ["packages/provider/*/README.md"],
    // Narrowed deliberately — see SENTINELS and the header note on class
    // breadth. `cost/README.md` is hand-written and is excluded from the shadow
    // set only by the `!packages/provider/cost/README.md` negation; if it ever
    // becomes shadowed it must surface, not be absorbed by this class.
    except: ["packages/provider/cost/README.md"],
    why:
      "Written by `pnpm run doc-gen` (scripts/doc-gen.mjs); the generator owns " +
      "the formatting. Excludes cost/README.md, which is hand-written.",
  },
  {
    id: "beads-tool-state",
    axis: PRETTIER,
    globs: [".beads/**"],
    why:
      "config.yaml, metadata.json, issues.jsonl, PRIME.md and formulas are " +
      "written and rewritten by the beads CLI, not by a human. Checking them " +
      "makes `format:check` fail whenever the tooling rewrites them.",
  },
  {
    id: "pnpm-lock",
    axis: PRETTIER,
    globs: ["pnpm-lock.yaml"],
    why: "Lockfile owned by pnpm; reformatting it would fight the package manager.",
  },
  {
    id: "gitignored-yet-tracked",
    axis: PRETTIER,
    globs: ["CLAUDE.md", "test-branch-protection.txt"],
    why:
      "Named in `.gitignore` yet tracked, so Prettier 3 — which reads " +
      "`.gitignore` by default since 3.0 — skips them. Recorded here because " +
      "the shadow comes from `.gitignore`, which this bead does not edit.",
  },
  {
    id: "omp-hook",
    axis: ESLINT,
    globs: [".omp/hooks/gc-hook.ts"],
    why:
      "DEBT MARKER, not an endorsement. A genuinely shadowed tracked file: the " +
      "pre-existing `.omp/**` entry hides it from ESLint and nobody noticed. " +
      "Un-shadowing it is explicitly out of scope for ac-90e8p9 (it has its " +
      "own lint fallout); this entry records the status quo so the follow-up " +
      "bead can find it.",
  },
  {
    id: "opencode-plugin",
    axis: ESLINT,
    globs: [".opencode/plugins/gascity.js"],
    why:
      "DEBT MARKER, not an endorsement. The second and last genuinely shadowed " +
      "tracked file in the repository, hidden by the pre-existing " +
      "`.opencode/**` entry. Same out-of-scope reasoning as `omp-hook`.",
  },
];

// Staleness is keyed by `id`, so two classes sharing one would share a counter
// and the dead one could never be reported stale — the exact rot this guard
// exists to prevent, in the guard itself. Reachable the first time a class is
// copied and its globs edited but not its id.
const baselineIds = new Set(BASELINE.map((entry) => entry.id));
if (baselineIds.size !== BASELINE.length) {
  throw new Error("BASELINE ids must be unique — staleness is keyed by id.");
}

// Files asserted to never be shadowed, whatever BASELINE says. A sentinel is
// checked before classification, so no baseline class can absorb it.
const SENTINELS = [
  {
    path: "packages/provider/cost/README.md",
    axis: PRETTIER,
    // Cites the PATTERN TEXT, not a line number: this string is printed to a
    // developer while the gate is red, and inserting one line above the
    // negation would otherwise point them at the wrong place.
    why:
      "Hand-written, and kept in `format:check` only by the " +
      "`!packages/provider/cost/README.md` negation in `.prettierignore`, " +
      "which sits below the `packages/provider/*/README.md` pattern. If it is " +
      "shadowed, either that negation was deleted or a broader pattern landed " +
      "below it.",
  },
];

// Parses the NUL-framed `git check-ignore -z -v` stream: four fields per record
// — source, linenum, pattern, pathname. The `-z` form is what makes this robust
// for paths containing spaces or colons, unlike the `source:line:pattern\tpath`
// text form.
//
// NEGATION: `-v` also prints records for paths matched by a NEGATION pattern,
// and such a path is NOT ignored. On this tree the plain form prints 99 paths
// while `-v` prints 100 records; the extra one is
// `.prettierignore:9 !packages/provider/cost/README.md`. An implementation that
// trusts the `-v` record count reports that deliberately-checked file as
// shadowed. `!`-prefixed records are therefore dropped here.
export function parseCheckIgnoreRecords(stdout) {
  const fields = stdout.split("\0");
  // Trailing NUL leaves an empty final element; drop it before chunking.
  if (fields.length > 0 && fields[fields.length - 1] === "") fields.pop();

  const records = [];
  for (let i = 0; i + 3 < fields.length; i += 4) {
    const [source, line, pattern, filePath] = fields.slice(i, i + 4);
    if (pattern.startsWith("!")) continue;
    records.push({
      path: filePath,
      source,
      line: line === "" ? null : Number(line),
      pattern,
    });
  }
  return records;
}

// `git check-ignore` exits 1 when NO path matches and 0 when at least one does.
// `execFileSync` throws on non-zero exit, so an empty shadow set — reachable if
// the generated-artifact patterns are ever retired — would crash the guard
// instead of printing `✓`. Accept 0 and 1; anything higher is a real failure.
export function recordsFromCheckIgnore({ status, stdout, stderr }) {
  if (status !== 0 && status !== 1) {
    throw new Error(
      `git check-ignore exited ${status}: ${(stderr || "").trim()}`
    );
  }
  return parseCheckIgnoreRecords(stdout || "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesSegment(segment, name) {
  if (!segment.includes("*")) return segment === name;
  const source = segment.split("*").map(escapeRegExp).join("[^/]*");
  return new RegExp(`^${source}$`).test(name);
}

function matchesFrom(globSegments, gi, pathSegments, pi) {
  while (gi < globSegments.length) {
    const segment = globSegments[gi];
    if (segment === "**") {
      // `**` matches zero or more path segments.
      for (let next = pi; next <= pathSegments.length; next++) {
        if (matchesFrom(globSegments, gi + 1, pathSegments, next)) return true;
      }
      return false;
    }
    if (pi >= pathSegments.length) return false;
    if (!matchesSegment(segment, pathSegments[pi])) return false;
    gi++;
    pi++;
  }
  return pi === pathSegments.length;
}

// Minimal glob matcher for the baseline classes: `*` within a path segment and
// `**` across segments is all eight classes need, and adding a dependency for
// this would rewrite `pnpm-lock.yaml`.
export function matchesGlob(glob, filePath) {
  return matchesFrom(glob.split("/"), 0, filePath.split("/"), 0);
}

function classCoversAxis(entry, axis) {
  return entry.axis === "both" || entry.axis === axis;
}

function classMatches(entry, filePath) {
  if ((entry.except || []).some((glob) => matchesGlob(glob, filePath))) {
    return false;
  }
  return entry.globs.some((glob) => matchesGlob(glob, filePath));
}

// Splits the shadowed set into baselined, unexplained, and sentinel violations,
// and reports baseline classes that no longer match anything.
//
// `shadowed` is `{ prettier: [record], eslint: [record] }`, where a record is
// `{ path, source, line, pattern }`. Pure, so the unit test can seed a synthetic
// shadowed file without a subprocess.
export function evaluateShadowSets(
  shadowed,
  baseline = BASELINE,
  sentinels = SENTINELS
) {
  const axes = [
    [PRETTIER, shadowed.prettier || []],
    [ESLINT, shadowed.eslint || []],
  ];

  const baselined = [];
  const unexplained = [];
  const sentinelHits = [];
  // Per-axis match counts, so an `axis: "both"` class must justify itself on
  // EACH declared axis. Union semantics would let a `both` class keep matching
  // on one axis after the other's pattern is retired, and the dead half would
  // never surface.
  const matchCounts = new Map(
    baseline.map((entry) => [entry.id, { [PRETTIER]: 0, [ESLINT]: 0 }])
  );

  for (const [axis, records] of axes) {
    for (const record of records) {
      const sentinel = sentinels.find(
        (s) => s.path === record.path && classCoversAxis(s, axis)
      );
      if (sentinel) {
        sentinelHits.push({ axis, ...record, why: sentinel.why });
        continue;
      }
      const entry = baseline.find(
        (candidate) =>
          classCoversAxis(candidate, axis) &&
          classMatches(candidate, record.path)
      );
      if (entry) {
        matchCounts.get(entry.id)[axis]++;
        baselined.push({ axis, ...record, classId: entry.id });
      } else {
        unexplained.push({ axis, ...record });
      }
    }
  }

  const stale = [];
  for (const entry of baseline) {
    const counts = matchCounts.get(entry.id);
    for (const axis of [PRETTIER, ESLINT]) {
      if (classCoversAxis(entry, axis) && counts[axis] === 0) {
        stale.push({ id: entry.id, axis });
      }
    }
  }

  return { baselined, unexplained, sentinelHits, stale };
}

function gitEnv() {
  // Strip inherited git state so `cwd` alone decides which repository is read.
  const env = { ...process.env };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_COMMON_DIR",
    "GIT_INDEX_FILE",
    "GIT_OBJECT_DIRECTORY",
  ]) {
    delete env[key];
  }
  return env;
}

function trackedFiles() {
  // Raw Buffer, not a decoded string, so the NUL framing survives the pipe.
  const stdout = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    env: gitEnv(),
    maxBuffer: 256 * 1024 * 1024,
  });
  return {
    buffer: stdout,
    list: stdout.toString("utf8").split("\0").filter(Boolean),
  };
}

// Evaluates the Prettier axis inside a throwaway git repository holding copies
// of exactly `.gitignore` and `.prettierignore` — see the hermeticity note in
// the header comment.
function collectPrettierShadowed(trackedBuffer) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-ignore-shadow-"));
  try {
    const emptyConfig = path.join(dir, "empty-gitconfig");
    fs.writeFileSync(emptyConfig, "");
    const env = {
      ...gitEnv(),
      GIT_CONFIG_GLOBAL: emptyConfig,
      GIT_CONFIG_SYSTEM: emptyConfig,
    };

    execFileSync("git", ["init", "-q", "-b", "main", dir], {
      cwd: dir,
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });
    // Templates can seed an `info/exclude`; truncate it so nothing but the two
    // copied files can influence a verdict.
    fs.writeFileSync(path.join(dir, ".git", "info", "exclude"), "");
    for (const name of [".gitignore", ".prettierignore"]) {
      fs.copyFileSync(path.join(root, name), path.join(dir, name));
    }

    const prettierIgnore = path.join(dir, ".prettierignore");
    const result = runCheckIgnore(dir, prettierIgnore, trackedBuffer, env);
    // Report `.prettierignore` by its repo-relative name, not the temp path.
    return result.map((record) =>
      record.source === prettierIgnore
        ? { ...record, source: ".prettierignore" }
        : record
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runCheckIgnore(cwd, excludesFile, trackedBuffer, env) {
  const args = [
    "-c",
    `core.excludesFile=${excludesFile}`,
    "check-ignore",
    "--no-index",
    "--stdin",
    "-z",
    "-v",
  ];
  try {
    const stdout = execFileSync("git", args, {
      cwd,
      env,
      input: trackedBuffer,
      maxBuffer: 256 * 1024 * 1024,
    });
    return recordsFromCheckIgnore({
      status: 0,
      stdout: stdout.toString("utf8"),
    });
  } catch (error) {
    return recordsFromCheckIgnore({
      status: typeof error.status === "number" ? error.status : 2,
      stdout: error.stdout ? error.stdout.toString("utf8") : "",
      stderr: error.stderr ? error.stderr.toString("utf8") : String(error),
    });
  }
}

async function collectEslintShadowed(lintable) {
  if (lintable.length === 0) return [];
  // Imported lazily so `--help` and the unit test do not pay for loading ESLint.
  const { ESLint } = await import("eslint");
  const eslint = new ESLint({ cwd: root });
  // Resolving the flat config array is a one-off that the first
  // `isPathIgnored` pays for; every later call is served from that cache.
  // That resolve, not the fan-out, dominates this axis — measured at ~0.65 s
  // against ~0.16 s for the entire batched tail. The `await` before the
  // `Promise.all` is what makes that asymmetry visible: one call pays, the
  // rest are cache hits. Flattening it into a single `Promise.all` measures
  // no faster (means within ~5%, ranges overlapping), so there is nothing to
  // gain by tidying the split away.
  const [first, ...rest] = lintable;
  const verdicts = [
    await eslint.isPathIgnored(first),
    ...(await Promise.all(rest.map((f) => eslint.isPathIgnored(f)))),
  ];
  return lintable
    .filter((_, index) => verdicts[index])
    .map((filePath) => ({
      path: filePath,
      source: ESLINT_SOURCE,
      line: null,
      pattern: null,
    }));
}

function describeRecord(record) {
  // Branches on the axis, not on the source filename: both call sites carry
  // `axis`, and renaming `eslint.config.mjs` must not turn this into
  // `ignored by eslint.config.mjs:null [null]`.
  if (record.axis === ESLINT) {
    return `ignored by ${ESLINT_SOURCE} \`ignores\`  [no line info from flat config]`;
  }
  return `ignored by ${record.source}:${record.line}  [${record.pattern}]`;
}

function parseArgs(argv) {
  const options = { list: false, help: false };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--list") options.list = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  console.log(
    "Fails when a TRACKED file is hidden from a gate by an ignore pattern " +
      "and is not on the documented baseline.\n\n" +
      "  --list   list every currently-shadowed tracked file with its axis " +
      "and baseline class\n" +
      "  --help   show this help"
  );
}

async function main() {
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

  const tracked = trackedFiles();
  const lintable = tracked.list.filter((f) => LINTABLE.test(f));
  const shadowed = {
    prettier: collectPrettierShadowed(tracked.buffer),
    eslint: await collectEslintShadowed(lintable),
  };
  const { baselined, unexplained, sentinelHits, stale } =
    evaluateShadowSets(shadowed);

  if (options.list) {
    const rows = [
      ...baselined.map((row) => ({ ...row, label: row.classId })),
      ...unexplained.map((row) => ({ ...row, label: "UNBASELINED" })),
      ...sentinelHits.map((row) => ({ ...row, label: "SENTINEL" })),
    ].sort(
      (a, b) => a.axis.localeCompare(b.axis) || a.path.localeCompare(b.path)
    );
    for (const row of rows) {
      console.log(`${row.axis.padEnd(8)} ${row.label}\t${row.path}`);
    }
    console.log(
      `\n${shadowed.prettier.length} shadowed on the prettier axis, ` +
        `${shadowed.eslint.length} on the eslint axis ` +
        `(${tracked.list.length} tracked files, ${lintable.length} lintable).`
    );
    return 0;
  }

  let failed = false;

  if (sentinelHits.length > 0) {
    failed = true;
    console.error(
      "✗ check-ignore-shadow: a deliberately-checked file is now shadowed.\n"
    );
    for (const hit of sentinelHits) {
      console.error(`  ${hit.path}  [${hit.axis}]`);
      console.error(`    ${describeRecord(hit)}`);
      console.error(`    must never be shadowed: ${hit.why}`);
    }
    console.error("");
  }

  if (unexplained.length > 0) {
    failed = true;
    console.error(
      "✗ check-ignore-shadow: tracked files are hidden from a gate.\n"
    );
    for (const row of unexplained) {
      console.error(`  ${row.path}  [${row.axis}]`);
      console.error(`    ${describeRecord(row)}`);
    }
    console.error(
      `\n${unexplained.length} tracked file(s) shadowed with no baseline entry.`
    );
    console.error(
      "Narrow the ignore pattern so it stops matching tracked files, or add a " +
        "documented baseline class to scripts/check-ignore-shadow.mjs with a " +
        "rationale for why the file is deliberately unchecked.\n"
    );
  }

  if (stale.length > 0) {
    failed = true;
    console.error("✗ check-ignore-shadow: stale baseline entries.\n");
    for (const entry of stale) {
      console.error(
        `  ${entry.id}  [${entry.axis}]  matches no currently-shadowed tracked file`
      );
    }
    console.error(
      "\nThe ignore pattern this class explained is gone. Remove the class (or " +
        "its dead axis) from BASELINE in scripts/check-ignore-shadow.mjs so the " +
        "allowlist cannot rot the way the ignore list it guards did.\n"
    );
  }

  if (failed) return 1;

  console.log(
    `✓ check-ignore-shadow: ${tracked.list.length} tracked files examined ` +
      `(${lintable.length} lintable), ${baselined.length} shadowed and ` +
      `baselined across ${BASELINE.length} classes ` +
      `(${shadowed.prettier.length} prettier, ${shadowed.eslint.length} eslint).`
  );
  return 0;
}

// Run as CLI only (importing for tests must not exit the process). Compares
// through `fileURLToPath` rather than building a `file://` string: `argv[1]` is
// not percent-encoded, so the string form is false for any checkout path
// containing a space — `main()` would never run and `lint:ignores` would report
// success having examined nothing.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
