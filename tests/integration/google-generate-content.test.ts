import { describe, it, expect, afterEach } from "vitest";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createGoogle } from "@apicity/google";

const RECORDING_NAME = "google/generate-content";

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

describe("google generateContent", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate text content", async () => {
    ctx = setupPolly(RECORDING_NAME);
    const google = createGoogle({
      apiKey: apiKeyForMode(ctx),
      timeout: 90000,
    });

    const result = await google.v1.publishers.google.models.generateContent(
      "gemini-2.5-flash",
      {
        contents: [
          {
            role: "user",
            parts: [{ text: "Say hello in one short sentence." }],
          },
        ],
        generationConfig: {
          temperature: 0,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 32,
        },
      }
    );

    const text = result.candidates?.[0]?.content?.parts?.find(
      (part) => typeof part.text === "string"
    )?.text;
    expect(text).toBeTruthy();
    expect(result.usageMetadata?.totalTokenCount).toBeGreaterThan(0);
  }, 90000);
});
