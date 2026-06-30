#!/usr/bin/env node
// Detect drift between Polly HAR recordings on disk and the recording names that
// integration tests actually reference. Fails (exit 1) on either:
//
//   - orphan recordings  -- a tests/recordings/**/recording.har that no test
//     references (left behind when a test is removed or renamed)
//   - missing recordings -- a setupPolly()/recordingExists() name with no
//     recording.har on disk (a phantom reference)
//
// The name<->path mapping mirrors recordingExists() in tests/harness.ts: each
// directory segment carries a trailing "_<hash>" suffix, and dots in a
// recording name are normalized to hyphens per path segment.
//
// Statically-unresolvable setupPolly() arguments (computed / template names)
// are warned about and skipped rather than treated as orphans.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listProviderNames } from "./lib/provider-scope.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recordingsDir = path.join(root, "tests", "recordings");
const testsDir = path.join(root, "tests");
const providerNames = listProviderNames();

function parseArgs(argv) {
  const options = {
    providers: new Set(),
    deleteOrphans: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--delete") {
      options.deleteOrphans = true;
      continue;
    }
    if (arg === "--provider" || arg === "--providers") {
      if (i + 1 >= argv.length) {
        throw new Error(`${arg} requires a comma-separated provider list`);
      }
      i++;
      for (const provider of argv[i].split(",")) {
        const normalized = provider.trim();
        if (normalized) options.providers.add(normalized);
      }
      continue;
    }
    if (arg.startsWith("--provider=") || arg.startsWith("--providers=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : "";
      for (const provider of value.split(",")) {
        const normalized = provider.trim();
        if (normalized) options.providers.add(normalized);
      }
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseArgSets() {
  try {
    return parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

function usage() {
  console.log(`Usage: node scripts/check-orphan-recordings.mjs [options]

  --provider <list>    Comma-separated provider filter, e.g. "fal,xai"
  --providers <list>   Alias for --provider
  --provider= <list>   Alias for --provider
  --providers= <list>  Alias for --provider
  --delete             Delete orphan recordings after reporting (dangerous)
  --help, -h           Show this help`);
}

function hasProviderPrefix(name, providers) {
  if (providers.size === 0) return true;
  const provider = name.split("/")[0];
  return providers.has(provider);
}

function filterByProvider(values, providers) {
  if (providers.size === 0) {
    return new Set(values);
  }
  return new Set(
    [...values].filter((name) => hasProviderPrefix(name, providers))
  );
}

function providerFromIntegrationTestFile(file) {
  const base = path.basename(file);
  const longestFirst = [...providerNames].sort((a, b) => b.length - a.length);
  return (
    longestFirst.find(
      (provider) =>
        base === `${provider}.test.ts` || base.startsWith(`${provider}-`)
    ) ?? ""
  );
}

function unresolvedMatchesProvider(entry, providers) {
  if (providers.size === 0) return true;

  const relFile = entry.split(":")[0];
  const provider = providerFromIntegrationTestFile(relFile);
  return provider ? providers.has(provider) : true;
}

function diskRecordingEntries() {
  const harFiles = walkFiles(
    recordingsDir,
    (file) => path.basename(file) === "recording.har"
  );
  const byName = new Map();
  for (const file of harFiles) {
    const name = dirToRecordingName(path.dirname(file));
    const existing = byName.get(name);
    if (existing) {
      existing.add(path.dirname(file));
    } else {
      byName.set(name, new Set([path.dirname(file)]));
    }
  }
  return byName;
}

function walkFiles(dir, predicate) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
}

// --- disk side: recording.har files -> canonical recording names ------------

function dirToRecordingName(harDir) {
  return path
    .relative(recordingsDir, harDir)
    .split(path.sep)
    .map((segment) => segment.replace(/_\d+$/, ""))
    .join("/");
}

// --- test side: setupPolly()/recordingExists() name arguments ---------------

const SETUP_RE = /setupPolly\w*\(\s*([^),]+?)\s*[),]/g;
const EXISTS_RE = /recordingExists\(\s*([^)]+?)\s*\)/g;
const CONST_RE = /(?:const|let)\s+(\w+)\s*=\s*"([^"]+)"/g;

function normalizeName(name) {
  // recordingExists() normalizes dots to hyphens per path segment.
  return name
    .split("/")
    .map((segment) => segment.replace(/\./g, "-"))
    .join("/");
}

function resolveArg(arg, consts) {
  const trimmed = arg.trim();
  const literal = trimmed.match(/^"([^"]+)"$/) || trimmed.match(/^`([^`$]+)`$/);
  if (literal) return literal[1];
  if (consts.has(trimmed)) return consts.get(trimmed);
  return null; // computed / template name -- cannot statically resolve
}

function referencesInFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const consts = new Map();
  for (const match of src.matchAll(CONST_RE)) consts.set(match[1], match[2]);

  const resolved = new Set();
  const unresolved = [];
  for (const [regex, isSetup] of [
    [SETUP_RE, true],
    [EXISTS_RE, false],
  ]) {
    for (const match of src.matchAll(regex)) {
      const name = resolveArg(match[1], consts);
      if (name) resolved.add(normalizeName(name));
      else if (isSetup)
        unresolved.push(`${path.relative(root, file)}: ${match[1].trim()}`);
    }
  }
  return { resolved, unresolved };
}

function referencedNames() {
  const files = walkFiles(testsDir, (file) => file.endsWith(".test.ts"));
  const resolved = new Set();
  const unresolved = [];
  for (const file of files) {
    const result = referencesInFile(file);
    for (const name of result.resolved) resolved.add(name);
    unresolved.push(...result.unresolved);
  }
  return { resolved, unresolved };
}

// --- example side: example.json "source" fields -----------------------------
//
// A recording can be consumed without a test: the generated per-provider
// example.json points each endpoint's example payload at the recording it was
// extracted from via a "source" field. Such recordings are referenced (the
// build re-extracts their payloads), so they are not orphans.

function exampleSourceNames() {
  const providersDir = path.join(root, "packages", "provider");
  const names = new Set();
  if (!fs.existsSync(providersDir)) return names;
  for (const provider of fs.readdirSync(providersDir, {
    withFileTypes: true,
  })) {
    if (!provider.isDirectory()) continue;
    const file = path.join(providersDir, provider.name, "src", "example.json");
    if (!fs.existsSync(file)) continue;
    const examples = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const entry of Object.values(examples)) {
      if (entry && typeof entry.source === "string") {
        names.add(normalizeName(entry.source));
      }
    }
  }
  return names;
}

// --- compare ----------------------------------------------------------------

function run() {
  const options = parseArgSets();
  if (!options) return 1;
  if (options.help) {
    usage();
    return 0;
  }

  const diskEntries = diskRecordingEntries();
  const diskAllNames = new Set(diskEntries.keys());
  const disk = filterByProvider(diskAllNames, options.providers);
  const { resolved: testRefs, unresolved } = referencedNames();
  const exampleRefs = exampleSourceNames();
  const filteredTestRefs = filterByProvider(testRefs, options.providers);
  const filteredExampleRefs = filterByProvider(exampleRefs, options.providers);
  const referenced = new Set([...filteredTestRefs, ...filteredExampleRefs]);

  // Orphans: on disk, used by neither a test nor an example source.
  const orphans = [...disk].filter((name) => !referenced.has(name)).sort();
  // Missing: a test references a name with no recording on disk. (Example
  // sources are not checked here -- the build self-heals stale example.json.)
  const missing = [...filteredTestRefs]
    .filter((name) => !disk.has(name))
    .sort();

  for (const entry of unresolved.filter((entry) =>
    unresolvedMatchesProvider(entry, options.providers)
  )) {
    console.warn(`warn: non-static setupPolly name, skipped -- ${entry}`);
  }

  if (orphans.length === 0 && missing.length === 0) {
    const providerLabel =
      options.providers.size > 0
        ? ` [providers: ${[...options.providers].join(", ")}]`
        : "";
    console.log(
      `check-orphan-recordings: OK (${disk.size} recordings, ` +
        `${filteredTestRefs.size} test refs, ` +
        `${filteredExampleRefs.size} example sources)` +
        `${providerLabel}`
    );
    return 0;
  }

  if (orphans.length) {
    const prefix = options.providers.size > 0 ? "[filtered] " : "";
    console.error(
      `\n${orphans.length} ${prefix}ORPHAN recording(s) -- on disk,` +
        " referenced by no test:"
    );
    for (const name of orphans) console.error(`  ${name}`);
  }
  if (missing.length) {
    const prefix = options.providers.size > 0 ? "[filtered] " : "";
    console.error(
      `\n${missing.length} ${prefix}MISSING recording(s) -- referenced by` +
        " a test, no recording.har on disk:"
    );
    for (const name of missing) console.error(`  ${name}`);
  }

  if (options.deleteOrphans && orphans.length > 0) {
    for (const name of orphans) {
      const dirs = diskEntries.get(name);
      if (!dirs) continue;
      for (const dir of dirs) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`deleted: ${path.relative(root, dir)}`);
      }
    }
    console.log(`deleted ${orphans.length} orphan recording directory(ies).`);
  }

  console.error("");
  return 1;
}

process.exit(run());
