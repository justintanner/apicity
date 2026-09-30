import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * `POST https://api.kie.ai/xai/v1/responses`, the Responses endpoint Grok
 * Build uses through KIE (https://docs.kie.ai/ai-agent/grok-build). The
 * invalid-key case is free and comes first. The success case is one minimal
 * paid turn that does not stream, pre-approved on intake ac-wma4p9; its
 * model is grok-4-6, the docs' example id, which the listing returned in
 * the committed kie/xai-models recording (OQ-11). Both cases send the same
 * body.
 */
const REQUEST = {
  model: "grok-4-6",
  input: "Reply with the single word: pong",
  stream: false,
} as const;

describe("kie xai v1 responses", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/xai-responses-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-xai-responses",
    });

    await expect(provider.post.xai.v1.responses(REQUEST)).rejects.toMatchObject(
      {
        name: "KieError",
        status: 401,
      } satisfies Partial<KieError>
    );
  });

  it("answers one minimal turn with a message output", async () => {
    ctx = setupPolly("kie/xai-responses");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });

    const response = await provider.post.xai.v1.responses(REQUEST);

    expect(response.output?.some((item) => item.type === "message")).toBe(true);
  });
});
