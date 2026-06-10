import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices.pvc.samples.separateSpeakers", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice-pvc-sample-separate-speakers");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("routes speaker separation requests for PVC voice samples", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.post.v1.voices.pvc.samples.separateSpeakers).toBe(
      provider.v1.voices.pvc.samples.separateSpeakers
    );

    try {
      await provider.v1.voices.pvc.samples.separateSpeakers(
        "invalid_voice_id",
        "invalid_sample_id"
      );
      throw new Error("Expected invalid PVC sample IDs to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect((error as ElevenLabsError).status).toBe(404);
      expect((error as ElevenLabsError).code).toBe("voice_not_found");
    }
  });
});
