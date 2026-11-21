import { execFile, execSync } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import {
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";

import {
  GRANT_TOKEN_PREFIX,
  grantFileName,
  mintOtp,
  parseTtl,
  parseOtp,
  verifyGrant,
  verifyOtp,
  canonicalHash,
} from "@apicity/cost";

const SECRET = "test-shared-hmac-secret-value";

interface CliResult {
  stdout: string;
  stderr: string;
}

interface CliError extends Error {
  stdout: string;
  stderr: string;
}

function makeTestDir(): string {
  const dir = join(
    tmpdir(),
    "apicity-paygate-cli-test-" + randomBytes(8).toString("hex")
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("parseTtl", () => {
  it("parses seconds", () => {
    expect(parseTtl("30s")).toBe(30);
  });

  it("parses minutes", () => {
    expect(parseTtl("10m")).toBe(600);
  });

  it("parses hours", () => {
    expect(parseTtl("1h")).toBe(3600);
  });

  it("parses days", () => {
    expect(parseTtl("1d")).toBe(86400);
    expect(parseTtl("2d")).toBe(172800);
  });

  it("is case-insensitive", () => {
    expect(parseTtl("10M")).toBe(600);
    expect(parseTtl("1H")).toBe(3600);
  });

  it("throws on invalid format", () => {
    expect(() => parseTtl("10")).toThrow("Invalid TTL format");
    expect(() => parseTtl("abc")).toThrow("Invalid TTL format");
    expect(() => parseTtl("10x")).toThrow("Invalid TTL format");
  });
});

describe("mintOtp", () => {
  it("mints a valid OTP signed with the shared HMAC secret", () => {
    const request = { model: "wan/2-7-text-to-video", input: { duration: 5 } };
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      request,
      ttl: 600,
    });

    const parsed = parseOtp(otp);
    expect(parsed.payload.v).toBe(1);
    expect(parsed.payload.provider).toBe("kie");
    expect(parsed.payload.method).toBe("POST");
    expect(parsed.payload.dotPath).toBe("api.v1.jobs.createTask");
    expect(parsed.payload.jti).toHaveLength(32);
    expect(parsed.payload.requestHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(parsed.payload.iat).toBeLessThanOrEqual(
      Math.floor(Date.now() / 1000)
    );
    expect(parsed.payload.exp).toBe(parsed.payload.iat + 600);

    // Payload no longer carries maxSpendUsd.
    expect(
      (parsed.payload as unknown as Record<string, unknown>).maxSpendUsd
    ).toBeUndefined();

    // Verify the HMAC signature with verifyOtp as the oracle.
    const result = verifyOtp({
      nowSeconds: Math.floor(Date.now() / 1000),
      secret: SECRET,
      expected: {
        provider: "kie",
        method: "POST",
        dotPath: "api.v1.jobs.createTask",
      },
      payloadHash: canonicalHash(request),
      otp,
      isJtiConsumed: () => false,
    });
    expect(result).toEqual({ ok: true, jti: parsed.payload.jti });
  });

  it("resolves provider/method from the dot-path when omitted", () => {
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request: { model: "x" },
    });
    const parsed = parseOtp(otp);
    expect(parsed.payload.provider).toBe("kie");
    expect(parsed.payload.method).toBe("POST");
  });

  it("defaults TTL to 600 seconds when omitted", () => {
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      request: {},
    });
    const parsed = parseOtp(otp);
    expect(parsed.payload.exp).toBe(parsed.payload.iat + 600);
  });

  it("rejects an OTP signed with a different secret", () => {
    const request = { model: "x" };
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      request,
    });
    const result = verifyOtp({
      nowSeconds: Math.floor(Date.now() / 1000),
      secret: "a-completely-different-secret",
      expected: {
        provider: "kie",
        method: "POST",
        dotPath: "api.v1.jobs.createTask",
      },
      payloadHash: canonicalHash(request),
      otp,
      isJtiConsumed: () => false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("otp-invalid-signature");
    }
  });

  it("uses correct request hash for canonicalized payload", () => {
    const payload = { b: 1, a: 2 };
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      request: payload,
    });
    const parsed = parseOtp(otp);

    const expectedHash = (() => {
      const canonical = JSON.stringify({ a: 2, b: 1 });
      const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
      return `sha256:${hash}`;
    })();

    expect(parsed.payload.requestHash).toBe(expectedHash);
  });

  it("throws on an empty secret", () => {
    expect(() =>
      mintOtp("", {
        provider: "kie",
        method: "POST",
        dotPath: "api.v1.jobs.createTask",
        request: {},
      })
    ).toThrow("non-empty secret");
  });
});

