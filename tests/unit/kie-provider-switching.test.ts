import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { sign, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalHash } from "../../packages/provider/cost/src/paygate";
import { kie } from "../../packages/provider/kie/src/kie";

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

describe("KIE provider switching", () => {
  it("routes Veo requests through the veo namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "veo-1" } }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    await provider.veo.post.api.v1.veo.generate({
      prompt: "Make a short video",
      model: "veo3",
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/veo/generate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      prompt: "Make a short video",
      model: "veo3",
    });
  });

  it("routes Suno requests through the suno namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "suno-1" } }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    await provider.suno.post.api.v1.generate({
      prompt: "Write a synthwave track",
      model: "V4",
      instrumental: true,
      customMode: false,
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/generate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      prompt: "Write a synthwave track",
      model: "V4",
      instrumental: true,
      customMode: false,
    });
  });

  it("routes Claude requests through the claude namespace", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    await provider.claude.post.v1.messages({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/claude/v1/messages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("keeps grok-imagine models on createTask and exposes their schema", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, data: { taskId: "grok-1" } }), {
        status: 200,
      })
    );

    const provider = kie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
    });

    const payload = {
      model: "grok-imagine/text-to-image" as const,
      input: {
        prompt: "A glass greenhouse in a storm",
        aspect_ratio: "16:9" as const,
      },
    };

    expect(provider.modelInputSchemas["grok-imagine/text-to-image"].type).toBe(
      "image"
    );
    const validationResult =
      provider.post.api.v1.jobs.createTask.schema.safeParse(payload);
    expect(validationResult.success).toBe(true);
    const otp = mintTestOtp(privateKeyPem, {
      jti: randomBytes(16).toString("hex"),
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      requestHash: canonicalHash(payload as unknown as Record<string, unknown>),
      maxSpendUsd: 100,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    await provider.post.api.v1.jobs.createTask(payload, { otp });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });
});
