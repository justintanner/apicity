import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalHash } from "../../packages/provider/cost/src/paygate";
import {
  setupPolly,
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { kie, submitMediaJob } from "@apicity/kie";

function base64urlEncode(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function mintTestOtp(
  privateKeyPem: string,
  payload: Record<string, unknown>
): string {
  const payloadJson = JSON.stringify({ v: 1, ...payload });
  const payloadSegment = base64urlEncode(Buffer.from(payloadJson, "utf8"));
  const signature = sign(
    null,
    Buffer.from(payloadSegment, "utf8"),
    privateKeyPem
  );
  const signatureSegment = base64urlEncode(signature);
  return `${payloadSegment}.${signatureSegment}`;
}

let privateKeyPem: string;
let publicKeyPath: string;
let testDir: string;

beforeAll(() => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  privateKeyPem = privateKey;
  testDir = join(
    tmpdir(),
    "apicity-paygate-test-" + randomBytes(8).toString("hex")
  );
  mkdirSync(testDir, { recursive: true });
  publicKeyPath = join(testDir, "public.pem");
  writeFileSync(publicKeyPath, publicKey, "utf8");
  process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH = publicKeyPath;
});

afterAll(() => {
  delete process.env.APICITY_PAYGATE_PUBLIC_KEY_PATH;
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe("kie helper functions", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("submitMediaJob", () => {
    it("should create task and return taskId", async () => {
      ctx = setupPolly("kie/helpers/submit-media-job");
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const otp = mintTestOtp(privateKeyPem, {
        jti: randomBytes(16).toString("hex"),
        provider: "kie",
        method: "POST",
        dotPath: "api.v1.jobs.createTask",
        requestHash: canonicalHash({
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "A red apple on a wooden table",
            aspect_ratio: "1:1",
          },
        }),
        maxSpendUsd: 100,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      const taskId = await submitMediaJob(
        provider,
        {
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "A red apple on a wooden table",
            aspect_ratio: "1:1",
          },
        },
        { otp }
      );

      expect(taskId).toBeTruthy();
      expect(typeof taskId).toBe("string");
      expect(taskId.length).toBeGreaterThan(0);
    });
  });

  describe("upload helpers", () => {
    it("should upload file stream directly and return download URL", async () => {
      ctx = setupPollyForFileUploads("kie/helpers/upload-file");
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Create a small test file
      const base64Pixel =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFCcSAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const binaryString = atob(base64Pixel);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const file = new Blob([bytes], { type: "image/png" });

      // Use the direct endpoint instead of helper for consistent replay
      const result = await provider.post.api.fileStreamUpload({
        file,
        filename: "test.png",
        uploadPath: "uploads",
      });

      expect(result.code).toBe(200);
      expect(result.data?.downloadUrl).toBeTruthy();
      expect(result.data?.downloadUrl).toMatch(/^https:\/\//);
    });
  });

  describe("payload validation", () => {
    it("should validate payload schema for createTask", async () => {
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const result = provider.post.api.v1.jobs.createTask.schema.safeParse({
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "test",
          aspect_ratio: "1:1",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate payload schema for file uploads", async () => {
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const result = provider.post.api.fileStreamUpload.schema.safeParse({
        file: new Blob(["test"]),
        filename: "test.png",
        uploadPath: "uploads",
      });
      expect(result.success).toBe(true);
    });
  });
});
