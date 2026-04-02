import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks datasets crud integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/datasets-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a dataset", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.post.v1.accounts.datasets.create({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      name: "test-dataset",
      description: "Test dataset for fine-tuning",
      data: [
        {
          messages: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi there!" },
          ],
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it("should get a dataset", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.get.v1.accounts.datasets.get({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      datasetId: process.env.FIREWORKS_DATASET_ID ?? "test-dataset-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBeDefined();
  });

  it("should update a dataset", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.patch.v1.accounts.datasets.update({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      datasetId: process.env.FIREWORKS_DATASET_ID ?? "test-dataset-id",
      description: "Updated description",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("should delete a dataset", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.delete.v1.accounts.datasets.delete({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      datasetId: process.env.FIREWORKS_DATASET_ID ?? "test-dataset-id",
    });

    expect(result).toBeDefined();
  });

  it("should validate create payload schema", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.post.v1.accounts.datasets.create.validatePayload({
        accountId: "test-account",
        name: "test-dataset",
        data: [],
      });

    expect(validation.valid).toBe(true);
  });

  it("should reject create payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.post.v1.accounts.datasets.create.validatePayload({});

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("name is required");
  });
});
