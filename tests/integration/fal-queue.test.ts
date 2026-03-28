import { describe, it, expect } from "vitest";
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
