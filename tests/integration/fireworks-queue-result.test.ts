import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks queue result integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/queue-result");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get queue result for a submitted job", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    // First submit a job, then get its result
    const submitResult = await provider.post.v1.queue.submit({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
    });

    expect(submitResult).toBeDefined();
    expect(submitResult.request_id).toBeDefined();

    // Get the result
    const result = await provider.get.v1.queue.result({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: submitResult.request_id,
    });

    expect(result).toBeDefined();
  });

  it("should get queue status", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.get.v1.queue.status({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: process.env.FIREWORKS_QUEUE_REQUEST_ID ?? "test-request-id",
      logs: true,
    });

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });
});
