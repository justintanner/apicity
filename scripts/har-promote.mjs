#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  pollyRecordingDir,
  scrubHar,
} from "../packages/provider/har/src/index.ts";
import { PROVIDERS } from "../packages/cli/src/providers.ts";
import { auditFalCredentialWiring } from "./lib/fal-credential-hosts.mjs";
import {
  CONST_RE,
  SETUP_RE,
  resolveArg,
  normalizeName,
  dirToRecordingName,
} from "./lib/recording-names.mjs";
import {
  repo,
  Refusal,
  refuse,
  validateCapture,
  validateBodies,
  planCalls,
} from "./lib/har-promote-plan.mjs";
import {
  format,
  sortKeys,
  selectTemplate,
  emitTest,
} from "./lib/har-promote-emit.mjs";
export { PAID_OTP_HELPERS } from "./lib/har-promote-plan.mjs";

function canonical(file) {
  if (fs.existsSync(file)) return fs.realpathSync(file);
  const parent = path.dirname(file);
  return parent === file
    ? file
    : path.join(canonical(parent), path.basename(file));
}
function inside(root, file) {
  const rel = path.relative(root, file);
  return (
    rel === "" ||
    (!rel.startsWith(".." + path.sep) && rel !== ".." && !path.isAbsolute(rel))
  );
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
    );
}
function references(file) {
  const text = fs.readFileSync(file, "utf8");
  const constants = new Map(
    [...text.matchAll(CONST_RE)].map((m) => [m[1], m[2]])
  );
  return [...text.matchAll(SETUP_RE)]
    .map((m) => resolveArg(m[1], constants))
    .filter(Boolean)
    .map(normalizeName);
}
function command(bin, args, options = {}) {
  const result = spawnSync(bin, args, {
    cwd: repo,
    encoding: "utf8",
    timeout: 300000,
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${bin} ${args.join(" ")} failed\n${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`
    );
  return result.stdout;
}
function targets(options, context) {
  const root = canonical(path.resolve(options.root ?? repo));
  const repository = canonical(repo);
  if (root !== repository && inside(repository, root))
    refuse("usage", "--root must be outside the repository");
  const prefix =
    context.provider === "googleflow" ? "google-flow" : context.provider;
  const pieces = options.name?.split("/");
  if (
    pieces?.length !== 2 ||
    pieces[0] !== prefix ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pieces[1]) ||
    pieces[1].length > 80
  )
    refuse(
      "name",
      `expected ${prefix}/<kebab-case-test-name> (max 80 characters)`
    );
  const testFile = canonical(
    path.resolve(
      root,
      options.testFile ??
        `tests/integration/${context.provider}-${pieces[1]}.test.ts`
    )
  );
  if (
    path.dirname(testFile) !== path.join(root, "tests/integration") ||
    !path.basename(testFile).startsWith(context.provider + "-") ||
    !path.basename(testFile).endsWith(".test.ts")
  )
    refuse("test-file");
  const recordingsRoot = path.join(root, "tests/recordings");
  const recFile = path.join(
    recordingsRoot,
    pollyRecordingDir(options.name),
    "recording.har"
  );
  if (canonical(recFile) !== recFile)
    refuse("test-file", "recording path contains a symlink");
  return {
    root,
    testFile,
    recFile,
    recordingsRoot,
    testsDir: path.join(root, "tests"),
  };
}
function checkExisting(options, paths) {
  const { recFile, testFile, recordingsRoot, testsDir, root } = paths;
  const directory = path.dirname(recFile);
  const providerDir = path.dirname(directory);
  if (fs.existsSync(providerDir))
    for (const name of fs.readdirSync(providerDir)) {
      const sibling = path.join(providerDir, name);
      if (
        sibling !== directory &&
        normalizeName(
          dirToRecordingName(path.relative(recordingsRoot, sibling))
        ) === options.name
      )
        refuse("exists", "another directory normalizes to this recording name");
    }
  const existing = [recFile, testFile].filter((f) => fs.existsSync(f));
  const occupied =
    fs.existsSync(directory) && fs.readdirSync(directory).length > 0;
  if ((existing.length || occupied) && !options.force)
    refuse(
      "exists",
      "recording or test already exists; use --force only for tracked, clean files"
    );
  if (!options.force || (!existing.length && !occupied)) return;
  try {
    command("git", ["rev-parse", "--show-toplevel"], { cwd: root });
    if (walk(directory).some((f) => f !== recFile))
      refuse("force-unrecoverable", "recording directory contains other files");
    for (const file of existing) {
      const rel = path.relative(root, file);
      command("git", ["ls-files", "--error-unmatch", "--", rel], { cwd: root });
      command("git", ["diff", "--quiet", "HEAD", "--", rel], { cwd: root });
    }
  } catch (e) {
    if (e instanceof Refusal) throw e;
    refuse(
      "force-unrecoverable",
      "replacement requires files tracked and clean in git"
    );
  }
  for (const file of walk(testsDir).filter((f) => f.endsWith(".test.ts"))) {
    const names = references(file);
    if (file !== testFile && names.includes(options.name))
      refuse("force-shared-recording");
    if (file === testFile && names.some((n) => n !== options.name))
      refuse("force-shared-test");
  }
}
export function replayEnvironment(recordingsRoot) {
  const excluded = new Set(["FAL_ADMIN_API_KEY"]);
  for (const spec of Object.values(PROVIDERS)) {
    excluded.add(spec.envVar);
    for (const name of spec.extraEnvVars ?? []) excluded.add(name);
  }
  return {
    ...Object.fromEntries(
      Object.keys(process.env)
        .filter(
          (key) =>
            !excluded.has(key) &&
            !key.startsWith("POLLY_") &&
            !key.startsWith("VITEST")
        )
        .map((key) => [key, process.env[key]])
    ),
    POLLY_MODE: "replay",
    POLLY_RECORDINGS_DIR: recordingsRoot,
  };
}
async function runChecks(paths, context, checks = {}) {
  const { recFile, recordingsRoot, testsDir, testFile, root } = paths;
  const env = replayEnvironment(recordingsRoot);
  command(
    process.execPath,
    [
      "scripts/check-recording-secrets.mjs",
      "--recordings",
      path.dirname(recFile),
    ],
    { env }
  );
  command(
    process.execPath,
    [
      "scripts/check-orphan-recordings.mjs",
      "--provider",
      context.provider,
      "--recordings",
      recordingsRoot,
      "--tests",
      testsDir,
    ],
    { env }
  );
  if (context.provider === "fal") {
    const { failures } = auditFalCredentialWiring({ recordingsRoot, testsDir });
    if (failures.length) throw new Error(failures.join("\n"));
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "har-promote-tsc-"));
  try {
    const config = path.join(tmp, "tsconfig.json");
    fs.writeFileSync(
      config,
      JSON.stringify({
        extends: path.join(repo, "tests/tsconfig.json"),
        compilerOptions: {
          baseUrl: repo,
          noEmit: true,
          typeRoots: [
            path.join(repo, "node_modules/@types"),
            path.join(repo, "node_modules"),
          ],
        },
        include: [],
        files: [testFile],
      })
    );
    command(path.join(repo, "node_modules/.bin/tsc"), ["-p", config], { env });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (checks.replay) {
    if ((await checks.replay(paths)) === false)
      throw new Error("injected replay failure");
  } else {
    const filter =
      root === canonical(repo)
        ? [path.relative(repo, testFile)]
        : ["--dir", root, testFile];
    command(
      path.join(repo, "node_modules/.bin/vitest"),
      ["run", "--config", "tests/vitest.integration.ts", ...filter],
      { env }
    );
  }
}
/** @param {*} options @param {Pick<Console, "log" | "error">} io */
export async function promote(options, io = console) {
  let har;
  try {
    har = JSON.parse(fs.readFileSync(options.capture, "utf8"));
  } catch {
    refuse("unreadable", "cannot read capture JSON");
  }
  const context = validateCapture(har);
  const paths = targets(options, context);
  validateBodies(context);
  checkExisting(options, paths);
  const template = selectTemplate(paths.testFile);
  const plan = await planCalls(context);
  const test = await emitTest(context, plan, options, template);
  const recording = {
    log: {
      _apicity: context.meta,
      _recordingName: options.name,
      creator: {
        comment: "persister:fs",
        name: "Polly.JS",
        version: JSON.parse(
          fs.readFileSync(
            path.join(repo, "node_modules/@pollyjs/core/package.json"),
            "utf8"
          )
        ).version,
      },
      entries: context.expanded,
      pages: [],
      version: "1.2",
    },
  };
  if (
    JSON.stringify(scrubHar(structuredClone(recording))) !==
    JSON.stringify(recording)
  )
    refuse("needs-scrub", "final recording changed under scrub");
  const recordingText = await format(
    JSON.stringify(sortKeys(recording)),
    "json"
  );
  for (const [index, c] of plan.entries()) {
    for (const value of [
      c.result?.status,
      c.result?.state,
      c.result?.data?.status,
      c.result?.data?.state,
    ])
      if (["fail", "failed", "error", "expired"].includes(value))
        io.log(
          `har:promote: note: call ${index + 1} returned state ${JSON.stringify(value)}; the promoted test pins it`
        );
  }
  if (options.dryRun) {
    io.log(
      `har:promote: dry-run\n${paths.recFile}\n${paths.testFile}\ncredential: ${context.envVar || "none"}\n` +
        plan
          .map(
            (c, i) =>
              `call ${i + 1}: provider${c.accessor}; source=${c.source}; exchanges=${c.entries.join(",")}; otp=${c.paid ? "existing harness helper" : "none"}`
          )
          .join("\n") +
        "\n" +
        test
    );
    return paths;
  }
  const originals = new Map();
  const createdDirs = [];
  const written = [];
  const mkdir = (dir) => {
    if (fs.existsSync(dir)) return;
    mkdir(path.dirname(dir));
    fs.mkdirSync(dir);
    createdDirs.push(dir);
  };
  const rollback = () => {
    for (const file of written.reverse()) {
      if (originals.has(file)) fs.writeFileSync(file, originals.get(file));
      else fs.rmSync(file, { force: true });
    }
    for (const dir of createdDirs.reverse())
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0)
        fs.rmdirSync(dir);
  };
  const signal = () => {
    if (!options.keep) rollback();
    process.exit(1);
  };
  process.once("SIGINT", signal);
  process.once("SIGTERM", signal);
  try {
    // Repeat collision/clean checks after asynchronous planning, before mutation.
    checkExisting(options, paths);
    for (const [file, text] of [
      [paths.recFile, recordingText],
      [paths.testFile, test],
    ]) {
      mkdir(path.dirname(file));
      if (options.force && fs.existsSync(file)) {
        originals.set(file, fs.readFileSync(file));
      }
      const fd = fs.openSync(file, originals.has(file) ? "w" : "wx");
      written.push(file);
      try {
        fs.writeFileSync(fd, text);
      } finally {
        fs.closeSync(fd);
      }
    }
    await runChecks(paths, context, options.checks);
    io.log("har:promote: replay passed");
  } catch (error) {
    if (options.keep)
      io.error(`kept ${written.join(", ")}: fix them or delete them`);
    else rollback();
    throw error;
  } finally {
    process.removeListener("SIGINT", signal);
    process.removeListener("SIGTERM", signal);
  }
  io.log(
    `Wrote ${paths.recFile}\nWrote ${paths.testFile}\nNext:\ngit add ${paths.recFile} ${paths.testFile}\npnpm run gen:examples\npnpm run harness:telegram -- --all ${options.name.split("/")[1]} --dry-run\npnpm run dev:preflight:fast -- ${context.provider}`
  );
  return paths;
}
function parseArgs(argv) {
  const options = {};
  const names = {
    "--name": "name",
    "--test-file": "testFile",
    "--root": "root",
  };
  const flags = { "--dry-run": "dryRun", "--force": "force", "--keep": "keep" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--" && i === 0) continue;
    const [flag, inline] = arg.split(/=(.*)/s);
    if (Object.hasOwn(flags, flag) && inline === undefined)
      options[flags[flag]] = true;
    else if (Object.hasOwn(names, flag)) {
      const value = inline ?? argv[++i];
      if (!value || value.startsWith("--"))
        refuse("usage", `${flag} requires a value`);
      options[names[flag]] = value;
    } else if (arg.startsWith("-") || options.capture)
      refuse("usage", `unexpected argument ${arg}`);
    else options.capture = arg;
  }
  if (!options.capture || !options.name)
    refuse("usage", "expected <capture.har> --name <provider>/<test-name>");
  return options;
}
/** @param {string[]} argv @param {Pick<Console, "log" | "error">} io */
export async function main(argv, io = console) {
  try {
    await promote(parseArgs(argv), io);
    return 0;
  } catch (error) {
    if (error instanceof Refusal) {
      io.error(
        `har:promote: ${error.code === "usage" ? "usage" : `refused (${error.code})`}: ${error.message.replace(/[\r\n]+/g, " ")}`
      );
      return 2;
    }
    io.error(`har:promote: ${error.message}`);
    return 1;
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  process.exitCode = await main(process.argv.slice(2));
