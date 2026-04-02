import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models update integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/models-update");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should update a custom model", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.patch.v1.accounts.models.update({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      modelId: process.env.FIREWORKS_MODEL_ID ?? "test-model-id",
      description: "Updated description for test model",
      tags: ["test", "updated"],
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.patch.v1.accounts.models.update.validatePayload(
      {
        accountId: "test-account",
        modelId: "test-model-id",
        description: "Test description",
      }
    );

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.patch.v1.accounts.models.update.validatePayload(
      {
        description: "Test description",
      }
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("modelId is required");
  });
});
