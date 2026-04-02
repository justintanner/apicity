import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI batches requests list integration", () => {
  let ctx: PollyContext;
  let createdBatchId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("xai/batches-requests");
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

  it("should list batch requests", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // Create batch first
    const created = await provider.post.v1.batches({
      endpoint: "/v1/chat/completions",
      input_file_id: "file-reqs-" + Date.now(),
    });
    createdBatchId = created.id;

    // Add some requests
    await provider.post.v1.batches.requests(created.id, {
      requests: [
        {
          custom_id: "req-list-1",
          method: "POST",
          url: "/v1/chat/completions",
          body: {
            model: "grok-2",
            messages: [{ role: "user", content: "Hi" }],
          },
        },
        {
          custom_id: "req-list-2",
          method: "POST",
          url: "/v1/chat/completions",
          body: {
            model: "grok-2",
            messages: [{ role: "user", content: "Hello" }],
          },
        },
      ],
    });

    // List requests
    const result = await provider.get.v1.batches.requests(created.id);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
});
