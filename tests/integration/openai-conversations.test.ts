import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

const RETRIEVE_RECORDING_NAME = "openai/conversations-retrieve";

describe("openai conversations integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should create a durable conversation with a seed message", async () => {
    ctx = setupPolly("openai/conversations-create");
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

  it("exposes the retrieve endpoint", () => {
    const provider = createOpenAi({
      apiKey: "sk-test-key",
    });

    expect(typeof provider.get.v1.conversations.retrieve).toBe("function");
  });

  it("should retrieve a durable conversation", async () => {
    ctx = setupPolly(RETRIEVE_RECORDING_NAME);
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const created = await provider.post.v1.conversations({
      items: [
        {
          role: "user",
          content: "Store this conversation for retrieval.",
        },
      ],
      metadata: { topic: "retrieve" },
    });

    const retrieved = await provider.get.v1.conversations.retrieve(created.id);

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.object).toBe("conversation");
    expect(typeof retrieved.created_at).toBe("number");
    expect(retrieved.metadata).toEqual({ topic: "retrieve" });
  });
});
