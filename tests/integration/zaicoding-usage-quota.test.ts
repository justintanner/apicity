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

  it("surfaces the rolling 5h and weekly (1w) usage percentages", async () => {
    const provider = createZaiCoding({
      apiKey: process.env.ZAI_CODING_PLAN_API_KEY ?? "test-api-key",
    });

    const result = await provider.get.api.monitor.usage.quota.limit();
    const limits = result.data?.limits ?? [];

    // The GLM Coding Plan meters tokens against two rolling windows: a 5-hour
    // window and a weekly window. Both arrive as TOKENS_LIMIT items, each
    // exposing a consumed `percentage` (0–100) the consumer reads directly.
    const tokenWindows = limits.filter((l) => l.type === "TOKENS_LIMIT");
    expect(tokenWindows.length).toBeGreaterThanOrEqual(2);

    for (const window of tokenWindows) {
      expect(typeof window.percentage).toBe("number");
      expect(window.percentage).toBeGreaterThanOrEqual(0);
      expect(window.percentage).toBeLessThanOrEqual(100);
      expect(typeof window.number).toBe("number");
    }

    // The 5h window has number=5; the weekly window has number=1. Both must
    // surface a numeric percentage so callers can report remaining quota.
    const fiveHour = tokenWindows.find((l) => l.number === 5);
    const weekly = tokenWindows.find((l) => l.number === 1);
    expect(fiveHour).toBeDefined();
    expect(weekly).toBeDefined();
    expect(typeof fiveHour?.percentage).toBe("number");
    expect(typeof weekly?.percentage).toBe("number");
  });
});