describe("CLI subprocess", () => {
  let testDir: string;
  let secretFile: string;
  let payloadFile: string;
  const cliSourcePath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../packages/provider/cost/src/paygate-cli.ts"
  );
  const cliDistPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../packages/provider/cost/dist/src/paygate-cli.js"
  );

  function runCli(args: string[]): Promise<CliResult> {
    const usesBuiltCli = existsSync(cliDistPath);
    const command = usesBuiltCli ? process.execPath : "pnpm";
    const commandArgs = usesBuiltCli
      ? [cliDistPath, ...args]
      : ["exec", "tsx", cliSourcePath, ...args];

    return new Promise((resolve, reject) => {
      execFile(
        command,
        commandArgs,
        { env: { ...process.env } },
        (error, stdout, stderr) => {
          if (error) {
            const cliError = error as CliError;
            cliError.stdout = stdout;
            cliError.stderr = stderr;
            reject(cliError);
          } else {
            resolve({ stdout, stderr });
          }
        }
      );
    });
  }

  beforeAll(() => {
    // runCli prefers the BUILT CLI (fast `node dist` spawn) but falls back to
    // the workspace's pinned tsx (`pnpm exec tsx`) when dist is missing — the
    // common local case, since `pnpm test:run` doesn't build first. Each
    // fallback spawn transpiles the source on the fly (~0.5s each).
    // Build the dist when it is missing OR stale (a source file is newer than
    // the built CLI) so we never test a stale artifact. CI skips this entirely
    // — its build already ran and is current — and local runs pay the one-time
    // build only, after which every spawn is a sub-200ms `node` invocation.
    const cliSrcDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../packages/provider/cost/src"
    );
    const sources = ["paygate-cli.ts", "paygate.ts", "paygate-grant.ts"].map(
      (f) => join(cliSrcDir, f)
    );
    const stale =
      !existsSync(cliDistPath) ||
      sources.some(
        (src) =>
          existsSync(src) &&
          statSync(src).mtimeMs > statSync(cliDistPath).mtimeMs
      );
    if (stale) {
      execSync("pnpm --filter @apicity/cost run build", {
        stdio: "pipe",
        cwd: join(dirname(fileURLToPath(import.meta.url)), "../.."),
      });
    }
  }, 120000);

  beforeEach(() => {
    testDir = makeTestDir();
    secretFile = join(testDir, "secret.txt");
    writeFileSync(secretFile, SECRET, "utf8");
    payloadFile = join(testDir, "payload.json");
    writeFileSync(
      payloadFile,
      JSON.stringify({
        model: "wan/2-7-text-to-video",
        input: { duration: 5 },
      }),
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("mints an OTP via CLI subprocess", async () => {
    const result = await runCli([
      "otp",
      "mint",
      "--provider",
      "kie",
      "--method",
      "POST",
      "--dot-path",
      "api.v1.jobs.createTask",
      "--payload-file",
      payloadFile,
      "--secret-file",
      secretFile,
      "--ttl",
      "10m",
    ]);

    const otp = result.stdout.trim();
    const parsed = parseOtp(otp);
    expect(parsed.payload.provider).toBe("kie");
    expect(parsed.payload.method).toBe("POST");
    expect(parsed.payload.dotPath).toBe("api.v1.jobs.createTask");
    expect(parsed.payload.exp).toBe(parsed.payload.iat + 600);

    const request = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const verifyResult = verifyOtp({
      nowSeconds: Math.floor(Date.now() / 1000),
      secret: SECRET,
      expected: {
        provider: "kie",
        method: "POST",
        dotPath: "api.v1.jobs.createTask",
      },
      payloadHash: canonicalHash(request),
      otp,
      isJtiConsumed: () => false,
    });
    expect(verifyResult).toEqual({ ok: true, jti: parsed.payload.jti });
  });

  it("exits with error when --secret-file is missing", async () => {
    await expect(
      runCli([
        "otp",
        "mint",
        "--provider",
        "kie",
        "--method",
        "POST",
        "--dot-path",
        "api.v1.jobs.createTask",
        "--payload-file",
        payloadFile,
        "--ttl",
        "10m",
      ])
    ).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "Missing required argument: --secret-file"
      ),
    });
  });

  it("mints an OTP from --request-hash without --payload-file", async () => {
    const request = { path: { voiceId: "v1" }, body: { text: "hi" } };
    const hash = canonicalHash(request);
    const result = await runCli([
      "otp",
      "mint",
      "--provider",
      "elevenlabs",
      "--method",
      "POST",
      "--dot-path",
      "v1.textToSpeech",
      "--request-hash",
      hash,
      "--secret-file",
      secretFile,
    ]);

    const otp = result.stdout.trim();
    const parsed = parseOtp(otp);
    expect(parsed.payload.provider).toBe("elevenlabs");
    expect(parsed.payload.method).toBe("POST");
    expect(parsed.payload.dotPath).toBe("v1.textToSpeech");
    expect(parsed.payload.requestHash).toBe(hash);
  });

  it("requires one of --payload-file or --request-hash, never both", async () => {
    const hash = canonicalHash({ ok: true });
    await expect(
      runCli([
        "otp",
        "mint",
        "--dot-path",
        "api.v1.jobs.createTask",
        "--secret-file",
        secretFile,
      ])
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("--payload-file or --request-hash"),
    });

    await expect(
      runCli([
        "otp",
        "mint",
        "--dot-path",
        "api.v1.jobs.createTask",
        "--payload-file",
        payloadFile,
        "--request-hash",
        hash,
        "--secret-file",
        secretFile,
      ])
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("never both"),
    });
  });

  it("mints, lists, and revokes provider grants without leaking tokens or secret", async () => {
    const grantDir = join(testDir, "grants");

    const minted = await runCli([
      "grant",
      "mint",
      "--secret-file",
      secretFile,
      "--provider",
      "kie",
      "--ttl",
      "2h",
      "--grant-dir",
      grantDir,
    ]);
    const grantPath = join(grantDir, grantFileName("kie"));
    const token = readFileSync(grantPath, "utf8").trim();
    expect(token.startsWith(GRANT_TOKEN_PREFIX)).toBe(true);
    const [, seg, sig] = token.slice(GRANT_TOKEN_PREFIX.length).split(".") as [
      string,
      string,
      string,
    ];
    for (const secretText of [token, seg, sig, SECRET]) {
      if (!secretText) continue;
      expect(minted.stdout + minted.stderr).not.toContain(secretText);
    }
    expect(minted.stdout).toContain("id:");
    expect(minted.stdout).toContain("expires:");
    expect(minted.stdout).toContain(grantPath);
    expect(minted.stdout).toContain(
      "21 endpoints are checked by the provider package and still need an OTP for each request."
    );
    const mode = statSync(grantPath).mode & 0o777;
    const dirMode = statSync(grantDir).mode & 0o777;
    expect(dirMode).toBe(0o700);
    expect(mode).toBe(0o600);
    expect(verifyGrant({ token, secret: SECRET, provider: "kie" }).ok).toBe(
      true
    );

    const listed = await runCli([
      "grant",
      "list",
      "--secret-file",
      secretFile,
      "--grant-dir",
      grantDir,
    ]);
    expect(listed.stdout).toContain("valid until");
    for (const secretText of [token, seg, sig, SECRET]) {
      if (!secretText) continue;
      expect(listed.stdout + listed.stderr).not.toContain(secretText);
    }

    const revoked = await runCli([
      "grant",
      "revoke",
      "--provider",
      "kie",
      "--grant-dir",
      grantDir,
    ]);
    expect(existsSync(grantPath)).toBe(false);
    expect(revoked.stdout).toContain("24 hours");
    expect(revoked.stdout).toContain("new pay-gate secret");
    for (const secretText of [token, seg, sig, SECRET]) {
      if (!secretText) continue;
      expect(revoked.stdout + revoked.stderr).not.toContain(secretText);
    }
  });

  it("refuses unknown provider, path traversal, >24h TTL, or empty secret on grant mint", async () => {
    const grantDir = join(testDir, "bad-grants");
    const emptySecret = join(testDir, "empty.secret");
    writeFileSync(emptySecret, "\n", "utf8");

    for (const badArgs of [
      [
        "grant",
        "mint",
        "--secret-file",
        secretFile,
        "--provider",
        "nope",
        "--grant-dir",
        grantDir,
      ],
      [
        "grant",
        "mint",
        "--secret-file",
        secretFile,
        "--provider",
        "../fal",
        "--grant-dir",
        grantDir,
      ],
      [
        "grant",
        "mint",
        "--secret-file",
        secretFile,
        "--provider",
        "fal",
        "--ttl",
        "25h",
        "--grant-dir",
        grantDir,
      ],
      [
        "grant",
        "mint",
        "--secret-file",
        emptySecret,
        "--provider",
        "fal",
        "--grant-dir",
        grantDir,
      ],
    ]) {
      await expect(runCli(badArgs)).rejects.toThrow();
    }
    expect(existsSync(grantDir)).toBe(false);
  });
});
