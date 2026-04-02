import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai collections update integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-update");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should update a collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const result = await provider.put.v1.collections({
      collectionId: process.env.XAI_COLLECTION_ID ?? "test-collection-id",
      name: "Updated Collection Name",
      description: "Updated description",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const validation = provider.put.v1.collections.validatePayload({
      collectionId: "test-collection-id",
      name: "Updated Name",
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const validation = provider.put.v1.collections.validatePayload({
      description: "Only description",
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("collectionId is required");
  });
});
