import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenHeygenVoiceTurboParsedRequest,
  type FalHeygenHeygenVoiceTurboRequest,
  type FalHeygenHeygenVoiceTurboRequestInput,
  type FalHeygenHeygenVoiceTurboResponse,
  type FalRunHeygenHeygenVoiceNamespace,
} from "@apicity/fal";
import {
  FalHeygenHeygenVoiceRequestSchema,
  FalHeygenHeygenVoiceTurboRequestSchema as schema,
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
// (sha256 e415617de686d811142876f673690a0da2fe1d981d7ce4ffc10caccde88e7ac5),
// whose input is JSON-identical to heygen/heygen-voice's.
const endpoint = "heygen/heygen-voice/turbo";
const recorded = {
  text: "A red panda waves once, then holds still.",
} satisfies FalHeygenHeygenVoiceTurboRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HeyGen Voice Turbo contract", () => {
  it("hangs turbo off the heygenVoice callable, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const voice = provider.run.heygen.heygenVoice;
    const leaf = voice.turbo;
    expect(typeof voice).toBe("function");
    expect(voice).toHaveProperty("turbo", leaf);
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.heygen.heygenVoice.turbo);
    expect(leaf.schema).toBe(schema);
    expect(schema).toBe(FalHeygenHeygenVoiceRequestSchema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(voice).toEqualTypeOf<FalRunHeygenHeygenVoiceNamespace>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalHeygenHeygenVoiceTurboRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalHeygenHeygenVoiceTurboResponse>();
    expectTypeOf<FalHeygenHeygenVoiceTurboRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVoiceTurboRequestInput>().toEqualTypeOf<FalHeygenHeygenVoiceTurboRequest>();
    expectTypeOf<FalHeygenHeygenVoiceTurboParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVoiceTurboResponse>().toEqualTypeOf<{
      audio: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      duration: number;
    }>();
  });

  it("posts the body unchanged to the turbo route with the key header", async () => {
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
    const result = await provider.run.heygen.heygenVoice.turbo(recorded);
    expect(result).toEqual({
      audio: { url: "https://example.com/speech.wav" },
      duration: 2.5,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/heygen/heygen-voice/turbo");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("restates the field rules the turbo validator confirmed in free 422 probes", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "text",
      "voice",
      "reference_audio_url",
      "language",
      "expressiveness_boost",
      "enable_safety_checker",
    ]);
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ sync_mode: true })).toBe(false);
    expect(accepts({ text: "" })).toBe(false);
    expect(accepts({ text: "   " })).toBe(true);
    expect(accepts({ text: "x".repeat(5001) })).toBe(false);
    expect(accepts({ voice: "NotAVoice" })).toBe(false);
    expect(accepts({ language: "xx" })).toBe(false);
    expect(accepts({ language: null })).toBe(true);
    expect(accepts({ expressiveness_boost: 1.5 })).toBe(false);
    expect(accepts({ expressiveness_boost: -0.1 })).toBe(false);
    expect(accepts({ reference_audio_url: "not a url" })).toBe(true);
  });

  it("prices the recorded request from the card's per-character rate", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.000164, 10);
    expect(estimate.breakdown).toMatchObject({
      units: 41,
      unit: "characters",
    });
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/heygen/heygen-voice/turbo",
      asOf: "2026-10-23",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "heygenvoicet"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Voice Turbo"
    );
  });
});
