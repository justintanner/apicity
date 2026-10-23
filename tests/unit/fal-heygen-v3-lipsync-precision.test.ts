import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenV3LipsyncPrecisionParsedRequest,
  type FalHeygenV3LipsyncPrecisionRequest,
  type FalHeygenV3LipsyncPrecisionRequestInput,
  type FalHeygenV3LipsyncPrecisionResponse,
  type FalRunHeygenV3LipsyncNamespace,
} from "@apicity/fal";
import {
  FalHeygenV3LipsyncPrecisionRequestSchema as schema,
  FalHeygenV3LipsyncSpeedRequestSchema,
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
// (sha256 be02cf5994fec755821650ca28d228e6a84b35b5992fa165ee148e7abe89e8ce).
const endpoint = "fal-ai/heygen/v3/lipsync/precision";
const recorded = {
  video_url: "https://example.com/avatar.mp4",
  audio_url: "https://example.com/voice.wav",
} satisfies FalHeygenV3LipsyncPrecisionRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Lipsync Precision contract", () => {
  it("adds precision to the lipsync object, sharing the speed tier's schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.v3.lipsync.precision;
    expect(provider.run.heygen.v3.lipsync).toHaveProperty("precision", leaf);
    expect(provider.run.heygen.v3.lipsync).toHaveProperty("speed");
    expect(schema).toBe(FalHeygenV3LipsyncSpeedRequestSchema);
    expect(leaf).toBe(provider.post.run.heygen.v3.lipsync.precision);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.v3.lipsync
    ).toEqualTypeOf<FalRunHeygenV3LipsyncNamespace>();
    expectTypeOf<FalHeygenV3LipsyncPrecisionRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenV3LipsyncPrecisionRequestInput>().toEqualTypeOf<FalHeygenV3LipsyncPrecisionRequest>();
    expectTypeOf<FalHeygenV3LipsyncPrecisionParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenV3LipsyncPrecisionResponse["video"]>().toEqualTypeOf<{
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
    await provider.run.heygen.v3.lipsync.precision(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/heygen/v3/lipsync/precision"
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
      "audio_url",
      "title",
      "enable_caption",
      "enable_dynamic_duration",
      "disable_music_track",
      "enable_speech_enhancement",
      "start_time",
      "end_time",
    ]);
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      enable_caption: false,
      enable_dynamic_duration: true,
      disable_music_track: false,
      enable_speech_enhancement: false,
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ video_url: "v" }).success).toBe(false);
    expect(accepts({ start_time: -1 })).toBe(false);
    expect(accepts({ end_time: -2 })).toBe(false);
    expect(accepts({ start_time: 0, end_time: 1.5 })).toBe(true);
    expect(accepts({ enable_caption: "maybe" })).toBe(false);
    expect(accepts({ title: null, start_time: null, end_time: null })).toBe(
      true
    );
    expect(accepts({ video_url: "", audio_url: "" })).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the source media set the billed output seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Lipsync Precision"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "seconds of output video at $0.10"
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
