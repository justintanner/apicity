import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices.pvc.samples.speakers.audio", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice-pvc-sample-speaker-audio");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("routes separated speaker audio requests for PVC voice samples", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.voices.pvc.samples.speakers.audio).toBe(
      provider.v1.voices.pvc.samples.speakers.audio
    );

    try {
      await provider.v1.voices.pvc.samples.speakers.audio(
        "invalid_voice_id",
        "invalid_sample_id",
        "invalid_speaker_id"
      );
      throw new Error("Expected invalid PVC speaker IDs to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect((error as ElevenLabsError).status).toBe(404);
      expect((error as ElevenLabsError).code).toBe("voice_not_found");
    }
  });
});
