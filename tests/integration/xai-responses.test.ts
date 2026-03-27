import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai responses API", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a response", async () => {
    ctx = setupPolly("xai/responses-create");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
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

  it("should retrieve a stored response", async () => {
    ctx = setupPolly("xai/responses-get");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses.get("resp_stored_001");
    expect(result.id).toBe("resp_stored_001");
    expect(result.object).toBe("response");
    expect(result.status).toBe("completed");
    expect(result.output.length).toBeGreaterThan(0);
  });
});
