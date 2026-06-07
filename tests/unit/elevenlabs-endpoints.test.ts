import { describe, expect, it, vi } from "vitest";

import { createElevenLabs } from "../../packages/provider/elevenlabs/src";

describe("ElevenLabs endpoint wiring", () => {
  it("gets v1 voice metadata by voice id", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          voice_id: "voice/123",
          name: "Bella",
          category: "premade",
          labels: {
            language: "en",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.voices("voice/123", {
      with_settings: false,
    });

    expect(result.voice_id).toBe("voice/123");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/voices/voice%2F123?with_settings=false"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.voices).toBe(provider.v1.voices);
    expect(
      provider.v1.voices.schema.safeParse({ with_settings: "false" }).success
    ).toBe(false);
  });

  it("gets v1 voice settings by voice id", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          stability: 0.5,
          use_speaker_boost: true,
          similarity_boost: 0.75,
          style: 0,
          speed: 1,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.voices.settings("voice/123");

    expect(result).toEqual({
      stability: 0.5,
      use_speaker_boost: true,
      similarity_boost: 0.75,
      style: 0,
      speed: 1,
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/voices/voice%2F123/settings"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.voices.settings).toBe(provider.v1.voices.settings);
  });

  it("gets v2 voices with search and pagination query parameters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          voices: [
            {
              voice_id: "voice_123",
              name: "Rachel",
              category: "premade",
            },
          ],
          has_more: false,
          total_count: 1,
          next_page_token: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v2.voices({
      page_size: 2,
      search: "Rachel",
      sort: "name",
      sort_direction: "asc",
      voice_type: "default",
      category: "premade",
      fine_tuning_state: null,
      include_total_count: false,
      voice_ids: ["voice_123", "voice_456"],
    });

    expect(result.voices[0]?.voice_id).toBe("voice_123");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v2/voices?page_size=2&search=Rachel&sort=name&sort_direction=asc&voice_type=default&category=premade&include_total_count=false&voice_ids=voice_123&voice_ids=voice_456"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v2.voices).toBe(provider.v2.voices);
    expect(
      provider.v2.voices.schema.safeParse({ page_size: 101 }).success
    ).toBe(false);
  });

  it("gets user subscription data and computes remaining characters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          tier: "starter",
          character_count: 1000,
          character_limit: 10000,
          status: "active",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.user.subscription();

    expect(result).toEqual({
      tier: "starter",
      character_count: 1000,
      character_limit: 10000,
      status: "active",
      remaining_character_count: 9000,
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/user/subscription");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.user.subscription).toBe(
      provider.v1.user.subscription
    );
  });

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
