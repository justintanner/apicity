import { describe, it, expect } from "vitest";
import { fal } from "@nakedapi/fal";

describe("fal serverless apps queue", () => {
  it("should expose apps.queue as callable function", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.serverless.apps.queue).toBe("function");
  });

  it("should expose apps.queue.flush with payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.serverless.apps.queue.flush).toBe("function");
    expect(provider.v1.serverless.apps.queue.flush.payloadSchema).toBeDefined();
    expect(provider.v1.serverless.apps.queue.flush.payloadSchema.method).toBe(
      "DELETE"
    );
    expect(
      provider.v1.serverless.apps.queue.flush.payloadSchema.fields.owner
    ).toBeDefined();
    expect(
      provider.v1.serverless.apps.queue.flush.payloadSchema.fields.owner
        .required
    ).toBe(true);
    expect(
      provider.v1.serverless.apps.queue.flush.payloadSchema.fields.name
    ).toBeDefined();
    expect(
      provider.v1.serverless.apps.queue.flush.payloadSchema.fields.name.required
    ).toBe(true);
  });

  it("should validate flush params — valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.apps.queue.flush.validatePayload({
      owner: "user_123",
      name: "my-app",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate flush params — with idempotency_key", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.apps.queue.flush.validatePayload({
      owner: "user_123",
      name: "my-app",
      idempotency_key: "abc-123",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate flush params — missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.apps.queue.flush.validatePayload({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("owner is required");
    expect(result.errors).toContain("name is required");
  });

  it("should validate flush params — wrong types", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.apps.queue.flush.validatePayload({
      owner: 123,
      name: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("owner must be of type string");
    expect(result.errors).toContain("name must be of type string");
  });
});

describe("fal serverless metrics", () => {
  it("should expose metrics as a function", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.serverless.metrics).toBe("function");
  });
});
