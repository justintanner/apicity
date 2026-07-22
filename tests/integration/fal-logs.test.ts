import { describe, it, expect } from "vitest";
import { createFal } from "@apicity/fal";
import { FalLogsStreamRequestSchema } from "@apicity/fal/zod";

describe("fal serverless logs validation", () => {
  it("should expose schema on stream", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(provider.post.stream.v1.serverless.logs.stream.schema).toBe(
      FalLogsStreamRequestSchema
    );
    expect(
      typeof provider.post.stream.v1.serverless.logs.stream.schema.safeParse
    ).toBe("function");
  });

  it("should validate stream payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const valid =
      provider.post.stream.v1.serverless.logs.stream.schema.safeParse({
        level: "info",
      });
    expect(valid.success).toBe(true);

    const invalid =
      provider.post.stream.v1.serverless.logs.stream.schema.safeParse({
        run_source: "bad-value",
      });
    expect(invalid.success).toBe(false);
  });
});
