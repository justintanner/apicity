import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI collections CRUD integration", () => {
  let ctx: PollyContext;
  let createdCollectionId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-crud");
  });

  afterEach(async () => {
    // Cleanup: delete created collection if test left it behind
    if (createdCollectionId) {
      try {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
        });
        await provider.delete.v1.collections(createdCollectionId);
      } catch {
        // Ignore cleanup errors
      }
      createdCollectionId = null;
    }
    await teardownPolly(ctx);
  });

  it("should create a collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.post.v1.collections({
      name: "test-collection-" + Date.now(),
    });
    expect(result.id).toBeTruthy();
    expect(result.name).toBeTruthy();
    createdCollectionId = result.id;
  });

  it("should list collections", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.get.v1.collections();
    expect(result.collections).toBeDefined();
    expect(Array.isArray(result.collections)).toBe(true);
  });

  it("should get a collection by id", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // First create a collection
    const created = await provider.post.v1.collections({
      name: "test-get-collection-" + Date.now(),
    });
    createdCollectionId = created.id;

    // Then get it
    const result = await provider.get.v1.collections(created.id);
    expect(result.id).toBe(created.id);
    expect(result.name).toBe(created.name);
  });

  it("should update a collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create
    const created = await provider.post.v1.collections({
      name: "test-update-collection-" + Date.now(),
    });
    createdCollectionId = created.id;

    // Update
    const updated = await provider.put.v1.collections(created.id, {
      name: "updated-collection-" + Date.now(),
    });
    expect(updated.id).toBe(created.id);
  });

  it("should delete a collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create
    const created = await provider.post.v1.collections({
      name: "test-delete-collection-" + Date.now(),
    });

    // Delete
    await provider.delete.v1.collections(created.id);
    createdCollectionId = null; // Already deleted
  });
});
