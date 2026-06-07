import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets metadata for a single voice", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const voice = await provider.v1.voices("hpp4J3VqNfWAUOO0d1Us", {
      with_settings: false,
    });

    expect(typeof voice.voice_id).toBe("string");
    expect(voice.voice_id).toBe("hpp4J3VqNfWAUOO0d1Us");
    expect(typeof voice.name).toBe("string");
    expect(voice.name?.length).toBeGreaterThan(0);
    expect(provider.get.v1.voices).toBe(provider.v1.voices);
  });
});
