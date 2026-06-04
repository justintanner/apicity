import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

describe("openai responses inputItems integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list input items for a stored response", async () => {
    ctx = setupPolly("openai/responses-input-items");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const created = await provider.post.v1.responses({
      model: "gpt-4o-mini",
      input: "Say the word 'banana' and nothing else.",
      temperature: 0,
      max_output_tokens: 50,
      store: true,
    });
    expect(created.id).toBeTruthy();

    const items = await provider.get.v1.responses.inputItems(created.id);
    expect(items.object).toBe("list");
    expect(Array.isArray(items.data)).toBe(true);
    expect(items.data.length).toBeGreaterThan(0);
  });
});
