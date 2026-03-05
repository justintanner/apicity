import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding } from "@bareapi/kimicoding";

describe("kimicoding integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a chat request with k2p5", async () => {
    ctx = setupPolly("kimicoding/chat-hi");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.chat({
      model: "k2p5",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.model).toBeTruthy();
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.finishReason).toBe("stop");
  });

  it("should stream a chat response with k2p5", async () => {
    ctx = setupPolly("kimicoding/stream-hi");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const chunks: string[] = [];
    let gotDone = false;
    for await (const chunk of provider.streamChat({
      model: "k2p5",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0,
    })) {
      if (chunk.delta) chunks.push(chunk.delta);
      if (chunk.done) gotDone = true;
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join("")).toBeTruthy();
    expect(gotDone).toBe(true);
  });
});
