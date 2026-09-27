import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

/**
 * Live Polly recording for GPT-6 Astra on the codex Responses endpoint
 * (`POST /codex/v1/responses`): one text-only, low-effort request.
 */
describe("kie gpt-6-astra responses live", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a completed response with a message output", async () => {
    ctx = setupPolly("kie/gpt-6-astra-responses");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const response = await provider.post.codex.v1.responses({
      model: "gpt-6-astra",
      input: "ping",
      stream: false,
      reasoning: { effort: "low" },
    });

    expect(response.status).toBe("completed");
    expect(response.output?.length).toBeGreaterThan(0);
    expect(response.output?.some((item) => item.type === "message")).toBe(true);
  });
});
