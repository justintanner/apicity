import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal queue result integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/queue-result");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get queue result for a submitted job", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.get.v1.queue.result({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: process.env.FAL_QUEUE_REQUEST_ID ?? "test-request-id",
    });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });

  it("should get queue status", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.get.v1.queue.status({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: process.env.FAL_QUEUE_REQUEST_ID ?? "test-request-id",
      logs: true,
    });

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });
});
