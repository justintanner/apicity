import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

// Codex usage (ChatGPT-plan rate limits): GET /backend-api/wham/usage.
// `rate_limit.primary_window` is the rolling 5h window and `secondary_window`
// the weekly (1w) window; `used_percent` on each is the percentage consumed.
describe("openai codex usage integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/codex-usage");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return 5h + 1w usage percentages", async () => {
    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "test-api-key",
      chatgptAccountId: "test-account-id",
    });

    const result = await provider.get.codex.usage();

    expect(result).toBeDefined();
    expect(result.rate_limit).toBeDefined();

    // 5h (primary) window percentage.
    const primary = result.rate_limit?.primary_window;
    expect(primary).toBeDefined();
    expect(typeof primary?.used_percent).toBe("number");
    expect(primary?.used_percent).toBeGreaterThanOrEqual(0);
    expect(primary?.used_percent).toBeLessThanOrEqual(100);

    // 1w (secondary) window percentage.
    const secondary = result.rate_limit?.secondary_window;
    expect(secondary).toBeDefined();
    expect(typeof secondary?.used_percent).toBe("number");
    expect(secondary?.used_percent).toBeGreaterThanOrEqual(0);
    expect(secondary?.used_percent).toBeLessThanOrEqual(100);
  });
});
