import { describe, it, expect, afterEach } from "vitest";
import { createElevenLabs } from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("elevenlabs v1.voices.pvc.samples.waveform", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("gets PVC sample waveform metadata", async () => {
    ctx = setupPolly("elevenlabs/pvc-voice-sample-waveform");

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    expect(provider.get.v1.voices.pvc.samples.waveform).toBe(
      provider.v1.voices.pvc.samples.waveform
    );

    await expect(
      provider.v1.voices.pvc.samples.waveform(
        "apicity-test-nonexistent-pvc-voice",
        "apicity-test-nonexistent-pvc-sample"
      )
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_uid",
    });
  });
});
