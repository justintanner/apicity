import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai responses compact API", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should compact a responses input window", async () => {
    ctx = setupPolly("xai/responses-compact");
    const provider = createXaiProvider();
    const result = await provider.post.v1.responses.compact({
      model: "grok-4-fast",
      input: [
        { role: "system", content: "You are a concise science tutor." },
        { role: "user", content: "What is the Higgs boson?" },
        {
          role: "assistant",
          content:
            "The Higgs boson is an elementary particle that gives mass to" +
            " other particles via the Higgs field.",
        },
        { role: "user", content: "How does the Higgs mechanism work?" },
        {
          role: "assistant",
          content:
            "Through spontaneous symmetry breaking: the Higgs field has a" +
            " nonzero vacuum value and particles acquire mass by coupling to it.",
        },
      ],
    });
    expect(result.id).toBeTruthy();
    expect(result.object).toBe("response.compaction");
    expect(result.model).toBeTruthy();
    expect(result.created_at).toBeGreaterThan(0);
    expect(Array.isArray(result.output)).toBe(true);
    expect(result.output.length).toBeGreaterThan(0);
    if (result.usage) {
      expect(result.usage.total_tokens).toBeGreaterThan(0);
      expect(result.usage.dropped_message_count).toBeGreaterThanOrEqual(0);
    }
  });
});
