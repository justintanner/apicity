import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai responses integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/responses-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a response with string input", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.responses({
      model: "gpt-4o-mini",
      input: "Say hello in one sentence.",
      temperature: 0,
      max_output_tokens: 100,
    });
    expect(result.id).toBeTruthy();
    expect(result.object).toBe("response");
    expect(result.status).toBe("completed");
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.output[0].type).toBe("message");
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });
});
