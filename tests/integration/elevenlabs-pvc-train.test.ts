import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices.pvc.train", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (!ctx) return;
    await teardownPolly(ctx);
    ctx = undefined;
  });

  it("surfaces upstream errors for a missing PVC voice", async () => {
    ctx = setupPolly("elevenlabs/pvc-train");

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    await expect(
      provider.v1.voices.pvc.train("missing-pvc-voice", {
        model_id: "eleven_turbo_v2",
      })
    ).rejects.toBeInstanceOf(ElevenLabsError);

    expect(provider.post.v1.voices.pvc.train).toBe(
      provider.v1.voices.pvc.train
    );
  });

  it("validates optional PVC train payloads", () => {
    const provider = createElevenLabs({ apiKey: "elevenlabs-test-key" });

    expect(provider.v1.voices.pvc.train.schema.safeParse({}).success).toBe(
      true
    );
    expect(
      provider.v1.voices.pvc.train.schema.safeParse({
        model_id: "eleven_turbo_v2",
      }).success
    ).toBe(true);
    expect(
      provider.v1.voices.pvc.train.schema.safeParse({ model_id: null }).success
    ).toBe(true);
    expect(
      provider.v1.voices.pvc.train.schema.safeParse({ model_id: 123 }).success
    ).toBe(false);
  });
});
