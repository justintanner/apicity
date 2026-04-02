import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models prepare integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/models-prepare");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should prepare a custom model for inference", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.post.v1.accounts.models.prepare({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      modelId: process.env.FIREWORKS_MODEL_ID ?? "test-model-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.post.v1.accounts.models.prepare.validatePayload(
      {
        accountId: "test-account",
        modelId: "test-model-id",
      }
    );

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.post.v1.accounts.models.prepare.validatePayload(
      {}
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("modelId is required");
  });
});
