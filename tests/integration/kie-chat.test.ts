import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skip("should complete a chat request", async () => {
    ctx = setupPolly("kie/chat-hello");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result = await provider.chat.completions({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
    });
    expect(result.choices?.[0].message?.content).toBeTruthy();
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });

  it("should return credit balance", async () => {
    ctx = setupPolly("kie/credits");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const credits = await provider.get.api.v1.chat.credit();
    expect(credits.data).toBeGreaterThanOrEqual(0);
  });
});
