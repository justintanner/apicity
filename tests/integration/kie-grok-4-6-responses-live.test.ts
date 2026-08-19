import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * Live Polly recording for Grok 4.6 Responses (`POST /grok/v1/responses`).
 */
describe("kie grok 4.6 responses live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a completed response with output", async () => {
    ctx = setupPolly("kie/grok-4-6-responses");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const response = await provider.post.grok.v1.responses({
      model: "grok-4-6",
      input: "ping",
      stream: false,
    });

    expect(response.status).toBe("completed");
    expect(response.output?.length).toBeGreaterThan(0);
  });
});
