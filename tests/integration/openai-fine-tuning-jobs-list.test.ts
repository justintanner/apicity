import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";
import type { OpenAiFineTuningJobListResponse } from "@apicity/openai";

describe("openai fine-tuning jobs list integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/fine-tuning-jobs-list");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list fine-tuning jobs", async () => {
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = (await provider.get.v1.fineTuning.jobs({
      limit: 5,
    })) as OpenAiFineTuningJobListResponse;

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.has_more).toBe("boolean");
  });
});
