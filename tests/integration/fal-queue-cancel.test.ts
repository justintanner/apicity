import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal queue cancel integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/queue-cancel");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should cancel a queue request", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    // First submit to queue
    const submitted = await provider.v1.queue.submit({
      model: "fal-ai/flux/dev",
      input: { prompt: "test" },
    });
    expect(submitted.request_id).toBeTruthy();

    // Cancel
    const result = await provider.v1.queue.cancel(submitted.request_id);
    expect(result.status).toMatch(/cancelled|cancelling/);
  });

  it("should get queue status before cancel", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    // Submit
    const submitted = await provider.v1.queue.submit({
      model: "fal-ai/flux/dev",
      input: { prompt: "test status" },
    });

    // Check status
    const status = await provider.v1.queue.status(submitted.request_id);
    expect(status.status).toBeDefined();
  });
});
