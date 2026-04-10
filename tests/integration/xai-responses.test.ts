import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai responses API", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a response", async () => {
    ctx = setupPolly("xai/responses-create");
    const provider = createXaiProvider();
    const result = await provider.post.v1.responses({
      model: "grok-4-fast",
      input: "What is 2 + 2? Reply with just the number.",
      temperature: 0,
    });
    expect(result.id).toBeTruthy();
    expect(result.object).toBe("response");
    expect(result.status).toBe("completed");
    expect(result.model).toBeTruthy();
    expect(result.output.length).toBeGreaterThan(0);
    const message = result.output.find((o) => o.type === "message");
    expect(message).toBeDefined();
    if (message && message.type === "message") {
      const text = message.content.find((c) => c.type === "output_text");
      expect(text).toBeDefined();
      if (text && text.type === "output_text") {
        expect(text.text).toContain("4");
      }
    }
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });
});
