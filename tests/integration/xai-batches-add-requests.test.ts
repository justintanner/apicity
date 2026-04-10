import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xAI batches add requests integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/batches-add-requests");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should add requests to a batch", async () => {
    const provider = createXaiProvider();

    // First create a batch
    const batch = await provider.post.v1.batches({
      name: "test-batch-for-requests",
    });
    expect(batch.batch_id).toBeDefined();

    // Add requests to the batch using correct format
    await provider.post.v1.batches.requests(batch.batch_id, {
      batch_requests: [
        {
          batch_request_id: "test_req_0",
          batch_request: {
            chat_get_completion: {
              messages: [{ role: "user", content: "What is 2+2?" }],
              model: "grok-3",
            },
          },
        },
      ],
    });

    // Verify by listing requests
    const requests = await provider.get.v1.batches.requests(batch.batch_id);
    expect(requests).toBeDefined();
    expect(requests.batch_request_metadata.length).toBeGreaterThan(0);
  });
});
