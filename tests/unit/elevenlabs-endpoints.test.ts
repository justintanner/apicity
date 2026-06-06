import { describe, expect, it, vi } from "vitest";

import { createElevenLabs } from "../../packages/provider/elevenlabs/src";

describe("ElevenLabs endpoint wiring", () => {
  it("posts text-to-speech requests to the voice-specific create endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
      })
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.textToSpeech("voice_123", {
      text: "Hello from Apicity.",
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      enable_logging: false,
    });

    expect(result.byteLength).toBe(3);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/voice_123?output_format=mp3_44100_128&enable_logging=false"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      text: "Hello from Apicity.",
      model_id: "eleven_multilingual_v2",
    });
  });

  it("posts text-to-dialogue requests to the dialogue create endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([4, 5, 6]), {
        status: 200,
      })
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.textToDialogue({
      inputs: [
        {
          text: "[curious] Who is there?",
          voice_id: "JBFqnCBsd6RMkjVDRZzb",
        },
      ],
      model_id: "eleven_v3",
      output_format: "mp3_44100_128",
    });

    expect(result.byteLength).toBe(3);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      inputs: [
        {
          text: "[curious] Who is there?",
          voice_id: "JBFqnCBsd6RMkjVDRZzb",
        },
      ],
      model_id: "eleven_v3",
    });
  });
});
