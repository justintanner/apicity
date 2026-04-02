import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models upload endpoint integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/models-upload-endpoint");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get upload endpoint for model", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.post.v1.accounts.models.getUploadEndpoint({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      modelId: process.env.FIREWORKS_MODEL_ID ?? "test-model-id",
      fileSize: 1024,
      fileName: "test-model.bin",
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.headers).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.post.v1.accounts.models.getUploadEndpoint.validatePayload({
        accountId: "test-account",
        modelId: "test-model-id",
        fileName: "model.bin",
      });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.post.v1.accounts.models.getUploadEndpoint.validatePayload({
        fileSize: 1024,
      });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("modelId is required");
    expect(validation.errors).toContain("fileName is required");
  });
});
