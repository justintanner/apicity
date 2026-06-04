import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai } from "@apicity/xai";

describe("xAI collections documents add integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-documents-add");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should have collections.documents sub-method on post.v1.collections", () => {
    const provider = createXai({ apiKey: "sk-test-key" });
    expect(provider.post.v1.collections.documents).toBeDefined();
    expect(typeof provider.post.v1.collections.documents).toBe("function");
  });

  it("should add document to collection using management API", async () => {
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      managementApiKey: process.env.XAI_MANAGEMENT_API_KEY ?? "sk-mgmt-key",
    });

    // Create a collection first
    const collection = await provider.post.v1.collections({
      collection_name: "test-collection-for-docs",
    });
    expect(collection.collection_id).toBeDefined();

    // First upload a file to use as document
    const blob = new Blob(["Test document content"], { type: "text/plain" });
    const file = await provider.post.v1.files(blob, "test-doc.txt", "batch");
    expect(file.id).toBeDefined();

    // Add the file as a document to the collection
    await provider.post.v1.collections.documents(
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
