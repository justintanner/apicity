import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

/**
 * `GET https://api.kie.ai/xai/v1/models`, the listing of the models Grok
 * Build can run on through KIE (https://docs.kie.ai/ai-agent/grok-build).
 * Both recordings are free: the invalid-key case is rejected at KIE's auth,
 * and a listing calls no model. The invalid-key case comes first so
 * `dev:record` records it first.
 */
describe("kie xai v1 models", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/xai-models-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-xai-models",
    });

    await expect(provider.get.xai.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("lists the models Grok Build can run on", async () => {
    ctx = setupPolly("kie/xai-models");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });

    const listing = await provider.get.xai.v1.models();

    expect(listing.data.length).toBeGreaterThan(0);
    for (const model of listing.data) {
      expect(typeof model.id).toBe("string");
      expect(model.id.length).toBeGreaterThan(0);
    }
  });
});
