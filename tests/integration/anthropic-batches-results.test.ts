import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic batches results integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/batches-results");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get batch results", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
    });

    const result = await provider.get.v1.messages.batches.results({
      batchId: process.env.ANTHROPIC_BATCH_ID ?? "test-batch-id",
    });

    expect(result).toBeDefined();
    expect(result.batchId).toBeDefined();
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
  });
});
