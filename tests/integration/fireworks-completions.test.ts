import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@apicity/fireworks";

describe("fireworks completions integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/completions-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a text completion", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });
    const result = await provider.inference.v1.completions({
      model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
      prompt: "The capital of France is",
      max_tokens: 32,
      temperature: 0,
    });
    expect(result.choices[0].text).toBeTruthy();
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });
});
