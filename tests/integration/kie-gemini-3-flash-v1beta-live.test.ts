import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * Live Polly recording for Gemini 3 Flash v1beta streamGenerateContent.
 * Prefer free auth-error path (invalid key) so recording does not spend credits.
 */
describe("kie gemini 3 flash v1beta live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-3-flash-v1beta-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-3-flash-v1beta",
    });

    await expect(
      provider.gemini.post.v1.models.gemini3FlashV1betamodels.streamGenerateContent(
        {
          stream: false,
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
        }
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });
});
