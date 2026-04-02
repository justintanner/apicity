import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai collections documents patch integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/collections-documents-patch");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should patch a document in a collection", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const result = await provider.patch.v1.collections.documents({
      collectionId: process.env.XAI_COLLECTION_ID ?? "test-collection-id",
      fileId: process.env.XAI_FILE_ID ?? "test-file-id",
      name: "Updated Document Name",
      metadata: { updated: true },
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });
});
