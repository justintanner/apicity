import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI collections documents integration", () => {
  let ctx: PollyContext;
  let createdCollectionId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-docs");
  });

  afterEach(async () => {
    // Cleanup
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

  it("should add a document to collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create collection
    const collection = await provider.post.v1.collections({
      name: "test-docs-collection-" + Date.now(),
    });
    createdCollectionId = collection.id;

    // Create a file first
    const content = new Blob(["test document content"], { type: "text/plain" });
    const file = await provider.post.v1.files(
      content,
      "test-doc.txt",
      "assistants"
    );

    // Add document
    await provider.post.v1.collections.documents(collection.id, file.id);
  });

  it("should list documents in collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create collection
    const collection = await provider.post.v1.collections({
      name: "test-list-docs-" + Date.now(),
    });
    createdCollectionId = collection.id;

    // List documents (should be empty)
    const result = await provider.get.v1.collections.documents(collection.id);
    expect(result.documents).toBeDefined();
  });

  it("should delete a document from collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create collection
    const collection = await provider.post.v1.collections({
      name: "test-delete-doc-" + Date.now(),
    });
    createdCollectionId = collection.id;

    // Create and add file
    const content = new Blob(["delete me"], { type: "text/plain" });
    const file = await provider.post.v1.files(
      content,
      "delete-me.txt",
      "assistants"
    );
    await provider.post.v1.collections.documents(collection.id, file.id);

    // Delete document
    await provider.delete.v1.collections.documents(collection.id, file.id);
  });
});
