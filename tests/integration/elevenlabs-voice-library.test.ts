import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.sharedVoices / v1.similarVoices", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voice-library");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("browses the shared voice library and finds similar voices", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // GET /v1/shared-voices — browse the public voice library.
    expect(provider.get.v1.sharedVoices).toBe(provider.v1.sharedVoices);
    const shared = await provider.v1.sharedVoices({ page_size: 3 });
    expect(Array.isArray(shared.voices)).toBe(true);
    expect(shared.voices.length).toBeGreaterThan(0);
    expect(typeof shared.voices[0].public_owner_id).toBe("string");
    expect(typeof shared.voices[0].voice_id).toBe("string");

    // POST /v1/similar-voices — find library voices similar to an audio sample.
    expect(provider.post.v1.similarVoices).toBe(provider.v1.similarVoices);
    const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
    const audio_file = new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });
    const similar = await provider.v1.similarVoices({ audio_file, top_k: 3 });
    expect(Array.isArray(similar.voices)).toBe(true);
  });
});
