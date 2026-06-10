import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsUpdatePvcVoiceRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.voices.pvc", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice-pvc-update");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("routes update requests for PVC voice metadata", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
    const req: ElevenLabsUpdatePvcVoiceRequest = {
      name: "Apicity PVC Voice",
      language: "en",
      description: null,
      labels: {
        accent: "neutral",
      },
    };

    expect(provider.post.v1.voices.pvc).toBe(provider.v1.voices.pvc);
    expect(provider.v1.voices.pvc.schema.safeParse(req).success).toBe(true);
    expect(provider.v1.voices.pvc.captcha).toBe(
      provider.post.v1.voices.pvc.captcha
    );

    try {
      await provider.v1.voices.pvc("invalid_voice_id", req);
      throw new Error("Expected invalid PVC voice ID to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect((error as ElevenLabsError).status).toBe(404);
      expect((error as ElevenLabsError).code).toBe("voice_not_found");
    }
  });
});
