import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenHeygenVoiceParsedRequest,
  type FalHeygenHeygenVoiceRequest,
  type FalHeygenHeygenVoiceRequestInput,
  type FalHeygenHeygenVoiceResponse,
  type FalRunHeygenHeygenVoiceNamespace,
  type FalRunHeygenNamespace,
} from "@apicity/fal";
import {
  FalHeygenHeygenVoiceRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 38699e695604901e3a29ce970df53431f02b98fd6a315712c32be4a26776d00b).
const endpoint = "heygen/heygen-voice";
const recorded = {
  text: "A red panda waves once, then holds still.",
} satisfies FalHeygenHeygenVoiceRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HeyGen Voice contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.heygenVoice;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.heygen.heygenVoice);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.heygen).toEqualTypeOf<FalRunHeygenNamespace>();
    expectTypeOf(leaf).toEqualTypeOf<FalRunHeygenHeygenVoiceNamespace>();
    expectTypeOf<FalHeygenHeygenVoiceRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVoiceRequestInput>().toEqualTypeOf<FalHeygenHeygenVoiceRequest>();
    expectTypeOf<FalHeygenHeygenVoiceParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVoiceResponse>().toEqualTypeOf<{
      audio: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      duration: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        audio: { url: "https://example.com/speech.wav" },
        duration: 2.5,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.heygen.heygenVoice(recorded);
    expect(result).toEqual({
      audio: { url: "https://example.com/speech.wav" },
      duration: 2.5,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/heygen/heygen-voice");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "text",
      "voice",
      "reference_audio_url",
      "language",
      "expressiveness_boost",
      "enable_safety_checker",
    ]);
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      voice: "Jonah",
      expressiveness_boost: 1,
      enable_safety_checker: true,
    });
    expect(schema.shape.reference_audio_url.description).toBe(
      "Recording of a single speaker to clone instead of using a public voice. Only the first 3 minutes are used."
    );
  });

  it("refuses fields the closed upstream input does not declare", () => {
    expect(accepts({ sync_mode: true })).toBe(false);
  });

  it("requires text and bounds it to 1-5000 characters", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ text: "" })).toBe(false);
    // A blank text passed fal's validator in a free 422 probe.
    expect(accepts({ text: "   " })).toBe(true);
    expect(accepts({ text: "x".repeat(5000) })).toBe(true);
    expect(accepts({ text: "x".repeat(5001) })).toBe(false);
  });

  it("closes voice to the 24 public voices", () => {
    expect(z.toJSONSchema(schema.shape.voice).enum).toEqual([
      "Jonah",
      "Nadine",
      "Tabitha",
      "Soren",
      "Elowen",
      "Vincent",
      "Jocelyn",
      "Marielle",
      "Corinne",
      "Lucian",
      "Kieran",
      "Hugh",
      "Noelle",
      "Bram",
      "Ewan",
      "Iona",
      "Cecily",
      "Simon",
      "Weston",
      "Felicity",
      "Gareth",
      "Rory",
      "Meredith",
      "Sabrina",
    ]);
    expect(accepts({ voice: "Sabrina" })).toBe(true);
    expect(accepts({ voice: "NotAVoice" })).toBe(false);
  });

  it("takes a nullable language from the documented set", () => {
    expect(accepts({ language: "en" })).toBe(true);
    expect(accepts({ language: "zh" })).toBe(true);
    expect(accepts({ language: null })).toBe(true);
    expect(accepts({ language: "xx" })).toBe(false);
    expect(accepts({ language: "EN" })).toBe(false);
  });

  it("bounds expressiveness_boost to 0-1 and leaves the reference audio open", () => {
    expect(accepts({ expressiveness_boost: 0 })).toBe(true);
    expect(accepts({ expressiveness_boost: 1 })).toBe(true);
    expect(accepts({ expressiveness_boost: -0.1 })).toBe(false);
    expect(accepts({ expressiveness_boost: 1.5 })).toBe(false);
    // fal's validator accepted a non-URL string in a free 422 probe.
    expect(accepts({ reference_audio_url: "not a url" })).toBe(true);
    expect(accepts({ reference_audio_url: null })).toBe(true);
  });

  it("prices the recorded request from the card's per-character rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.00123, 10);
    expect(estimate.breakdown).toMatchObject({
      units: 41,
      unit: "characters",
    });
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/heygen/heygen-voice",
      asOf: "2026-10-23",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "heygenvoice"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Voice"
    );
  });
});
