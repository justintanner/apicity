import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * Live Polly recording for Gemini 3 Pro OpenAI chat completions.
 * Prefer free auth-error path (invalid key) so recording does not spend credits.
 */
describe("kie gemini 3 pro chat live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-3-pro-chat-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-3-pro",
    });

    await expect(
      provider.gemini3Pro.post.v1.chat.completions({
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "ping" }],
          },
        ],
        stream: false,
        include_thoughts: false,
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });
});
