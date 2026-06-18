import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { createElevenLabs } from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.voices.pvc.captcha", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("surfaces upstream errors when the voice is not PVC", async () => {
    ctx = setupPolly("elevenlabs/pvc-voice-captcha");

    const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
    const recording = new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.post.v1.voices.pvc.captcha).toBe(
      provider.v1.voices.pvc.captcha
    );
    expect(
      provider.v1.voices.pvc.captcha.schema.safeParse({ recording }).success
    ).toBe(true);

    // The Apicity ElevenLabs account has PVC capability, but no owned PVC
    // voice currently awaiting captcha verification. A true 200 fixture needs
    // that account state before it can replace this recorded blocker.
    await expect(
      provider.v1.voices.pvc.captcha("hpp4J3VqNfWAUOO0d1Us", { recording })
    ).rejects.toMatchObject({
      status: 400,
      code: "voice_not_professional",
    });
  });

  it("gets PVC captcha challenge metadata", async () => {
    ctx = setupPolly("elevenlabs/pvc-voice-captcha-get");

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.voices.pvc.captcha.get).toBe(
      provider.v1.voices.pvc.captcha.get
    );

    await expect(
      provider.v1.voices.pvc.captcha.get("apicity-test-nonexistent-pvc-voice")
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_uid",
    });
  });
});
