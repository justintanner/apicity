import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { elevenlabs } from "@apicity/elevenlabs";
import type { ElevenLabsTranscript } from "@apicity/elevenlabs";

describe("elevenlabs v1.speechToText", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/speech-to-text");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("transcribes an mp3 file with scribe_v2 and returns words", async () => {
    const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
    const file = new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });

    const provider = elevenlabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const result = (await provider.v1.speechToText({
      file,
      model_id: "scribe_v2",
      language_code: "eng",
      tag_audio_events: true,
    })) as ElevenLabsTranscript;

    expect(typeof result.text).toBe("string");
    expect(result.language_code).toBe("eng");
    expect(Array.isArray(result.words)).toBe(true);
  });
});
