import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsPvcVoiceCaptchaResponse,
} from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.voices.pvc.captcha", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/pvc-voice-captcha");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a recording for PVC captcha verification", async () => {
    const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
    const recording = new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const outcome = await provider.v1.voices.pvc
      .captcha("hpp4J3VqNfWAUOO0d1Us", { recording })
      .then(
        (response) => ({ ok: true as const, response }),
        (error: unknown) => ({ ok: false as const, error })
      );

    expect(provider.post.v1.voices.pvc.captcha).toBe(
      provider.v1.voices.pvc.captcha
    );
    expect(
      provider.v1.voices.pvc.captcha.schema.safeParse({ recording }).success
    ).toBe(true);

    if (!outcome.ok) {
      expect(outcome.error).toBeInstanceOf(ElevenLabsError);
      expect((outcome.error as ElevenLabsError).status).toBe(400);
      expect((outcome.error as ElevenLabsError).code).toBe(
        "voice_not_professional"
      );
      return;
    }

    const response: ElevenLabsPvcVoiceCaptchaResponse = outcome.response;
    expect(response.status).toBe("ok");
  });
});
