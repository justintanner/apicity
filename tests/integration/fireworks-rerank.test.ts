import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks rerank integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/rerank-basic");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should rerank documents by relevance to a query", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.v1.rerank({
      model: "fireworks/qwen3-reranker-8b",
      query: "What is the capital of France?",
      documents: [
        "Berlin is the capital of Germany.",
        "Paris is the capital and largest city of France.",
        "Madrid is the capital of Spain.",
      ],
      top_n: 2,
      return_documents: true,
    });

    expect(result.object).toBe("list");
    expect(result.model).toContain("qwen3-reranker");
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toHaveProperty("index");
    expect(result.data[0]).toHaveProperty("relevance_score");
    expect(typeof result.data[0].relevance_score).toBe("number");
    // The Paris document should rank highest
    expect(result.data[0].index).toBe(1);
    expect(result.data[0].relevance_score).toBeGreaterThan(0);
    // With return_documents=true, document text should be included
    expect(result.data[0].document).toBeDefined();
    expect(result.usage.prompt_tokens).toBeGreaterThan(0);
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });
});
