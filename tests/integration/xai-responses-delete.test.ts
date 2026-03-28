import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xai responses delete", () => {
  it("should expose del method on responses", () => {
    const provider = xai({
      apiKey: "sk-test-key",
    });
    expect(typeof provider.v1.responses.del).toBe("function");
    expect(provider.v1.responses.del.payloadSchema).toBeDefined();
    expect(provider.v1.responses.del.payloadSchema.method).toBe("DELETE");
    expect(provider.v1.responses.del.payloadSchema.path).toBe(
      "/responses/{id}"
    );
  });

  it("should validate delete schema fields", () => {
    const provider = xai({
      apiKey: "sk-test-key",
    });
    const schema = provider.v1.responses.del.payloadSchema;
    expect(schema.fields.id).toBeDefined();
    expect(schema.fields.id.type).toBe("string");
    expect(schema.fields.id.required).toBe(true);
  });
});
