import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenHeygenVideoReferenceToVideoParsedRequest,
  type FalHeygenHeygenVideoReferenceToVideoRequest,
  type FalHeygenHeygenVideoReferenceToVideoRequestInput,
  type FalHeygenHeygenVideoReferenceToVideoResponse,
  type FalRunHeygenHeygenVideoNamespace,
} from "@apicity/fal";
import {
  FalHeygenHeygenVideoReferenceToVideoRequestSchema as schema,
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
// (sha256 851444de7b5a9fca64f2e0884f9ca58bea71b0dad031e7394a9811056abd074d).
const endpoint = "heygen/heygen-video/reference-to-video";
const recorded = {
  prompt: "The cat from the reference image waves once, then holds still.",
  reference_image_urls: ["https://example.com/cat1.jpg"],
  duration: 5,
  resolution: "480p",
  prompt_enhancement: "disabled",
} satisfies FalHeygenHeygenVideoReferenceToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const usd = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload }).usd;

describe("HeyGen Video reference-to-video contract", () => {
  it("adds referenceToVideo to the heygenVideo object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.heygenVideo.referenceToVideo;
    expect(provider.run.heygen.heygenVideo).toHaveProperty(
      "referenceToVideo",
      leaf
    );
    expect(provider.run.heygen.heygenVideo).toHaveProperty("textToVideo");
    expect(leaf).toBe(provider.post.run.heygen.heygenVideo.referenceToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.heygenVideo
    ).toEqualTypeOf<FalRunHeygenHeygenVideoNamespace>();
    expectTypeOf<FalHeygenHeygenVideoReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVideoReferenceToVideoRequestInput>().toEqualTypeOf<FalHeygenHeygenVideoReferenceToVideoRequest>();
    expectTypeOf<FalHeygenHeygenVideoReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVideoReferenceToVideoResponse>().toEqualTypeOf<{
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
    await provider.run.heygen.heygenVideo.referenceToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/heygen/heygen-video/reference-to-video"
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
      "reference_image_urls",
      "reference_video_urls",
      "reference_audio_urls",
      "aspect_ratio",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: "x", reference_video_urls: ["v"] })).toEqual({
      prompt: "x",
      reference_video_urls: ["v"],
      duration: 5,
      resolution: "768p",
      prompt_enhancement: "turbo",
      aspect_ratio: "adaptive",
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
    expect(accepts({ aspect_ratio: "adaptive" })).toBe(true);
    expect(accepts({ aspect_ratio: "2:1" })).toBe(false);
    expect(accepts({ reference_image_urls: Array(9).fill("u") })).toBe(true);
    expect(accepts({ reference_image_urls: Array(10).fill("u") })).toBe(false);
    expect(accepts({ reference_video_urls: Array(4).fill("u") })).toBe(false);
    expect(accepts({ reference_audio_urls: Array(4).fill("u") })).toBe(false);
    expect(accepts({ reference_image_urls: null })).toBe(false);
  });

  it("requires a reference image or video, as fal's field validator does", () => {
    const result = schema.safeParse({
      prompt: "x",
      reference_audio_urls: ["https://example.com/a.mp3"],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["reference_video_urls"],
        message: "At least one reference image or video is required",
      }),
    ]);
    expect(
      schema.safeParse({ prompt: "x", reference_image_urls: [] }).success
    ).toBe(false);
    expect(
      schema.safeParse({ prompt: "x", reference_video_urls: ["v"] }).success
    ).toBe(true);
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
    expect(estimate.usd).toBeCloseTo(0.05, 10);
    expect(estimate.breakdown).toMatchObject({ units: 5, unit: "seconds" });
    expect(estimate.warnings).toEqual([]);
    expect(usd({ prompt: "x", reference_video_urls: ["v"] })).toBeCloseTo(
      0.05,
      10
    );
    expect(
      usd({
        prompt: "x",
        reference_video_urls: ["v"],
        resolution: "1080p",
        duration: 10,
      })
    ).toBeCloseTo(0.3, 10);
    expect(
      usd({
        prompt: "x",
        reference_video_urls: ["v"],
        resolution: "2k",
        duration: 15,
      })
    ).toBeCloseTo(0.45, 10);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/heygen/heygen-video/reference-to-video",
      asOf: "2026-10-29",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "heygenvideo"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Video"
    );
  });
});
