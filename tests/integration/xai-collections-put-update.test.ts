import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai } from "@apicity/xai";
import { XaiCollectionUpdateRequestSchema } from "@apicity/xai/zod";

describe("xAI collections PUT update integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-put-update");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should have schema with safeParse on put.managementApi.v1.collections", () => {
    const provider = createXai({ apiKey: "sk-test-key" });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.put.managementApi.v1.collections.schema).toBe(
      XaiCollectionUpdateRequestSchema
    );
    expect(
      typeof provider.put.managementApi.v1.collections.schema.safeParse
    ).toBe("function");

    const result = provider.put.managementApi.v1.collections.schema.safeParse({
      collection_name: "test-collection",
    });
    expect(result.success).toBe(true);
  });

  it("should update a collection using PUT with management API", async () => {
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      managementApiKey: process.env.XAI_MANAGEMENT_API_KEY ?? "sk-mgmt-key",
    });

    // Create a collection first
    const collection = await provider.post.managementApi.v1.collections({
      collection_name: "test-collection-for-update",
    });
    expect(collection.collection_id).toBeDefined();

    // Update the collection
    const updated = await provider.put.managementApi.v1.collections(
      collection.collection_id,
      {
        collection_name: "updated-collection-name",
      }
    );

    expect(updated).toBeDefined();
    expect(updated.collection_id).toBe(collection.collection_id);
  });
});
