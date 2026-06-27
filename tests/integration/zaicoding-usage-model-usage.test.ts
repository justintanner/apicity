import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createZaiCoding } from "@apicity/zaicoding";

describe("zaicoding usage model-usage integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("zaicoding/usage-model-usage");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return model usage data without throwing", async () => {
    const provider = createZaiCoding({
      apiKey: process.env.ZAI_CODING_PLAN_API_KEY ?? "test-api-key",
    });

    const result = await provider.get.api.monitor.usage.modelUsage();

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});
