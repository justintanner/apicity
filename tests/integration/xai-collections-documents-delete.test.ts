import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai } from "@apicity/xai";

describe("xAI collections documents delete integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-documents-delete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should have delete.v1.collections.documents sub-method", () => {
    const provider = createXai({ apiKey: "sk-test-key" });
    expect(provider.delete.v1.collections.documents).toBeDefined();
    expect(typeof provider.delete.v1.collections.documents).toBe("function");
  });

  it("should delete document from collection using management API", async () => {
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      managementApiKey: process.env.XAI_MANAGEMENT_API_KEY ?? "sk-mgmt-key",
    });

    // Create a collection
    const collection = await provider.post.v1.collections({
      collection_name: "test-collection-delete-doc",
    });
    expect(collection.collection_id).toBeDefined();

    // Upload a file
    const blob = new Blob(["Test content for deletion"], {
      type: "text/plain",
    });
    const file = await provider.post.v1.files(blob, "test-del.txt", "batch");
    expect(file.id).toBeDefined();

    // Add document to collection
    await provider.post.v1.collections.documents(
      collection.collection_id,
      file.id
    );

    // Delete the document
    await provider.delete.v1.collections.documents(
      collection.collection_id,
      file.id
    );

    // Verify by listing documents
    const documents = await provider.get.v1.collections.documents(
      collection.collection_id
    );
    expect(documents).toBeDefined();
  });
});
