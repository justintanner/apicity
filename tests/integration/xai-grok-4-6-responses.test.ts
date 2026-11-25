import { describe, it, expect, afterEach } from "vitest";
import type { XaiResponseRequest } from "@apicity/xai";
import { XaiResponseRequestSchema } from "../../packages/provider/xai/src/zod";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai grok 4.6 responses API", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "returns a completed response with output text",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/grok-4-6-responses");
      const provider = createXaiProvider();
      const payload = {
        model: "grok-4.6",
        input: "What is 2 + 2? Reply with just the number.",
        prompt_cache_key: "apicity-grok-4-6-fixture",
        reasoning: { effort: "xhigh" },
      } satisfies XaiResponseRequest;

      expect(XaiResponseRequestSchema.safeParse(payload).success).toBe(true);

      const result = await provider.post.v1.responses(payload);

      expect(result.status).toBe("completed");
      expect(result.output.length).toBeGreaterThan(0);
      const message = result.output.find((item) => item.type === "message");
      expect(message).toBeDefined();
      if (message?.type === "message") {
        const outputText = message.content.find(
          (content) => content.type === "output_text"
        );
        expect(outputText?.text.length).toBeGreaterThan(0);
      }
      // The recorded grok-4.6 response leads with a reasoning item: a
      // completed status and one summary part, and no encrypted_content
      // because the request did not ask for it (ac-50xnm8).
      const reasoning = result.output[0];
      expect(reasoning.type).toBe("reasoning");
      if (reasoning.type !== "reasoning") throw new Error("not reasoning");
      expect(reasoning.id).toMatch(/^rs_/);
      expect(reasoning.status).toBe("completed");
      expect(reasoning.summary).toHaveLength(1);
      expect(reasoning.summary[0].type).toBe("summary_text");
      expect(reasoning.summary[0].text.length).toBeGreaterThan(0);
      expect(reasoning.encrypted_content).toBeUndefined();
      expect(result.usage.total_tokens).toBeGreaterThan(0);
    }
  );
});
