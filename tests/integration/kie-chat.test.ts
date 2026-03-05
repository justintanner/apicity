import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request", async () => {
    ctx = setupPolly("kie/chat-hello");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result = await provider.chat.chat({
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });

  it("should return credit balance", async () => {
    ctx = setupPolly("kie/credits");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const credits = await provider.getCredits();
    expect(credits.balance).toBeGreaterThanOrEqual(0);
    expect(credits.currency).toBe("credits");
  });
});
