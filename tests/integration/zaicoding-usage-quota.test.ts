import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createZaiCoding } from "@apicity/zaicoding";

describe("zaicoding usage quota integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("zaicoding/usage-quota-limit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return quota limit data", async () => {
    const provider = createZaiCoding({
      apiKey: process.env.ZAI_CODING_PLAN_API_KEY ?? "test-api-key",
    });

    const result = await provider.get.api.monitor.usage.quota.limit();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.limits).toBeDefined();
    expect(Array.isArray(result.data?.limits)).toBe(true);
    expect(result.data?.limits?.length).toBeGreaterThan(0);
  });
});
