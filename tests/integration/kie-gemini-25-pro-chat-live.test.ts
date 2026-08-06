import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * Live Polly recording for Gemini 2.5 Pro OpenAI chat completions.
 * Prefer free auth-error path (invalid key) so recording does not spend credits.
 */
describe("kie gemini 2.5 pro chat live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-25-pro-chat-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-25-pro",
    });

    await expect(
      provider.gemini25Pro.post.v1.chat.completions({
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "ping" }],
          },
        ],
        stream: false,
        include_thoughts: false,
        reasoning_effort: "low",
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });
});
