import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsCreatePvcVoiceRequest,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.voices.pvc", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/pvc-voice-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("routes PVC voice creation requests", async () => {
    const provider = createElevenLabs({
      apiKey: "elevenlabs-test-key",
    });
    const req: ElevenLabsCreatePvcVoiceRequest = {
      name: "Apicity PVC route test",
      language: "en",
      description: null,
      labels: {
        language: "en",
        accent: "en-US",
      },
    };

    expect(provider.post.v1.voices.pvc).toBe(provider.v1.voices.pvc);
    expect(provider.v1.voices.pvc.schema.safeParse(req).success).toBe(true);

    await expect(provider.v1.voices.pvc(req)).rejects.toMatchObject({
      status: 401,
      code: "invalid_api_key",
    });
  });
});
