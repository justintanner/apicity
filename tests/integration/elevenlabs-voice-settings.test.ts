import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices.settings", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice-settings");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets settings for a single voice", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const settings = await provider.v1.voices.settings("hpp4J3VqNfWAUOO0d1Us");

    expect(settings.stability).toBeGreaterThanOrEqual(0);
    expect(settings.similarity_boost).toBeGreaterThanOrEqual(0);
    expect(typeof settings.use_speaker_boost).toBe("boolean");
    expect(typeof settings.speed).toBe("number");
    expect(provider.get.v1.voices.settings).toBe(provider.v1.voices.settings);
  });
});
