import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai, type XaiDocumentSearchRequest } from "@apicity/xai";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("xAI documents search integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/documents-search");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should have documents search under post.v1", () => {
    const provider = createXai({ apiKey: "test-key" });
    expect(provider.post.v1.documents.search).toBeDefined();
    expect(provider.post.v1.documents.search).toBeTypeOf("function");
  });

  it("should search documents with a schema-valid source payload", async () => {
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      managementApiKey: process.env.XAI_MANAGEMENT_API_KEY ?? "sk-mgmt-key",
    });

    const collection = await provider.post.managementApi.v1.collections({
      collection_name: "test-collection-documents-search",
    });
    expect(collection.collection_id).toBeDefined();

    const content = [
      "Apicity documents-search fixture.",
      "The searchable keyword is aurora-test-vector.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const file = await provider.post.v1.files(
      blob,
      "documents-search.txt",
      "batch"
    );
    expect(file.id).toBeDefined();

    await provider.post.managementApi.v1.collections.documents(
      collection.collection_id,
      file.id
    );

    for (let attempt = 0; attempt < 15; attempt += 1) {
      const batch =
        await provider.get.managementApi.v1.collections.documents.batchGet(
          collection.collection_id,
          [file.id]
        );
      const document = batch.documents[0];
      if (
        document?.last_indexed_at ||
        document?.status === "DOCUMENT_STATUS_PROCESSED"
      ) {
        break;
      }
      if (ctx.mode !== "replay") {
        await sleep(2000);
      }
    }

    const request: XaiDocumentSearchRequest = {
      query: "aurora-test-vector",
      source: { collection_ids: [collection.collection_id] },
      limit: 5,
    };
    const parsed = provider.post.v1.documents.search.schema.safeParse(request);
    expect(parsed.success).toBe(true);

    const result = await provider.post.v1.documents.search(request);

    expect(result).toBeDefined();
    expect(Array.isArray(result.matches)).toBe(true);
  });
});
