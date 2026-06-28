import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

describe("elevenlabs v1.textToSpeech variants", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("streams TTS audio as binary", async () => {
    ctx = setupPolly("elevenlabs/text-to-speech-stream");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const audio = await provider.v1.textToSpeech.stream(VOICE_ID, {
      text: "Hello from the streaming endpoint.",
      model_id: "eleven_multilingual_v2",
    });

    expect(audio).toBeInstanceOf(ArrayBuffer);
    expect(audio.byteLength).toBeGreaterThan(0);
  });

  it("returns TTS audio with character timestamps", async () => {
    ctx = setupPolly("elevenlabs/text-to-speech-with-timestamps");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const result = await provider.v1.textToSpeech.withTimestamps(VOICE_ID, {
      text: "Timestamps please.",
      model_id: "eleven_multilingual_v2",
    });

    expect(typeof result.audio_base64).toBe("string");
    expect(result.audio_base64.length).toBeGreaterThan(0);
    expect(result.alignment).toBeTruthy();
    expect(Array.isArray(result.alignment?.characters)).toBe(true);
  });

  it("streams TTS audio chunks with timestamps", async () => {
    ctx = setupPolly("elevenlabs/text-to-speech-stream-with-timestamps");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const chunks = await provider.v1.textToSpeech.stream.withTimestamps(
      VOICE_ID,
      {
        text: "Streaming with timestamps.",
        model_id: "eleven_multilingual_v2",
      }
    );

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(typeof chunks[0].audio_base64).toBe("string");
  });
});
