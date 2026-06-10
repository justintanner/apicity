import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsUpdatePvcVoiceSampleRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.voices.pvc.samples", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice-pvc-sample-update");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("routes update requests for PVC voice samples", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
    const req: ElevenLabsUpdatePvcVoiceSampleRequest = {
      remove_background_noise: false,
      selected_speaker_ids: null,
      trim_start_time: null,
      trim_end_time: null,
      file_name: "apicity-sample.wav",
    };

    expect(provider.post.v1.voices.pvc.samples).toBe(
      provider.v1.voices.pvc.samples
    );
    expect(provider.v1.voices.pvc.samples.schema.safeParse(req).success).toBe(
      true
    );
    expect(provider.v1.voices.pvc.samples.separateSpeakers).toBe(
      provider.post.v1.voices.pvc.samples.separateSpeakers
    );

    try {
      await provider.v1.voices.pvc.samples(
        "invalid_voice_id",
        "invalid_sample_id",
        req
      );
      throw new Error("Expected invalid PVC sample IDs to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect((error as ElevenLabsError).status).toBe(404);
      expect((error as ElevenLabsError).code).toBe("voice_not_found");
    }
  });
});
