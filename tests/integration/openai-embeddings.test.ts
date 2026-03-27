import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai embeddings integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/embeddings-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate embeddings for a text input", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.v1.embeddings({
      model: "text-embedding-3-small",
      input: "Hello world",
    });

    expect(result.object).toBe("list");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].object).toBe("embedding");
    expect(result.data[0].index).toBe(0);
    expect(Array.isArray(result.data[0].embedding)).toBe(true);
    expect(result.data[0].embedding.length).toBeGreaterThan(0);
    expect(result.model).toContain("text-embedding-3-small");
    expect(result.usage.prompt_tokens).toBeGreaterThan(0);
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });
});
