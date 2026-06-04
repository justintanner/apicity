import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomBytes, createHash } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  mintOtp,
  parseTtl,
  parseOtp,
  verifyOtp,
  canonicalHash,
} from "../../packages/provider/cost/src/paygate.js";

const SECRET = "test-shared-hmac-secret-value";

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
      (parsed.payload as Record<string, unknown>).maxSpendUsd
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
  const cliPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../packages/provider/cost/src/paygate-cli.ts"
  );

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
    const { execFile } = await import("node:child_process");
    const result = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        execFile(
          "npx",
          [
            "tsx",
            cliPath,
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
          ],
          { env: { ...process.env } },
          (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          }
        );
      }
    );

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
    const { execFile } = await import("node:child_process");
    await expect(
      new Promise((resolve, reject) => {
        execFile(
          "npx",
          [
            "tsx",
            cliPath,
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
          ],
          { env: { ...process.env } },
          (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          }
        );
      })
    ).rejects.toBeTruthy();
  });
});
