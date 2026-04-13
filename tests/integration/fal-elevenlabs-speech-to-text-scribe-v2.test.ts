import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@apicity/fal";

describe("fal elevenlabs speech-to-text scribe-v2 integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/elevenlabs-speech-to-text-scribe-v2");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should transcribe audio from a URL", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.falAi.elevenlabs.speechToText.scribeV2({
      audio_url:
        "https://storage.googleapis.com/falserverless/example_inputs/elevenlabs/scribe_v2_in.mp3",
      language_code: "eng",
      tag_audio_events: true,
      diarize: true,
    });

    expect(result).toBeDefined();
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
    expect(typeof result.language_code).toBe("string");
    expect(typeof result.language_probability).toBe("number");
    expect(Array.isArray(result.words)).toBe(true);
    expect(result.words.length).toBeGreaterThan(0);

    // Verify word structure
    const firstWord = result.words[0];
    expect(typeof firstWord.text).toBe("string");
    expect(typeof firstWord.start).toBe("number");
    expect(typeof firstWord.end).toBe("number");
    expect(typeof firstWord.speaker_id).toBe("string");
    expect(typeof firstWord.type).toBe("string");
  }, 300000);
});
