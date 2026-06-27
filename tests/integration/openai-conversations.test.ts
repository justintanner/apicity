import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai conversations integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/conversations-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a durable conversation with a seed message", async () => {
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.conversations({
      items: [
        {
          role: "user",
          content: "Hello, let's start a conversation.",
        },
      ],
      metadata: { topic: "greeting" },
    });

    expect(result.id).toBeDefined();
    expect(result.object).toBe("conversation");
    expect(typeof result.created_at).toBe("number");
    expect(result.created_at).toBeGreaterThan(0);
    expect(result.metadata).toEqual({ topic: "greeting" });
  });
});
