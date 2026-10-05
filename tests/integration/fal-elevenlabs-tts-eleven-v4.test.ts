import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Elevenlabs TTS Eleven V4", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/elevenlabs-tts-eleven-v4");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.elevenlabs.tts.elevenV4({
      text: "A red panda waves once, then holds still.",
    });
    expect(result).toBeTruthy();
    expect(result.audio?.url ?? result.audio).toMatch(/^https?:\/\//);
  }, 900000);
});
