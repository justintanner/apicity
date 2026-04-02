import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models delete integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/models-delete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should delete a custom model", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.delete.v1.accounts.models.delete({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      modelId: process.env.FIREWORKS_MODEL_ID ?? "test-model-id",
    });

    expect(result).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.delete.v1.accounts.models.delete.validatePayload({
        accountId: "test-account",
        modelId: "test-model-id",
      });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.delete.v1.accounts.models.delete.validatePayload({});

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("modelId is required");
  });
});
