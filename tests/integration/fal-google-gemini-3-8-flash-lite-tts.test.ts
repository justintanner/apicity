import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Google Gemini 3.8 Flash Lite TTS", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-gemini-3-8-flash-lite-tts");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.google.gemini3p8FlashLiteTts({
      prompt: "A red panda waves once, then holds still.",
    });
    expect(result.audio.url).toMatch(/^https?:\/\//);
  }, 900000);
});
