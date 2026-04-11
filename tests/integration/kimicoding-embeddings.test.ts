import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding } from "@nakedapi/kimicoding";

describe("kimicoding embeddings integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate embeddings for a text input", async () => {
    ctx = setupPolly("kimicoding/embeddings-hello");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.coding.v1.embeddings({
      model: "k2p5",
      input: "Hello world",
    });

    expect(result.object).toBe("list");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].index).toBe(0);
    expect(Array.isArray(result.data[0].embedding)).toBe(true);
    expect(result.data[0].embedding.length).toBeGreaterThan(0);
    expect(result.model).toBeTruthy();
  });
});
