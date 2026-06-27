import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type { AnthropicOauthUsageResponse } from "@apicity/anthropic";

describe("anthropic api.oauth.usage integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns rolling 5-hour and weekly usage percentages", async () => {
    ctx = setupPolly("anthropic/oauth-usage");
    const provider = createAnthropic({
      // Replay matches on URL + method; the Authorization header is redacted
      // from the recording. A real OAuth token is only needed at record time
      // (passed via ANTHROPIC_OAUTH_TOKEN), so a placeholder is fine here.
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      oauthToken:
        process.env.ANTHROPIC_OAUTH_TOKEN ??
        process.env.ANTHROPIC_API_KEY ??
        "sk-ant-oat-test",
    });

    const result: AnthropicOauthUsageResponse =
      await provider.api.oauth.usage();

    // 5-hour rolling window
    expect(result.five_hour).toBeDefined();
    expect(typeof result.five_hour.utilization).toBe("number");
    expect(result.five_hour.utilization).toBeGreaterThanOrEqual(0);
    expect(result.five_hour.utilization).toBeLessThanOrEqual(100);

    // Weekly (1w) rolling window
    expect(result.seven_day).toBeDefined();
    expect(typeof result.seven_day.utilization).toBe("number");
    expect(result.seven_day.utilization).toBeGreaterThanOrEqual(0);
    expect(result.seven_day.utilization).toBeLessThanOrEqual(100);

    // Normalized per-limit bars include the session (5h) and weekly windows.
    expect(Array.isArray(result.limits)).toBe(true);
    expect(result.limits.length).toBeGreaterThan(0);
    for (const limit of result.limits) {
      expect(typeof limit.percent).toBe("number");
      expect(typeof limit.kind).toBe("string");
    }
    expect(result.limits.some((l) => l.group === "session")).toBe(true);
    expect(result.limits.some((l) => l.group === "weekly")).toBe(true);
  });
});
