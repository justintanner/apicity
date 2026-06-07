import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";

describe("fal bytedance seed speech tts v2 integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seed-speech-tts-v2");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should synthesize speech from text", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.bytedance.seedSpeech.tts.v2({
      text: "Hello from Apicity.",
      voice: "stokie_en",
      output_format: "mp3",
      sample_rate: 24000,
      speed: 1,
      volume: 1,
      pitch: 0,
      language: "en",
      voice_instruction: "Speak in a warm, cheerful tone.",
    });

    expect(result).toBeDefined();
    expect(result.audio).toBeDefined();
    expect(typeof result.audio.url).toBe("string");
    expect(result.audio.url.startsWith("http")).toBe(true);
  }, 300000);
});
