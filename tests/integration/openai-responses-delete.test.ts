import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";
import type { OpenAiResponseDeleteResponse } from "@apicity/openai";

describe("openai responses delete integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should delete a stored response by ID", async () => {
    ctx = setupPolly("openai/responses-delete");
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored response first
    const created = await provider.post.v1.responses({
      model: "gpt-4o-mini",
      input: "Say the word 'ephemeral' and nothing else.",
      temperature: 0,
      max_output_tokens: 50,
      store: true,
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe("completed");

    // Delete it
    const deleted: OpenAiResponseDeleteResponse =
      await provider.delete.v1.responses(created.id);
    expect(deleted.id).toBe(created.id);
    expect(deleted.object).toBe("response.deleted");
    expect(deleted.deleted).toBe(true);
  });

  it("should expose delete endpoint as a plain function", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    expect(typeof provider.delete.v1.responses).toBe("function");
  });
});
