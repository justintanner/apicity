import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalElevenlabsMusicV2p5ParsedRequest,
  type FalElevenlabsMusicV2p5Request,
  type FalElevenlabsMusicV2p5RequestInput,
  type FalElevenlabsMusicV2p5Response,
  type FalRunElevenlabsMusicNamespace,
} from "@apicity/fal";
import {
  FalElevenlabsMusicV2p5RequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-08
// (sha256 ba750092e132d055203a8475ce3aaddeee1683cc9ec0153368a476a9319a7ee3).
const endpoint = "elevenlabs/music/v2.5";
const recorded = {
  prompt:
    "Mysterious original soundtrack, themes of jungle, rainforest, nature, woodwinds, busy rhythmic tribal percussion.",
  music_length_ms: 3000,
} satisfies FalElevenlabsMusicV2p5Request;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ElevenLabs Music v2.5 contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.elevenlabs.music.v2p5;
    expect(leaf).toBe(provider.post.run.elevenlabs.music.v2p5);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.elevenlabs.music
    ).toEqualTypeOf<FalRunElevenlabsMusicNamespace>();
    expectTypeOf<FalElevenlabsMusicV2p5Request>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalElevenlabsMusicV2p5RequestInput>().toEqualTypeOf<FalElevenlabsMusicV2p5Request>();
    expectTypeOf<FalElevenlabsMusicV2p5ParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalElevenlabsMusicV2p5Response>().toEqualTypeOf<{
      audio: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ audio: { url: "https://example.com/out.bin" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.elevenlabs.music.v2p5(recorded);
    expect(result.audio.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/elevenlabs/music/v2.5");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "composition_plan",
      "music_length_ms",
      "force_instrumental",
      "seed",
      "output_format",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The text prompt describing the music to generate"
    );
    expect(schema.shape.composition_plan.description).toBe(
      "The chunk-based composition plan for the music"
    );
    expect(schema.shape.music_length_ms.description).toBe(
      "The length of the song to generate in milliseconds. Used only in conjunction with prompt. Must be between 3000ms and 600000ms. Optional - if not provided, the model will choose a length based on the prompt."
    );
    expect(schema.shape.force_instrumental.description).toBe(
      "If true, guarantees that the generated song will be instrumental. If false, the song may or may not be instrumental depending on the prompt. Can only be used with prompt."
    );
    expect(schema.shape.seed.description).toBe(
      "Random seed to initialize the music generation process. Can only be used with composition_plan. The same seed with the same parameters gives more consistent results, but exact reproducibility is not guaranteed."
    );
    expect(schema.shape.output_format.description).toBe(
      "Output format of the generated audio. Formatted as codec_sample_rate_bitrate. So an mp3 with 22.05kHz sample rate at 32kbs is represented as mp3_22050_32. Note that the μ-law format (sometimes written mu-law, often approximated as u-law) is commonly used for Twilio audio inputs."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("accepts an empty body and fills documented defaults", () => {
    expect(schema.parse({})).toEqual({
      force_instrumental: false,
      output_format: "mp3_48000_192",
    });
  });

  it("accepts a null prompt", () => {
    expect(accepts({ prompt: null })).toBe(true);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(4100) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(4101) })).toBe(false);
  });

  it("accepts a null composition_plan", () => {
    expect(accepts({ composition_plan: null })).toBe(true);
  });

  it("accepts a null music_length_ms", () => {
    expect(accepts({ music_length_ms: null })).toBe(true);
  });

  it("bounds the music_length_ms number", () => {
    expect(accepts({ music_length_ms: 3000 })).toBe(true);
    expect(accepts({ music_length_ms: 2999 })).toBe(false);
    expect(accepts({ music_length_ms: 600000 })).toBe(true);
    expect(accepts({ music_length_ms: 600001 })).toBe(false);
  });

  it("accepts a null seed", () => {
    expect(accepts({ seed: null })).toBe(true);
  });

  it("closes output_format to the documented set", () => {
    expect(z.toJSONSchema(schema.shape.output_format).enum).toEqual([
      "mp3_22050_32",
      "mp3_24000_48",
      "mp3_44100_32",
      "mp3_44100_64",
      "mp3_44100_96",
      "mp3_44100_128",
      "mp3_44100_192",
      "mp3_48000_128",
      "mp3_48000_192",
      "mp3_48000_240",
      "mp3_48000_320",
      "pcm_8000",
      "pcm_16000",
      "pcm_22050",
      "pcm_24000",
      "pcm_32000",
      "pcm_44100",
      "pcm_48000",
      "ulaw_8000",
      "alaw_8000",
      "opus_48000_32",
      "opus_48000_64",
      "opus_48000_96",
      "opus_48000_128",
      "opus_48000_192",
    ]);
    expect(accepts({ output_format: "mp3_22050_32" })).toBe(true);
    expect(accepts({ output_format: "opus_48000_192" })).toBe(true);
    expect(accepts({ output_format: "not-a-documented-value" })).toBe(false);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.6, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/elevenlabs/music/v2.5",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "elmusic25"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "ElevenLabs Music 2.5"
    );
  });
});
