import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  mintOtp,
  parseTtl,
  generateKeyPair,
} from "../../packages/provider/cost/src/paygate-cli.js";
import {
  parseOtp,
  verifyOtpSignature,
} from "../../packages/provider/cost/src/paygate.js";

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
  let testDir: string;
  let privateKeyPath: string;
  let privateKeyPem: string;
  let publicKeyPem: string;

  beforeEach(() => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    publicKeyPem = publicKey;
    privateKeyPem = privateKey;
    testDir = makeTestDir();
    privateKeyPath = join(testDir, "private.pem");
    writeFileSync(privateKeyPath, privateKeyPem, "utf8");
    process.env.APICITY_PAYGATE_PRIVATE_KEY_PATH = privateKeyPath;
  });

  afterEach(() => {
    delete process.env.APICITY_PAYGATE_PRIVATE_KEY_PATH;
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("mints a valid OTP signed with Ed25519", () => {
    const otp = mintOtp(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      { model: "wan/2-7-text-to-video", input: { duration: 5 } },
      5,
      600
    );

    const parsed = parseOtp(otp);
    expect(parsed.payload.v).toBe(1);
    expect(parsed.payload.provider).toBe("kie");
    expect(parsed.payload.method).toBe("POST");
    expect(parsed.payload.dotPath).toBe("api.v1.jobs.createTask");
    expect(parsed.payload.maxSpendUsd).toBe(5);
    expect(parsed.payload.jti).toHaveLength(32);
    expect(parsed.payload.requestHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(parsed.payload.iat).toBeLessThanOrEqual(
      Math.floor(Date.now() / 1000)
    );
    expect(parsed.payload.exp).toBe(parsed.payload.iat + 600);

    const parts = otp.split(".");
    const sigOk = verifyOtpSignature(
      parts[0]!,
      parsed.signature,
      publicKeyPem
    );
    expect(sigOk).toBe(true);
  });

  it("refuses to run without APICITY_PAYGATE_PRIVATE_KEY_PATH", () => {
    delete process.env.APICITY_PAYGATE_PRIVATE_KEY_PATH;
    expect(() =>
      mintOtp("kie", "POST", "api.v1.jobs.createTask", {}, 1, 60)
    ).toThrow("APICITY_PAYGATE_PRIVATE_KEY_PATH is not set");
  });

  it("uses correct request hash for canonicalized payload", () => {
    const payload = { b: 1, a: 2 };
    const otp = mintOtp("kie", "POST", "api.v1.jobs.createTask", payload, 1, 60);
    const parsed = parseOtp(otp);

    const expectedHash = (() => {
      const { createHash } = require("node:crypto");
      const canonical = JSON.stringify({ a: 2, b: 1 });
      const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
      return `sha256:${hash}`;
    })();

    expect(parsed.payload.requestHash).toBe(expectedHash);
  });
});

describe("generateKeyPair", () => {
  it("returns Ed25519 PEM pair", () => {
    const { publicKeyPem, privateKeyPem } = generateKeyPair();
    expect(publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
    expect(privateKeyPem).toMatch(/^-----BEGIN PRIVATE KEY-----/);
  });
});
describe("CLI subprocess", () => {
  let testDir: string;
  let privateKeyPath: string;
  let payloadFile: string;
  let privateKeyPem: string;
  let publicKeyPem: string;
  const cliPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../packages/provider/cost/dist/src/paygate-cli.js"
  );
  beforeEach(() => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    publicKeyPem = publicKey;
    privateKeyPem = privateKey;
    testDir = makeTestDir();
    privateKeyPath = join(testDir, "private.pem");
    writeFileSync(privateKeyPath, privateKeyPem, "utf8");
    payloadFile = join(testDir, "payload.json");
    writeFileSync(
      payloadFile,
      JSON.stringify({ model: "wan/2-7-text-to-video", input: { duration: 5 } }),
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
          "node",
          [
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
            "--max-spend",
            "5",
            "--ttl",
            "10m",
          ],
          {
            env: {
              ...process.env,
              APICITY_PAYGATE_PRIVATE_KEY_PATH: privateKeyPath,
            },
          },
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
    expect(parsed.payload.maxSpendUsd).toBe(5);
    const parts = otp.split(".");
    const sigOk = verifyOtpSignature(
      parts[0]!,
      parsed.signature,
      publicKeyPem
    );
    expect(sigOk).toBe(true);
  });
  it("exits with error when private key path is missing", async () => {
    const { execFile } = await import("node:child_process");
    const env = { ...process.env };
    delete env.APICITY_PAYGATE_PRIVATE_KEY_PATH;
    await expect(
      new Promise((resolve, reject) => {
        execFile(
          "node",
          [
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
            "--max-spend",
            "5",
            "--ttl",
            "10m",
          ],
          { env },
          (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          }
        );
      })
    ).rejects.toBeTruthy();
  });
});
