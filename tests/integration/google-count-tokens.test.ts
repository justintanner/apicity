import { describe, it, expect, afterEach } from "vitest";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogle } from "@apicity/google";

const RECORDING_NAME = "google/count-tokens";

function shouldUseLiveKey(ctx: PollyContext): boolean {
  if (ctx.mode === "record" || ctx.mode === "passthrough") return true;
  if (ctx.mode === "record-missing") return !recordingExists(RECORDING_NAME);
  return false;
}

function apiKeyForMode(ctx: PollyContext): string {
  if (!shouldUseLiveKey(ctx)) return "test-key";
  const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_API_KEY is required to record Google HARs");
  }
  return key;
}

describe("google countTokens", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should count prompt tokens", async () => {
    ctx = setupPolly(RECORDING_NAME);
    const google = createGoogle({
      apiKey: apiKeyForMode(ctx),
      timeout: 90000,
    });

    const result = await google.v1.publishers.google.models.countTokens(
      "gemini-2.5-flash",
      {
        contents: [
          {
            role: "user",
            parts: [{ text: "Count the tokens in this short prompt." }],
          },
        ],
      }
    );

    expect(result.totalTokens).toBeGreaterThan(0);
  }, 90000);
});
