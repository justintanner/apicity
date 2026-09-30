import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * `POST https://api.kie.ai/openai/v1/responses` with a model from the Codex
 * CLI listing (https://docs.kie.ai/ai-agent/codex-cli), REQ-008 item 4 of
 * ac-wma4p9: the listing returned neither kimi-k3 nor deepseek-v4-1-flash, so
 * no committed HAR called this path with a listed model. One minimal paid
 * turn that does not stream, pre-approved on the intake; its model is
 * gpt-5.5, the docs' example, as the listing spells it in the committed
 * kie/openai-models recording (OQ-11).
 */
describe("kie openai v1 responses (Codex listing model)", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("answers one minimal turn with a message output", async () => {
    ctx = setupPolly("kie/openai-responses-codex");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });

    const response = await provider.post.openai.v1.responses({
      model: "gpt-5.5",
      input: "Reply with the single word: pong",
      stream: false,
    });

    expect(response.output?.some((item) => item.type === "message")).toBe(true);
  });
});
