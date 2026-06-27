import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createGoogle } from "@apicity/google";
import type { GoogleRetrieveUserQuotaResponse } from "@apicity/google";

// Antigravity / Cloud Code usage (Gemini-plan rate limits):
// POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota.
// Each quota bucket carries `remainingFraction`; the usage percentage the
// Antigravity UI renders is `(1 - remainingFraction) * 100`. Rolling windows
// (e.g. the ~5h session window vs the weekly 1w window) are distinguished by
// each bucket's `resetTime` horizon and/or `tokenType`.
describe("google antigravity usage integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("google/antigravity-usage");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns quota buckets that yield usage percentages", async () => {
    const provider = createGoogle({
      apiKey: process.env.GOOGLE_API_KEY ?? "test-api-key",
      // Replay matches on URL + method; the Authorization header is redacted
      // from the recording. A real Antigravity OAuth token is only needed at
      // record time (passed via ANTIGRAVITY_OAUTH_TOKEN), so a placeholder is
      // fine for replay.
      oauthToken:
        process.env.ANTIGRAVITY_OAUTH_TOKEN ??
        process.env.GOOGLE_API_KEY ??
        "ya29-test-token",
    });

    const result: GoogleRetrieveUserQuotaResponse =
      await provider.v1internal.retrieveUserQuota();

    expect(result).toBeDefined();
    expect(Array.isArray(result.buckets)).toBe(true);
    expect(result.buckets?.length ?? 0).toBeGreaterThan(0);

    for (const bucket of result.buckets ?? []) {
      // remainingFraction is a 0..1 share; usage % is its complement.
      expect(typeof bucket.remainingFraction).toBe("number");
      expect(bucket.remainingFraction).toBeGreaterThanOrEqual(0);
      expect(bucket.remainingFraction).toBeLessThanOrEqual(1);

      const usagePercent = (1 - (bucket.remainingFraction ?? 0)) * 100;
      expect(usagePercent).toBeGreaterThanOrEqual(0);
      expect(usagePercent).toBeLessThanOrEqual(100);

      // Each bucket is scoped to a model and a rolling window (resetTime).
      expect(typeof bucket.tokenType).toBe("string");
      expect(typeof bucket.resetTime).toBe("string");
    }
  });
});
