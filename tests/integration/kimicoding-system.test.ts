import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kimicoding } from "@nakedapi/kimicoding";

describe("kimicoding system prompt", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should use system prompt to constrain response format", async () => {
    ctx = setupPolly("kimicoding/system-prompt");
    const provider = kimicoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
    });
    const result = await provider.coding.v1.messages({
      model: "k2p5",
      max_tokens: 256,
      system:
        "You are a calculator. Reply with ONLY the numeric result, no words.",
      messages: [{ role: "user", content: "What is 2 + 2?" }],
      temperature: 0,
    });
    expect(result.content).toBeTruthy();
    expect(result.model).toBeTruthy();
    expect(result.stop_reason).toBeTruthy();
    // The system prompt constrains output to just a number
    const text =
      typeof result.content === "string"
        ? result.content
        : result.content
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("");
    expect(text).toContain("4");
  });
});
