import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

function readAudio(): Blob {
  const mp3Path = resolve(__dirname, "../fixtures/tone.mp3");
  return new Blob([readFileSync(mp3Path)], { type: "audio/mp3" });
}

describe("elevenlabs v1.speechToSpeech", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("converts source audio into the target voice as binary", async () => {
    ctx = setupPolly("elevenlabs/speech-to-speech");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const audio = await provider.v1.speechToSpeech(VOICE_ID, {
      audio: readAudio(),
      model_id: "eleven_english_sts_v2",
      remove_background_noise: true,
    });

    expect(audio).toBeInstanceOf(ArrayBuffer);
    expect(audio.byteLength).toBeGreaterThan(0);
  });

  it("streams converted speech-to-speech audio as binary", async () => {
    ctx = setupPolly("elevenlabs/speech-to-speech-stream");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const audio = await provider.v1.speechToSpeech.stream(VOICE_ID, {
      audio: readAudio(),
      model_id: "eleven_english_sts_v2",
    });

    expect(audio).toBeInstanceOf(ArrayBuffer);
    expect(audio.byteLength).toBeGreaterThan(0);
  });
});
