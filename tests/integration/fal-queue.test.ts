import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal queue validation", () => {
  it("should expose queue submit payloadSchema", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    expect(provider.v1.queue.submit.payloadSchema).toBeDefined();
    expect(provider.v1.queue.submit.payloadSchema.method).toBe("POST");
    expect(
      provider.v1.queue.submit.payloadSchema.fields.endpoint_id
    ).toBeDefined();
    expect(
      provider.v1.queue.submit.payloadSchema.fields.endpoint_id.required
    ).toBe(true);
    expect(provider.v1.queue.submit.payloadSchema.fields.input).toBeDefined();
    expect(provider.v1.queue.submit.payloadSchema.fields.input.required).toBe(
      true
    );
  });

  it("should validate queue submit params — valid", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.validatePayload({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate queue submit params — missing required", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.validatePayload({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("endpoint_id is required");
    expect(result.errors).toContain("input is required");
  });

  it("should validate queue submit params — wrong types", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.validatePayload({
      endpoint_id: 123,
      input: "not-an-object",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("endpoint_id must be of type string");
    expect(result.errors).toContain("input must be of type object");
  });

  it("should validate queue submit params — invalid priority enum", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.validatePayload({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
      priority: "urgent",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must be one of");
  });

  it("should expose queue namespace methods", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    expect(typeof provider.v1.queue.submit).toBe("function");
    expect(typeof provider.v1.queue.status).toBe("function");
    expect(typeof provider.v1.queue.result).toBe("function");
    expect(typeof provider.v1.queue.cancel).toBe("function");
  });

  it("should accept custom queueBaseURL", () => {
    const provider = fal({
      apiKey: "fal-test-key",
      queueBaseURL: "https://custom-queue.example.com",
    });
    expect(provider.v1.queue).toBeDefined();
  });
});

describe("fal queue integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should submit to queue", async () => {
    ctx = setupPolly("fal/queue-submit");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.queue.submit({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cute cat", image_size: "square_hd" },
    });
    expect(result.request_id).toBeDefined();
    expect(typeof result.request_id).toBe("string");
    expect(result.response_url).toBeDefined();
    expect(result.status_url).toBeDefined();
    expect(result.cancel_url).toBeDefined();
    expect(typeof result.queue_position).toBe("number");
  });

  it("should check queue status", async () => {
    ctx = setupPolly("fal/queue-status");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    // First submit a job
    const submitted = await provider.v1.queue.submit({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a dog", image_size: "square_hd" },
    });

    // Then check status
    const status = await provider.v1.queue.status({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: submitted.request_id,
    });
    expect(status.status).toBeDefined();
    expect(["IN_QUEUE", "IN_PROGRESS", "COMPLETED"]).toContain(status.status);
    expect(status.request_id).toBeDefined();
  });

  it("should check queue status with logs", async () => {
    ctx = setupPolly("fal/queue-status-logs");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const submitted = await provider.v1.queue.submit({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a bird", image_size: "square_hd" },
    });

    const status = await provider.v1.queue.status({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: submitted.request_id,
      logs: true,
    });
    expect(status.status).toBeDefined();
    expect(["IN_QUEUE", "IN_PROGRESS", "COMPLETED"]).toContain(status.status);
  });

  it("should fetch queue result", async () => {
    ctx = setupPolly("fal/queue-result");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const submitted = await provider.v1.queue.submit({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a sunset", image_size: "square_hd" },
    });

    // Poll until complete
    let status = await provider.v1.queue.status({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: submitted.request_id,
    });

    // In replay mode this should resolve immediately
    while (status.status !== "COMPLETED") {
      await new Promise((r) => setTimeout(r, 1000));
      status = await provider.v1.queue.status({
        endpoint_id: "fal-ai/flux/schnell",
        request_id: submitted.request_id,
      });
    }

    const result = await provider.v1.queue.result({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: submitted.request_id,
    });
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("should cancel a queued request", async () => {
    ctx = setupPolly("fal/queue-cancel");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const submitted = await provider.v1.queue.submit({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a mountain", image_size: "square_hd" },
    });

    const cancelResult = await provider.v1.queue.cancel({
      endpoint_id: "fal-ai/flux/schnell",
      request_id: submitted.request_id,
    });
    expect(cancelResult).toBeDefined();
    expect(cancelResult.status).toBeDefined();
  });
});
