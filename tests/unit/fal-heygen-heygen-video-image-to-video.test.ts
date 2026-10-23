import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenHeygenVideoImageToVideoParsedRequest,
  type FalHeygenHeygenVideoImageToVideoRequest,
  type FalHeygenHeygenVideoImageToVideoRequestInput,
  type FalHeygenHeygenVideoImageToVideoResponse,
  type FalRunHeygenHeygenVideoNamespace,
} from "@apicity/fal";
import {
  FalHeygenHeygenVideoImageToVideoRequestSchema as schema,
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
// (sha256 2b872b7c7eb6bae233b43ad3ccaeb18f372ff6465154e563aca1896ac9068c21).
const endpoint = "heygen/heygen-video/image-to-video";
const recorded = {
  prompt: "The cat waves once, then holds still.",
  image_url: "https://example.com/cat1.jpg",
  duration: 5,
  resolution: "480p",
  prompt_enhancement: "disabled",
} satisfies FalHeygenHeygenVideoImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

const usd = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "fal", endpoint, payload }).usd;

describe("HeyGen Video image-to-video contract", () => {
  it("adds imageToVideo to the heygenVideo object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.heygenVideo.imageToVideo;
    expect(provider.run.heygen.heygenVideo).toHaveProperty(
      "imageToVideo",
      leaf
    );
    expect(provider.run.heygen.heygenVideo).toHaveProperty("textToVideo");
    expect(leaf).toBe(provider.post.run.heygen.heygenVideo.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.heygenVideo
    ).toEqualTypeOf<FalRunHeygenHeygenVideoNamespace>();
    expectTypeOf<FalHeygenHeygenVideoImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVideoImageToVideoRequestInput>().toEqualTypeOf<FalHeygenHeygenVideoImageToVideoRequest>();
    expectTypeOf<FalHeygenHeygenVideoImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenHeygenVideoImageToVideoResponse>().toEqualTypeOf<{
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
    await provider.run.heygen.heygenVideo.imageToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/heygen/heygen-video/image-to-video"
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
      "image_url",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: "x", image_url: "u" })).toEqual({
      prompt: "x",
      image_url: "u",
      duration: 5,
      resolution: "768p",
      prompt_enhancement: "turbo",
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
    expect(accepts({ aspect_ratio: "16:9" })).toBe(false);
    expect(accepts({ image_url: "" })).toBe(true);
    expect(schema.safeParse({ prompt: "x" }).success).toBe(false);
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
    expect(usd({ prompt: "x", image_url: "u" })).toBeCloseTo(0.1, 10);
    expect(
      usd({ prompt: "x", image_url: "u", resolution: "1080p", duration: 10 })
    ).toBeCloseTo(0.6, 10);
    expect(
      usd({ prompt: "x", image_url: "u", resolution: "2k", duration: 15 })
    ).toBeCloseTo(0.9, 10);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/heygen/heygen-video/image-to-video",
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
