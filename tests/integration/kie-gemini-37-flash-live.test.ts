import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * Live Polly recording for Gemini 3.7 Flash streamGenerateContent.
 * Prefer free auth-error path (invalid key) so recording does not spend credits.
 */
describe("kie gemini 3.7 flash live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects invalid API key with KieError", async () => {
    ctx = setupPolly("kie/gemini-37-flash-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-gemini-37-flash",
    });

    await expect(
      provider.gemini.post.v1.models.gemini37Flash.streamGenerateContent({
        stream: false,
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });
});
