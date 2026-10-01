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
 * `GET https://api.kie.ai/api/v1/models/{model}/success-rate`, the model's
 * success rate over the last 24 hours
 * (https://docs.kie.ai/ai-agent/install-kie-models). Both recordings are
 * free and use MODEL, a two-segment id from the committed
 * kie/models-catalog recording (OQ-12).
 * The four `/api/v1/models` endpoints share one budget of one request per
 * second per account, so every live call waits 1.1 s first; replay never
 * waits. The invalid-key case comes first, so `dev:record` records it first.
 */
describe("kie get.api.v1.models.successRate", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/models-success-rate-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-models-success-rate",
    });
    await paceLiveCall(ctx);

    await expect(
      provider.get.api.v1.models.successRate(MODEL)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("returns up to 144 ten-minute points", async () => {
    ctx = setupPolly("kie/models-success-rate");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    await paceLiveCall(ctx);

    const res = await provider.get.api.v1.models.successRate(MODEL);

    expect(res.code).toBe(200);
    expect(res.data.model).toBe(MODEL);
    expect(res.data.points.length).toBeLessThanOrEqual(144);
    for (const point of res.data.points) {
      expect(typeof point.start).toBe("string");
      expect(typeof point.end).toBe("string");
      for (const rate of [point.successRate, point.errorRate]) {
        expect(rate === null || typeof rate === "number").toBe(true);
      }
      expect(typeof point.isNormal).toBe("boolean");
    }
  });
});
