import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createGoogle,
  GoogleError,
  type GoogleRetrieveUserQuotaSummaryResponse,
} from "@apicity/google";

// Antigravity / Cloud Code subscription quota summary:
// POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary.
// The endpoint is entitlement-gated. A generic Gemini OAuth token may receive
// 403 PERMISSION_DENIED, while an Antigravity-entitled token returns groups.
describe("google antigravity quota summary integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("google/antigravity-quota-summary");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns quota groups or an entitlement denial", async () => {
    const provider = createGoogle({
      apiKey: process.env.GOOGLE_API_KEY ?? "test-api-key",
      oauthToken:
        process.env.ANTIGRAVITY_OAUTH_TOKEN ??
        process.env.GOOGLE_API_KEY ??
        "ya29-test-token",
    });

    let result: GoogleRetrieveUserQuotaSummaryResponse | undefined;
    try {
      result = await provider.v1internal.retrieveUserQuotaSummary();
    } catch (error) {
      if (error instanceof GoogleError && error.status === 403) {
        expect(error.code).toBe("PERMISSION_DENIED");
        return;
      }
      throw error;
    }

    expect(result).toBeDefined();
    if (result?.groups !== undefined) {
      expect(Array.isArray(result.groups)).toBe(true);
    }
  });
});
