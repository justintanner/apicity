import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

const recordingName = "openai/completions-hello";

describe("openai completions integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should create a text completion", async () => {
    ctx = setupPolly(recordingName);

    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.completions({
      model: "gpt-3.5-turbo-instruct",
      prompt: "Say this is a test",
      max_tokens: 7,
      temperature: 0,
    });

    expect(result.id).toBeTruthy();
    expect(result.object).toBe("text_completion");
    expect(result.choices.length).toBeGreaterThan(0);
    expect(result.choices[0].text).toBeTruthy();
    expect(result.usage?.total_tokens).toBeGreaterThan(0);
  });

  it("exposes a Zod schema with completion parameter bounds", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    const endpoint = provider.post.v1.completions;

    expect(endpoint.schema.safeParse).toBeDefined();

    const valid = endpoint.schema.safeParse({
      model: "gpt-3.5-turbo-instruct",
      prompt: "Say hello.",
      logprobs: 5,
      max_tokens: 0,
      n: 1,
      stop: ["\n"],
      stream_options: { include_usage: true },
      temperature: 0,
      top_p: 1,
    });
    expect(valid.success).toBe(true);

    const tooManyLogprobs = endpoint.schema.safeParse({
      model: "gpt-3.5-turbo-instruct",
      prompt: "Say hello.",
      logprobs: 6,
    });
    expect(tooManyLogprobs.success).toBe(false);

    const tooManyStopSequences = endpoint.schema.safeParse({
      model: "gpt-3.5-turbo-instruct",
      prompt: "Say hello.",
      stop: ["a", "b", "c", "d", "e"],
    });
    expect(tooManyStopSequences.success).toBe(false);
  });
});
