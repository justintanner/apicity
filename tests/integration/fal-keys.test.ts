import { describe, it, expect } from "vitest";
import { fal } from "@nakedapi/fal";

describe("fal api keys", () => {
  it("should expose keys namespace methods", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.keys).toBe("function");
    expect(typeof provider.v1.keys.create).toBe("function");
    expect(typeof provider.v1.keys.delete).toBe("function");
  });

  it("should expose create payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.v1.keys.create.payloadSchema;
    expect(schema).toBeDefined();
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/keys");
    expect(schema.contentType).toBe("application/json");
    expect(schema.fields.alias).toBeDefined();
    expect(schema.fields.alias.required).toBe(true);
  });

  it("should validate create params — valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.keys.create.validatePayload({
      alias: "Production Key",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate create params — missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.keys.create.validatePayload({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("alias is required");
  });

  it("should validate create params — wrong type", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.keys.create.validatePayload({
      alias: 123,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("alias must be of type string");
  });

  it("should validate create params — non-object payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.keys.create.validatePayload("not-an-object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("payload must be a non-null object");
  });
});
