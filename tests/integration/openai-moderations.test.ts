import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai moderations integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/moderations-hello");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should classify safe text as not flagged", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.v1.moderations({
      input: "The weather is nice today.",
      model: "omni-moderation-latest",
    });

    expect(result.id).toBeDefined();
    expect(result.model).toContain("omni-moderation");
    expect(result.results).toHaveLength(1);
    expect(result.results[0].flagged).toBe(false);
    expect(typeof result.results[0].categories.harassment).toBe("boolean");
    expect(typeof result.results[0].category_scores.harassment).toBe("number");
    expect(result.results[0].category_scores.harassment).toBeGreaterThanOrEqual(
      0
    );
    expect(result.results[0].category_scores.harassment).toBeLessThanOrEqual(1);
  });
});
