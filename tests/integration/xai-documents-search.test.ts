import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI documents search integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/documents-search");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should search documents", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.post.v1.documents.search({
      query: "test query",
      limit: 5,
    });
    expect(result.documents).toBeDefined();
    expect(Array.isArray(result.documents)).toBe(true);
  });

  it("should search documents with filters", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.post.v1.documents.search({
      query: "test",
      limit: 10,
      filters: { collection_id: "test-collection" },
    });
    expect(result.documents).toBeDefined();
  });
});
