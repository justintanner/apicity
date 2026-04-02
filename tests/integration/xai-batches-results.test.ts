import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI batches results list integration", () => {
  let ctx: PollyContext;
  let createdBatchId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/batches-results");
  });

  afterEach(async () => {
    // Cleanup
    if (createdBatchId) {
      try {
        const provider = xai({
          apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
        });
        await provider.post.v1.batches.cancel(createdBatchId);
      } catch {
        // Ignore cleanup errors
      }
      createdBatchId = null;
    }
    await teardownPolly(ctx);
  });

  it("should list batch results", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create batch first
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-results-list-" + Date.now(),
    });
    createdBatchId = created.id;

    // List results (may be empty for new batch)
    const result = await provider.get.v1.batches.results(created.id);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should list batch results with pagination", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create batch
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-results-page-" + Date.now(),
    });
    createdBatchId = created.id;

    // List with limit
    const result = await provider.get.v1.batches.results(created.id, {
      limit: 10,
    });
    expect(result.data).toBeDefined();
    expect(result.has_more).toBeDefined();
  });
});
