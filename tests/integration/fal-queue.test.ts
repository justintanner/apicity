import { describe, it, expect } from "vitest";
import { fal } from "@apicity/fal";

describe("fal queue validation", () => {
  it("should expose queue submit schema", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    expect(provider.v1.queue.submit.schema).toBeDefined();
    expect(typeof provider.v1.queue.submit.schema.safeParse).toBe("function");
  });

  it("should validate queue submit params - valid", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({
      endpoint_id: "fal-ai/flux/schnell",
      input: { prompt: "a cat" },
    });
    expect(result.success).toBe(true);
  });

  it("should validate queue submit params - missing required", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({});
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("endpoint_id"))
    ).toBe(true);
    expect(result.error?.issues.some((i) => i.path.includes("input"))).toBe(
      true
    );
  });

  it("should validate queue submit params - wrong types", () => {
    const provider = fal({
      apiKey: "fal-test-key",
    });
    const result = provider.v1.queue.submit.schema.safeParse({
      endpoint_id: 123,
      input: "not-an-object",
    });
    expect(result.success).toBe(false);
  });

  it("should validate queue submit params - invalid priority enum", () => {
    const provider = fal({
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
    const provider = fal({
      apiKey: "fal-test-key",
    });
    expect(typeof provider.v1.queue.submit).toBe("function");
    expect(typeof provider.v1.queue.status).toBe("function");
  });

  it("should accept custom queueBaseURL", () => {
    const provider = fal({
      apiKey: "fal-test-key",
      queueBaseURL: "https://custom-queue.example.com",
    });
    expect(provider.v1.queue).toBeDefined();
  });
});
