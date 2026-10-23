import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenHeygenVideoTextToVideoParsedRequest,
  type FalHeygenHeygenVideoTextToVideoRequest,
  type FalHeygenHeygenVideoTextToVideoRequestInput,
  type FalHeygenHeygenVideoTextToVideoResponse,
  type FalRunHeygenHeygenVideoNamespace,
} from "@apicity/fal";
import {
  FalHeygenHeygenVideoTextToVideoRequestSchema as schema,
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
// (sha256 32f6a4ab26aebcb0d97234366f2ac872045fa5eff5ecd430b6cf3a5285e4629d).
const endpoint = "heygen/heygen-video/text-to-video";
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  duration: 5,
  resolution: "480p",
  prompt_enhancement: "disabled",
} satisfies FalHeygenHeygenVideoTextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const usd = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload }).usd;

describe("HeyGen Video text-to-video contract", () => {
  it("owns the heygenVideo object under heygen, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.heygenVideo.textToVideo;
    expect(provider.run.heygen.heygenVideo).toHaveProperty("textToVideo", leaf);
    expect(provider.run.heygen).toHaveProperty("heygenVoice");
    expect(leaf).toBe(provider.post.run.heygen.heygenVideo.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.heygenVideo
    ).toEqualTypeOf<FalRunHeygenHeygenVideoNamespace>();
    expectTypeOf<FalHeygenHeygenVideoTextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVideoTextToVideoRequestInput>().toEqualTypeOf<FalHeygenHeygenVideoTextToVideoRequest>();
    expectTypeOf<FalHeygenHeygenVideoTextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVideoTextToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      seed?: number | null;
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
    await provider.run.heygen.heygenVideo.textToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/heygen/heygen-video/text-to-video"
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
      "prompt",
      "duration",
      "resolution",
      "prompt_enhancement",
      "seed",
      "aspect_ratio",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      duration: 5,
      resolution: "768p",
      prompt_enhancement: "turbo",
      aspect_ratio: "16:9",
      enable_safety_checker: true,
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ generate_audio: false })).toBe(false);
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: "   " })).toBe(true);
    expect(accepts({ duration: 4 })).toBe(false);
    expect(accepts({ duration: 15 })).toBe(true);
    expect(accepts({ duration: 16 })).toBe(false);
    expect(accepts({ duration: 5.5 })).toBe(false);
    expect(accepts({ resolution: "2k" })).toBe(true);
    expect(accepts({ resolution: "4k" })).toBe(false);
    expect(accepts({ prompt_enhancement: "ultraquality" })).toBe(true);
    expect(accepts({ prompt_enhancement: "max" })).toBe(false);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "2:1" })).toBe(false);
    expect(accepts({ seed: 4294967295 })).toBe(true);
    expect(accepts({ seed: 4294967296 })).toBe(false);
    expect(accepts({ seed: null })).toBe(true);
  });

  it("prices requested seconds by resolution tier from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.1, 10);
    expect(estimate.breakdown).toMatchObject({ units: 5, unit: "seconds" });
    expect(estimate.warnings).toEqual([]);
    expect(usd({ prompt: "x" })).toBeCloseTo(0.1, 10);
    expect(usd({ prompt: "x", resolution: "1080p", duration: 10 })).toBeCloseTo(
      0.6,
      10
    );
    expect(usd({ prompt: "x", resolution: "2k", duration: 15 })).toBeCloseTo(
      0.9,
      10
    );
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/heygen/heygen-video/text-to-video",
      asOf: "2026-10-23",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "heygenvideo"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Video"
    );
  });
});
