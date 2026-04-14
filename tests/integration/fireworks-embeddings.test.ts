import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks embeddings integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/embeddings-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate embeddings for a text input", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.inference.v1.embeddings({
      model: "nomic-ai/nomic-embed-text-v1.5",
      input: "Hello world",
    });

    expect(result.object).toBe("list");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].object).toBe("embedding");
    expect(result.data[0].index).toBe(0);
    expect(Array.isArray(result.data[0].embedding)).toBe(true);
    expect(result.data[0].embedding.length).toBeGreaterThan(0);
    expect(result.usage.prompt_tokens).toBeGreaterThan(0);
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });
});
