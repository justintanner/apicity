import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { elevenlabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.soundGeneration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/sound-generation");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("generates a short sound effect and returns binary audio", async () => {
    const provider = elevenlabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const audio = await provider.v1.soundGeneration({
      text: "soft ui click",
      duration_seconds: 0.5,
      prompt_influence: 0.3,
    });

    expect(audio).toBeInstanceOf(ArrayBuffer);
    expect(audio.byteLength).toBeGreaterThan(0);
  });
});
