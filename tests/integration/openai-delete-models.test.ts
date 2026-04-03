import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai delete models integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/models-delete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skip("should delete a fine-tuned model", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.delete.v1.models({
      model: process.env.OPENAI_FINE_TUNED_MODEL ?? "ft:gpt-4o:test",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.deleted).toBe(true);
  });
});
