import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models create integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/models-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a custom model", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    // Creating a custom model requires specific permissions
    // This test assumes proper account access
    const result = await provider.post.v1.accounts.models.create({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      name: "test-custom-model",
      baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
      datasetId: process.env.FIREWORKS_DATASET_ID ?? "test-dataset",
      tuning: {
        suffix: "test-suffix",
        epochs: 1,
        batchSize: 4,
        learningRate: 0.0001,
      },
    });

    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.post.v1.accounts.models.create.validatePayload({
      accountId: "test-account",
      name: "test-model",
      baseModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation = provider.post.v1.accounts.models.create.validatePayload(
      {}
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("name is required");
    expect(validation.errors).toContain("baseModel is required");
  });
});
