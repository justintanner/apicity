import { describe, it, expect } from "vitest";
import { createFal } from "@apicity/fal";
import { FalQueueSubmitRequestSchema } from "@apicity/fal/zod";

describe("fal queue validation", () => {
  it("should expose queue submit schema", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
    });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.v1.queue.submit.schema).toBe(FalQueueSubmitRequestSchema);
    expect(typeof provider.v1.queue.submit.schema.safeParse).toBe("function");
  });

  it("should validate queue submit params - valid", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate queue submit params - missing required", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((i) => i.path.includes("endpoint_id"))
    ).toBe(true);
    expect(result.error.issues.some((i) => i.path.includes("input"))).toBe(
      true
    );
  });

  it("should validate queue submit params - wrong types", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({
      endpoint_id: 123,
      input: "not-an-object",
    });
    expect(result.success).toBe(false);
  });

  it("should validate queue submit params - invalid priority enum", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
      priority: "urgent",
    });
    expect(result.success).toBe(false);
  });

  it("should expose queue namespace methods", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
    });
    expect(typeof provider.v1.queue.submit).toBe("function");
    expect(typeof provider.v1.queue.status).toBe("function");
    expect(typeof provider.v1.queue.result).toBe("function");
    expect(typeof provider.get.v1.queue.result).toBe("function");
  });

  it("should accept custom queueBaseURL", () => {
    const provider = createFal({
      apiKey: "fal-test-key",
      queueBaseURL: "https://custom-queue.example.com",
    });
    expect(provider.v1.queue).toBeDefined();
  });
});
