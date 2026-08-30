#!/usr/bin/env node

/**
 * Diagnose the npm publish credential.
 *
 * All of the I/O lives here and none of the classification does: this file
 * collects facts and hands them to `scripts/lib/check-npm-auth.mjs`, which
 * decides the verdict. The token is read into memory, fingerprinted, and
 * written to one 0600 file inside a private temp directory that is removed on
 * every exit path. It is never echoed, logged, or passed to the library except
 * through `fingerprintToken`.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  classifyNpmAuth,
  fingerprintToken,
  renderNpmAuthMessage,
} from "./lib/check-npm-auth.mjs";

const execFileAsync = promisify(execFile);

const SECRET_REFERENCE = "op://apicity/NPM_TOKEN/password";
const REGISTRY = "https://registry.npmjs.org/";
const COMMAND_TIMEOUT_MS = 30_000;

const AUTH_CODES = new Set(["E401", "E403", "ENEEDAUTH"]);
const NETWORK_CODES = new Set([
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

const AUTH_TOKEN_ASSIGNMENT = /(?:^|:)_authToken\s*=\s*(.*)$/;
const VARIABLE_REFERENCE = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

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

  let value = null;

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.startsWith(";") || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(AUTH_TOKEN_ASSIGNMENT);

    if (match) {
      value = match[1].trim().replace(/^["']|["']$/g, "");
    }
  }

  return value;
}

/**
 * Tag what the host config holds rather than fingerprinting its bytes. A file
 * whose `_authToken` is a variable reference is a template that npm expands at
 * read time, so hashing the raw bytes would report a divergence on every run
 * of a correctly configured host.
 */
function classifyHostNpmrc(rawValue) {
  if (!rawValue) {
    return { kind: "absent" };
  }

  const deferred = rawValue.match(VARIABLE_REFERENCE);

  if (deferred) {
    const variable = deferred[1];

    return {
      kind: "deferred",
      variable,
      resolved: fingerprintToken(process.env[variable], sha256),
    };
  }

  return { kind: "literal", fingerprint: fingerprintToken(rawValue, sha256) };
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

/**
 * Lift npm's machine-readable code out of a failure and nothing else. npm's
 * raw stderr never reaches the rendered message.
 */
function npmErrorCode(error) {
  if (error.killed) {
    return "ETIMEDOUT";
  }

  if (typeof error.code === "string") {
    return error.code;
  }

  const match = /\bcode\s+([A-Z][A-Z0-9_]+)\b/.exec(String(error.stderr ?? ""));

  return match ? match[1] : null;
}

function npmErrorKind(error) {
  const code = npmErrorCode(error);

  if (code !== null && AUTH_CODES.has(code)) {
    return "auth";
  }

  if (code !== null && NETWORK_CODES.has(code)) {
    return "network";
  }

  return "other";
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
  const cached = classifyHostNpmrc(readHostAuthToken(hostNpmrcPath()));

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
