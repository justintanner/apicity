import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";
import type {
  ElevenLabsVoice,
  ElevenLabsVoicePreviewsResponse,
} from "@apicity/elevenlabs";

const VOICE_DESCRIPTION =
  "A warm, friendly middle-aged narrator with a calm British accent.";

describe("elevenlabs v1.textToVoice", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("designs previews, creates a voice, remixes it, and streams a preview", async () => {
    ctx = setupPolly("elevenlabs/text-to-voice");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // textToVoice is the callable create endpoint with design/remix/stream
    // attached as sub-methods.
    expect(typeof provider.v1.textToVoice).toBe("function");
    expect(typeof provider.v1.textToVoice.design).toBe("function");
    expect(typeof provider.v1.textToVoice.remix).toBe("function");
    expect(typeof provider.v1.textToVoice.stream).toBe("function");

    // 1. Design voice previews from a text description.
    const designed: ElevenLabsVoicePreviewsResponse =
      await provider.v1.textToVoice.design({
        voice_description: VOICE_DESCRIPTION,
        auto_generate_text: true,
      });
    expect(Array.isArray(designed.previews)).toBe(true);
    expect(designed.previews.length).toBeGreaterThan(0);
    const preview = designed.previews[0];
    expect(typeof preview.generated_voice_id).toBe("string");
    expect(typeof preview.audio_base_64).toBe("string");

    // 2. Create a persistent voice from the chosen preview.
    const created: ElevenLabsVoice = await provider.v1.textToVoice({
      voice_name: "Apicity Test Narrator",
      voice_description: VOICE_DESCRIPTION,
      generated_voice_id: preview.generated_voice_id,
    });
    expect(typeof created.voice_id).toBe("string");

    // 3. Remix the created voice into new previews.
    const remixed: ElevenLabsVoicePreviewsResponse =
      await provider.v1.textToVoice.remix(created.voice_id, {
        voice_description: "Make it brighter and more energetic.",
        auto_generate_text: true,
      });
    expect(Array.isArray(remixed.previews)).toBe(true);
    expect(remixed.previews.length).toBeGreaterThan(0);

    // 4. Design a streamable preview, then stream it as binary audio.
    //    Streaming requires previews generated with stream_previews enabled.
    const streamable: ElevenLabsVoicePreviewsResponse =
      await provider.v1.textToVoice.design({
        voice_description: VOICE_DESCRIPTION,
        auto_generate_text: true,
        stream_previews: true,
      });
    expect(streamable.previews.length).toBeGreaterThan(0);
    const streamed = await provider.v1.textToVoice.stream(
      streamable.previews[0].generated_voice_id
    );
    expect(streamed).toBeInstanceOf(ArrayBuffer);
    expect(streamed.byteLength).toBeGreaterThan(0);
    // Voice generation (design/create/remix) is slow on real calls; replay is
    // instant. Allow extra wall time so the recording pass does not time out.
  }, 120000);
});
