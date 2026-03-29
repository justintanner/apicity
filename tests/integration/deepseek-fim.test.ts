import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { deepseek } from "@nakedapi/deepseek";

describe("deepseek FIM completions", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("deepseek/fim-completion");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete a fill-in-the-middle request", async () => {
    const provider = deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "sk-test-key",
    });
    const result = await provider.beta.completions({
      model: "deepseek-chat",
      prompt: "function hello() {\n  console.log(",
      suffix: ");\n}",
      max_tokens: 50,
      temperature: 0,
    });
    expect(result.choices[0].text).toBeTruthy();
    expect(result.object).toBe("text_completion");
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });
});
