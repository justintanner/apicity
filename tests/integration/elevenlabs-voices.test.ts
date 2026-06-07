import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v2.voices", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voices");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists voices with pagination metadata", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const response = await provider.v2.voices({
      page_size: 1,
      voice_type: "default",
      include_total_count: true,
    });

    expect(Array.isArray(response.voices)).toBe(true);
    expect(typeof response.has_more).toBe("boolean");
    expect(typeof response.total_count).toBe("number");
    expect(response.total_count).toBeGreaterThanOrEqual(0);
    expect(provider.get.v2.voices).toBe(provider.v2.voices);

    const voice = response.voices[0];
    if (voice) {
      expect(typeof voice.voice_id).toBe("string");
      expect(voice.voice_id.length).toBeGreaterThan(0);
    }
  });
});
