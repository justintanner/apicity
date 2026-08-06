import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * Live Polly recording for unified GPT Codex Responses (`POST /api/v1/responses`).
 * Prefer free auth-error path (invalid key) so recording does not spend credits.
 */
describe("kie api v1 responses live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects invalid API key with KieError", async () => {
    ctx = setupPolly("kie/api-responses-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-api-responses",
    });

    await expect(
      provider.post.api.v1.responses({
        model: "gpt-5.1-codex",
        input: "ping",
        stream: false,
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });
});
