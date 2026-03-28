import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai realtime", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/realtime-client-secrets");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a client secret", async () => {
    const provider = xai({ apiKey: process.env.XAI_API_KEY ?? "sk-test-key" });
    const result = await provider.v1.realtime.clientSecrets({
      expires_after: { seconds: 60 },
    });
    expect(result.value).toBeTruthy();
    expect(typeof result.value).toBe("string");
    expect(result.expires_at).toBeGreaterThan(0);
    expect(typeof result.expires_at).toBe("number");
  });

  it("should validate client_secrets payload schema", () => {
    const provider = xai({ apiKey: "sk-test-key" });
    const schema = provider.v1.realtime.clientSecrets.payloadSchema;
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/realtime/client_secrets");
    expect(schema.contentType).toBe("application/json");
    expect(schema.fields.expires_after).toBeDefined();
  });

  it("should validate client_secrets payload", () => {
    const provider = xai({ apiKey: "sk-test-key" });
    const valid = provider.v1.realtime.clientSecrets.validatePayload({
      expires_after: { seconds: 600 },
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it("should reject invalid client_secrets payload", () => {
    const provider = xai({ apiKey: "sk-test-key" });
    const result = provider.v1.realtime.clientSecrets.validatePayload({
      expires_after: "invalid",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should expose connect method", () => {
    const provider = xai({ apiKey: "sk-test-key" });
    expect(typeof provider.v1.realtime.connect).toBe("function");
  });
});
