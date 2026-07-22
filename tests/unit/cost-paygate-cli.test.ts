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

import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";

import {
  mintOtp,
  parseTtl,
  parseOtp,
  verifyOtp,
  canonicalHash,
} from "../../packages/provider/cost/src/paygate.js";

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
    const command = usesBuiltCli ? process.execPath : "npx";
    const commandArgs = usesBuiltCli
      ? [cliDistPath, ...args]
      : ["tsx", cliSourcePath, ...args];

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
    // `npx tsx` when dist is missing — the common local case, since `pnpm
    // test:run` doesn't build first. tsx isn't a project dependency, so each
    // fallback spawn re-downloads/recompiles (~3s each; ~11s for this file).
    // Build the dist when it is missing OR stale (a source file is newer than
    // the built CLI) so we never test a stale artifact. CI skips this entirely
    // — its build already ran and is current — and local runs pay the one-time
    // build only, after which every spawn is a sub-200ms `node` invocation.
    const cliSrcDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../packages/provider/cost/src"
    );
    const sources = ["paygate-cli.ts", "paygate.ts"].map((f) =>
      join(cliSrcDir, f)
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
});
