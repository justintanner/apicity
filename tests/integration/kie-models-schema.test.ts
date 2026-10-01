import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, KieError } from "@apicity/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Keeps live calls under the shared one-per-second budget (REQ-007 item 3).
async function paceLiveCall(ctx: PollyContext): Promise<void> {
  if (ctx.mode !== "replay") await sleep(1100);
}

const MODEL = "kling/v2-1-master-text-to-video";

/**
 * `GET https://api.kie.ai/api/v1/models/{model}/schema`, the model's OpenAPI
 * document (https://docs.kie.ai/ai-agent/install-kie-models). Both
 * recordings are free and use MODEL, a two-segment id from the committed
 * kie/models-catalog recording (OQ-12), so the HAR pins the literal slash
 * the kie-models skill requires.
 * The four `/api/v1/models` endpoints share one budget of one request per
 * second per account, so every live call waits 1.1 s first; replay never
 * waits. The invalid-key case comes first, so `dev:record` records it first.
 */
describe("kie get.api.v1.models.modelSchema", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/models-schema-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-models-schema",
    });
    await paceLiveCall(ctx);

    await expect(
      provider.get.api.v1.models.modelSchema(MODEL)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("returns the model's OpenAPI document", async () => {
    ctx = setupPolly("kie/models-schema");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    await paceLiveCall(ctx);

    const res = await provider.get.api.v1.models.modelSchema(MODEL);

    expect(res.code).toBe(200);
    expect(res.data.model).toBe(MODEL);
    const doc = res.data.openapi;
    // `null` means KIE has not synced this model's document yet.
    if (doc !== null) {
      expect(doc.openapi.startsWith("3.")).toBe(true);
      expect(Object.keys(doc.paths).length).toBeGreaterThan(0);
    }
  });
});
