import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai } from "@apicity/xai";

describe("xAI collections documents batchGet integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-documents-batchget");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should have batchGet sub-method on get.managementApi.v1.collections.documents", () => {
    const provider = createXai({ apiKey: "sk-test-key" });
    expect(
      provider.get.managementApi.v1.collections.documents.batchGet
    ).toBeDefined();
    expect(
      typeof provider.get.managementApi.v1.collections.documents.batchGet
    ).toBe("function");
  });

  it("should batch get documents from collection using management API", async () => {
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      managementApiKey: process.env.XAI_MANAGEMENT_API_KEY ?? "sk-mgmt-key",
    });

    // Create a collection
    const collection = await provider.post.managementApi.v1.collections({
      collection_name: "test-collection-batchget",
    });
    expect(collection.collection_id).toBeDefined();

    // Upload multiple files
    const blob1 = new Blob(["Content 1"], { type: "text/plain" });
    const file1 = await provider.post.v1.files(blob1, "doc1.txt", "batch");

    const blob2 = new Blob(["Content 2"], { type: "text/plain" });
    const file2 = await provider.post.v1.files(blob2, "doc2.txt", "batch");

    // Add both as documents
    await provider.post.managementApi.v1.collections.documents(
      collection.collection_id,
      file1.id
    );
    await provider.post.managementApi.v1.collections.documents(
      collection.collection_id,
      file2.id
    );

    // Batch get documents
    const result =
      await provider.get.managementApi.v1.collections.documents.batchGet(
        collection.collection_id,
        [file1.id, file2.id]
      );

    expect(result).toBeDefined();
    expect(result.documents).toBeDefined();
    expect(Array.isArray(result.documents)).toBe(true);
  });
});
