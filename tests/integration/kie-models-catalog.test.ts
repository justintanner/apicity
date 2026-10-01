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

/**
 * `GET https://api.kie.ai/api/v1/models`, the catalog the kie-models skill
 * reads before it names any model
 * (https://docs.kie.ai/ai-agent/install-kie-models). All three recordings
 * are free.
 * The four `/api/v1/models` endpoints share one budget of one request per
 * second per account, so every live call waits 1.1 s first; replay never
 * waits. The invalid-key case comes first, so `dev:record` records it first.
 */
describe("kie get.api.v1.models (catalog)", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an invalid API key with KieError", async () => {
    ctx = setupPolly("kie/models-catalog-auth-error");
    const provider = createKie({
      // Intentionally invalid: free 401 path for the HAR fixture.
      apiKey: "sk-invalid-kie-models-catalog",
    });
    await paceLiveCall(ctx);

    await expect(provider.get.api.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("lists the whole catalog", async () => {
    ctx = setupPolly("kie/models-catalog");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    await paceLiveCall(ctx);

    const res = await provider.get.api.v1.models();

    expect(res.code).toBe(200);
    expect(res.data.total).toBe(res.data.models.length);
    expect(res.data.total).toBeGreaterThan(0);
    for (const entry of res.data.models) {
      expect(typeof entry.model).toBe("string");
      expect(entry.model.length).toBeGreaterThan(0);
      expect(entry.slug).toBe(entry.model);
      expect(typeof entry.title).toBe("string");
      expect(typeof entry.provider).toBe("string");
      expect(Array.isArray(entry.taskType)).toBe(true);
      expect(entry.taskType.length).toBeGreaterThan(0);
      for (const nullable of [entry.description, entry.pricingDesc]) {
        expect(nullable === null || typeof nullable === "string").toBe(true);
      }
    }
  });

  it("narrows the catalog with combined filters", async () => {
    ctx = setupPolly("kie/models-catalog-filtered");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    await paceLiveCall(ctx);
    const taskTypes = ["Text to Video", "Image to Video"];

    const res = await provider.get.api.v1.models({
      taskType: taskTypes,
      provider: "Kling",
    });

    expect(res.code).toBe(200);
    expect(res.data.total).toBe(res.data.models.length);
    expect(res.data.total).toBeGreaterThan(0);
    for (const entry of res.data.models) {
      expect(entry.provider).toBe("Kling");
      expect(entry.taskType.some((type) => taskTypes.includes(type))).toBe(
        true
      );
    }
  });
});
