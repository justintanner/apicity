import { describe, it, expect } from "vitest";
import { createFal } from "@apicity/fal";

interface CapturedRequest {
  url: string;
  init?: RequestInit;
}

describe("fal bytedance seed speech tts v2", () => {
  it("should post to the fal.run seed speech endpoint", async () => {
    const requests: CapturedRequest[] = [];
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return new Response(
          JSON.stringify({
            audio: {
              url: "https://v3b.fal.media/files/b/test/audio.mp3",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    });

    const payload = {
      text: "Hello from Apicity.",
      voice: "stokie_en" as const,
      output_format: "mp3" as const,
      sample_rate: 24000 as const,
      speed: 1,
      volume: 1,
      pitch: 0,
      language: "en" as const,
      voice_instruction: "Speak in a warm, cheerful tone.",
    };

    const result = await provider.run.bytedance.seedSpeech.tts.v2(payload);

    expect(result.audio.url).toBe(
      "https://v3b.fal.media/files/b/test/audio.mp3"
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://fal.run/fal-ai/bytedance/seed-speech/tts/v2"
    );
    expect(requests[0].init?.method).toBe("POST");
    expect(requests[0].init?.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(requests[0].init?.body))).toEqual(payload);
  });

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedSpeech.tts.v2.schema.safeParse({
      text: "Hello from Apicity.",
      voice: "stokie_en",
      output_format: "opus",
      sample_rate: 48000,
      speed: 0.5,
      volume: 2,
      pitch: -12,
      language: null,
      voice_instruction: null,
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required text", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedSpeech.tts.v2.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("text"))).toBe(true);
  });

  it("should reject invalid enum and range values", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedSpeech.tts.v2.schema.safeParse({
      text: "Hello",
      voice: "unknown_voice",
      output_format: "wav",
      sample_rate: 11025,
      speed: 0.25,
      volume: 2.5,
      pitch: 13,
      language: "th",
    });
    expect(v.success).toBe(false);
  });

  it("should reject text longer than 5000 characters", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedSpeech.tts.v2.schema.safeParse({
      text: "a".repeat(5001),
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedSpeech.tts.v2.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedSpeech.tts.v2).toBe(
      provider.post.run.bytedance.seedSpeech.tts.v2
    );
  });
});
