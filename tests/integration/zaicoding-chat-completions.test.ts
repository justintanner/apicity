import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createZaiCoding } from "@apicity/zaicoding";

describe("zaicoding chat completions integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("zaicoding/chat-completions");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    const provider = createZaiCoding({
      apiKey: process.env.ZAI_CODING_PLAN_API_KEY ?? "test-api-key",
    });

    const result = await provider.post.api.coding.paas.v4.chat.completions({
      model: "glm-4-flash",
      messages: [{ role: "user", content: "Say hello." }],
    });

    expect(result.choices).toBeDefined();
    expect(result.choices.length).toBeGreaterThan(0);
    expect(result.choices[0].message.content).toBeTruthy();
  });
});
