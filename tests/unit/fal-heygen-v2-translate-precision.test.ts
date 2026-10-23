import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenV2TranslatePrecisionParsedRequest,
  type FalHeygenV2TranslatePrecisionRequest,
  type FalHeygenV2TranslatePrecisionRequestInput,
  type FalHeygenV2TranslatePrecisionResponse,
  type FalRunHeygenV2TranslateNamespace,
} from "@apicity/fal";
import {
  FalHeygenV2TranslatePrecisionRequestSchema as schema,
  FalHeygenV2TranslateSpeedRequestSchema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  falDynamicBilledUnit,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 d91c4603858d69fed8e809f5b285ac7a8e0f4f75f6acaf52db298e4ad5dc1e19).
const endpoint = "fal-ai/heygen/v2/translate/precision";
const recorded = {
  video_url: "https://example.com/avatar.mp4",
  output_language: "Spanish",
} satisfies FalHeygenV2TranslatePrecisionRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Translate Precision contract", () => {
  it("adds precision to the translate object, sharing the speed tier's schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.v2.translate.precision;
    expect(provider.run.heygen.v2.translate).toHaveProperty("precision", leaf);
    expect(provider.run.heygen.v2.translate).toHaveProperty("speed");
    expect(schema).toBe(FalHeygenV2TranslateSpeedRequestSchema);
    expect(leaf).toBe(provider.post.run.heygen.v2.translate.precision);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.v2.translate
    ).toEqualTypeOf<FalRunHeygenV2TranslateNamespace>();
    expectTypeOf<FalHeygenV2TranslatePrecisionRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenV2TranslatePrecisionRequestInput>().toEqualTypeOf<FalHeygenV2TranslatePrecisionRequest>();
    expectTypeOf<FalHeygenV2TranslatePrecisionParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<
      FalHeygenV2TranslatePrecisionResponse["video"]
    >().toEqualTypeOf<{
      url: string;
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ video: { url: "https://example.com/out.mp4" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.heygen.v2.translate.precision(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/heygen/v2/translate/precision"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "video_url",
      "output_language",
      "translate_audio_only",
      "speaker_num",
      "enable_dynamic_duration",
      "brand_glossary_id",
      "srt_url",
      "srt_role",
      "enable_caption",
    ]);
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      translate_audio_only: false,
      enable_dynamic_duration: true,
      enable_caption: false,
    });
    const languages = z.toJSONSchema(schema.shape.output_language).enum;
    expect(languages).toHaveLength(178);
    expect(languages?.[0]).toBe("English");
    // The set is documented, not probe-confirmed: fal's validator let
    // "Klingon" through to its video_url download.
    expect(accepts({ output_language: "Klingon" })).toBe(false);
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ video_url: "v" }).success).toBe(false);
    expect(accepts({ speaker_num: "two" })).toBe(false);
    expect(accepts({ speaker_num: 0 })).toBe(true);
    expect(accepts({ srt_role: "both" })).toBe(false);
    expect(accepts({ srt_role: "output" })).toBe(true);
    expect(accepts({ video_url: "" })).toBe(true);
    expect(
      accepts({
        translate_audio_only: null,
        speaker_num: null,
        enable_dynamic_duration: null,
        brand_glossary_id: null,
        srt_url: null,
        srt_role: null,
      })
    ).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the source and translation set the billed seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Translate Precision"
    );
    // The recording billed 8 units at $0.05 for 3.28 s of output.
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "units at $0.05, two per whole second of output video (the card's $0.10 a second)"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
