import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalAlibabaQwenAudio3TtsParsedRequest,
  type FalAlibabaQwenAudio3TtsRequest,
  type FalAlibabaQwenAudio3TtsRequestInput,
  type FalAlibabaQwenAudio3TtsResponse,
  type FalRunAlibabaNamespace,
} from "@apicity/fal";
import {
  FalAlibabaQwenAudio3TtsRequestSchema as schema,
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
// (sha256 2d79f33cef2f2a6c196f66a3cb6bf720f86ede40075e79e06c45e10323b42dc1).
const endpoint = "alibaba/qwen-audio-3-tts";
const recorded = { text: "A" } satisfies FalAlibabaQwenAudio3TtsRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Qwen Audio 3 text-to-speech contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.alibaba.qwenAudio3Tts;
    expect(leaf).toBe(provider.post.run.alibaba.qwenAudio3Tts);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.alibaba).toEqualTypeOf<FalRunAlibabaNamespace>();
    expectTypeOf<FalAlibabaQwenAudio3TtsRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalAlibabaQwenAudio3TtsRequestInput>().toEqualTypeOf<FalAlibabaQwenAudio3TtsRequest>();
    expectTypeOf<FalAlibabaQwenAudio3TtsParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalAlibabaQwenAudio3TtsResponse>().toEqualTypeOf<{
      audio: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        duration?: number | null;
        channels?: number | null;
        sample_rate?: number | null;
        bitrate?: string | number | null;
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
    const result = await provider.run.alibaba.qwenAudio3Tts(recorded);
    expect(result.audio.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/alibaba/qwen-audio-3-tts");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual(["text", "voice", "language"]);
    expect(schema.shape.text.description).toBe(
      "The text to convert to speech."
    );
    expect(schema.shape.voice.description).toBe(
      "The voice used for speech synthesis. See the [Qwen-TTS voice list](https://www.alibabacloud.com/help/en/model-studio/qwen-tts-voice-list) for each voice's language and dialect coverage."
    );
    expect(schema.shape.language.description).toBe(
      "Language of the input text. `Auto` lets the model detect it; setting it explicitly improves pronunciation and intonation."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_text = { ...recorded } as Record<string, unknown>;
    delete without_text.text;
    expect(schema.safeParse(without_text).success).toBe(false);
  });

  it("bounds text", () => {
    expect(accepts({ text: "x".repeat(0) })).toBe(false);
    expect(accepts({ text: "x".repeat(1) })).toBe(true);
    expect(accepts({ text: "x".repeat(2000) })).toBe(true);
    expect(accepts({ text: "x".repeat(2001) })).toBe(false);
  });

  it("closes voice to the documented set", () => {
    expect(z.toJSONSchema(schema.shape.voice).enum).toEqual([
      "Cherry",
      "Serena",
      "Ethan",
      "Chelsie",
      "Momo",
      "Vivian",
      "Moon",
      "Maia",
      "Kai",
      "Nofish",
      "Bella",
      "Jennifer",
      "Ryan",
      "Katerina",
      "Aiden",
      "Mia",
      "Mochi",
      "Bellona",
      "Vincent",
      "Bunny",
      "Neil",
      "Elias",
      "Arthur",
      "Nini",
      "Seren",
      "Pip",
      "Stella",
      "Bodega",
      "Sonrisa",
      "Alek",
      "Dolce",
      "Sohee",
      "Lenn",
      "Emilien",
      "Andre",
      "Jada",
      "Dylan",
      "Li",
      "Marcus",
      "Roy",
      "Peter",
      "Sunny",
      "Eric",
      "Rocky",
      "Kiki",
    ]);
    expect(accepts({ voice: "Cherry" })).toBe(true);
    expect(accepts({ voice: "Kiki" })).toBe(true);
    expect(accepts({ voice: "not-a-documented-value" })).toBe(false);
  });

  it("accepts the documented language values", () => {
    expect(accepts({ language: "Auto" })).toBe(true);
    expect(accepts({ language: "Chinese" })).toBe(true);
    expect(accepts({ language: "English" })).toBe(true);
    expect(accepts({ language: "Spanish" })).toBe(true);
    expect(accepts({ language: "Russian" })).toBe(true);
    expect(accepts({ language: "Italian" })).toBe(true);
    expect(accepts({ language: "French" })).toBe(true);
    expect(accepts({ language: "Korean" })).toBe(true);
    expect(accepts({ language: "Japanese" })).toBe(true);
    expect(accepts({ language: "German" })).toBe(true);
    expect(accepts({ language: "Portuguese" })).toBe(true);
    expect(accepts({ language: "not-a-documented-value" })).toBe(false);
    expect(accepts({ language: null })).toBe(false);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(5e-5, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/alibaba/qwen-audio-3-tts",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "qwenaudio3"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Qwen Audio 3"
    );
  });
});
