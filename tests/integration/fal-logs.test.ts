import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal serverless logs integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should query log history", async () => {
    ctx = setupPolly("fal/logs-history");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.serverless.logs.history({
      limit: 10,
    });
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should query log history with filters", async () => {
    ctx = setupPolly("fal/logs-history-filtered");
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const result = await provider.v1.serverless.logs.history(
      {
        limit: 5,
        level: "error",
      },
      [{ key: "fal_job_id", value: "test-job" }]
    );
    expect(result).toBeDefined();
    expect(result.has_more).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should expose payloadSchema on history", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.v1.serverless.logs.history.payloadSchema).toBeDefined();
    expect(provider.v1.serverless.logs.history.payloadSchema.method).toBe(
      "POST"
    );
    expect(provider.v1.serverless.logs.history.payloadSchema.path).toBe(
      "/serverless/logs/history"
    );
  });

  it("should validate history payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const valid = provider.v1.serverless.logs.history.validatePayload({
      limit: 10,
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = provider.v1.serverless.logs.history.validatePayload({
      run_source: "invalid-source",
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it("should expose payloadSchema on stream", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(
      provider.post.stream.v1.serverless.logs.stream.payloadSchema
    ).toBeDefined();
    expect(
      provider.post.stream.v1.serverless.logs.stream.payloadSchema.method
    ).toBe("POST");
    expect(
      provider.post.stream.v1.serverless.logs.stream.payloadSchema.path
    ).toBe("/serverless/logs/stream");
  });

  it("should validate stream payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const valid =
      provider.post.stream.v1.serverless.logs.stream.validatePayload({
        level: "info",
      });
    expect(valid.valid).toBe(true);

    const invalid =
      provider.post.stream.v1.serverless.logs.stream.validatePayload({
        run_source: "bad-value",
      });
    expect(invalid.valid).toBe(false);
  });
});
