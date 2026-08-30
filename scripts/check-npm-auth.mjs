#!/usr/bin/env node

/**
 * Diagnose the npm publish credential.
 *
 * All of the I/O lives here and none of the classification does: this file
 * collects facts — the 1Password read, the host npmrc read, the digest, the
 * two npm child processes — and hands them to
 * `scripts/lib/check-npm-auth.mjs`, which decides every verdict. The token is
 * read into memory, fingerprinted, and written to one 0600 file inside a
 * private temp directory that is removed on every exit path. It is never
 * echoed or logged, and it reaches the library only through `fingerprintToken`.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  SECRET_REFERENCE,
  classifyHostNpmrc,
  classifyNpmAuth,
  fingerprintToken,
  npmErrorKind,
  parseAuthTokenLine,
  renderNpmAuthMessage,
} from "./lib/check-npm-auth.mjs";

const execFileAsync = promisify(execFile);

const REGISTRY = "https://registry.npmjs.org/";
const COMMAND_TIMEOUT_MS = 30_000;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

let tempDir = null;

function cleanup() {
  if (tempDir === null) {
    return;
  }

  const doomed = tempDir;
  tempDir = null;
  rmSync(doomed, { recursive: true, force: true });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    cleanup();
    process.exit(130);
  });
}

async function readSecret() {
  try {
    const { stdout } = await execFileAsync("op", ["read", SECRET_REFERENCE], {
      timeout: COMMAND_TIMEOUT_MS,
    });

    return stdout.trim();
  } catch {
    // Deliberately swallowed. A failure here becomes the `secret-missing`
    // verdict, whose message says what to do; forwarding the CLI's raw stderr
    // would put unvetted output into a message about a credential.
    return "";
  }
}

/**
 * Resolve the host npm user config the way npm resolves it, without hardcoding
 * a home directory. Reading `NPM_CONFIG_USERCONFIG` is correct here; assigning
 * it is not — see `npmChildEnv`.
 */
function hostNpmrcPath() {
  return process.env.NPM_CONFIG_USERCONFIG || join(homedir(), ".npmrc");
}

function readHostAuthToken(path) {
  let contents;

  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return null;
  }

  return parseAuthTokenLine(contents);
}

function writeTempNpmrc(token) {
  const dir = mkdtempSync(join(tmpdir(), "apicity-npm-auth-"));
  const file = join(dir, ".npmrc");

  writeFileSync(
    file,
    `registry=${REGISTRY}\n//registry.npmjs.org/:_authToken=${token}\n`,
    { mode: 0o600 }
  );

  return { dir, file };
}

/**
 * Point one child process at the temp npmrc. This must never be done by
 * assigning `process.env.NPM_CONFIG_USERCONFIG`: the host-config read would
 * then resolve to the temp file, which always matches, silently disabling the
 * divergence report while every unit test still passes.
 */
function npmChildEnv(userconfig) {
  return { ...process.env, NPM_CONFIG_USERCONFIG: userconfig };
}

async function runWhoami(userconfig) {
  try {
    const { stdout } = await execFileAsync("npm", ["whoami"], {
      timeout: COMMAND_TIMEOUT_MS,
      env: npmChildEnv(userconfig),
    });

    return { ok: true, account: stdout.trim() };
  } catch (error) {
    return { ok: false, kind: npmErrorKind(error) };
  }
}

async function runPing(userconfig) {
  try {
    await execFileAsync("npm", ["ping"], {
      timeout: COMMAND_TIMEOUT_MS,
      env: npmChildEnv(userconfig),
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

async function main() {
  // Read the host config before the temp npmrc exists, so no ordering mistake
  // can make this compare the temp file against itself.
  const cached = classifyHostNpmrc(
    readHostAuthToken(hostNpmrcPath()),
    (name) => process.env[name],
    sha256
  );

  const token = await readSecret();
  const tokenFingerprint = fingerprintToken(token, sha256);

  let whoami = null;
  let ping = null;

  // A missing or malformed secret is decided without spending a registry call:
  // the classifier short-circuits on both before it looks at `whoami`.
  if (tokenFingerprint !== null && tokenFingerprint.hasNpmPrefix) {
    const temp = writeTempNpmrc(token);
    tempDir = temp.dir;

    try {
      whoami = await runWhoami(temp.file);

      // Only spent when there is a failure to explain.
      if (!whoami.ok) {
        ping = await runPing(temp.file);
      }
    } finally {
      cleanup();
    }
  }

  const result = classifyNpmAuth({ tokenFingerprint, cached, whoami, ping });

  console.log(renderNpmAuthMessage(result));
  process.exit(result.exitCode);
}

main().catch((error) => {
  cleanup();
  // Code only, never a raw message: an unexpected failure is still a failure
  // in a credential path.
  console.error(
    `check:npm-auth failed unexpectedly (${error?.code ?? error?.name ?? "unknown"})`
  );
  process.exit(2);
});
