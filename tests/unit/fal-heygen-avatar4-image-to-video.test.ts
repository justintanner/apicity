import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenAvatar4ImageToVideoParsedRequest,
  type FalHeygenAvatar4ImageToVideoRequest,
  type FalHeygenAvatar4ImageToVideoRequestInput,
  type FalHeygenAvatar4ImageToVideoResponse,
  type FalRunHeygenAvatar4Namespace,
} from "@apicity/fal";
import {
  FalHeygenAvatar4ImageToVideoRequestSchema as schema,
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
// (sha256 8b7bd442063f5217a7d5e9237d22fa3770fba78a899225f38bbdfde8e4bd7191).
const endpoint = "fal-ai/heygen/avatar4/image-to-video";
const recorded = {
  image_url: "https://example.com/cat1.jpg",
  prompt: "A red panda waves once, then holds still.",
  voice: "Ivy",
  resolution: "360p",
} satisfies FalHeygenAvatar4ImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Avatar 4 image-to-video contract", () => {
  it("adds imageToVideo to the avatar4 object, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.avatar4.imageToVideo;
    expect(provider.run.heygen.avatar4).toHaveProperty("imageToVideo", leaf);
    expect(provider.run.heygen.avatar4).toHaveProperty("digitalTwin");
    expect(leaf).toBe(provider.post.run.heygen.avatar4.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.avatar4
    ).toEqualTypeOf<FalRunHeygenAvatar4Namespace>();
    expectTypeOf<FalHeygenAvatar4ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenAvatar4ImageToVideoRequestInput>().toEqualTypeOf<FalHeygenAvatar4ImageToVideoRequest>();
    expectTypeOf<FalHeygenAvatar4ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenAvatar4ImageToVideoResponse>().toEqualTypeOf<{
      video: {
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
        new Response(
          JSON.stringify({ video: { url: "https://example.com/out.mp4" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.heygen.avatar4.imageToVideo(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/heygen/avatar4/image-to-video"
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
      "image_url",
      "prompt",
      "voice",
      "audio_url",
      "talking_style",
      "expression",
      "background",
      "resolution",
      "aspect_ratio",
      "caption",
      "enable_safety_checker",
    ]);
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      talking_style: "stable",
      aspect_ratio: "16:9",
      caption: false,
      enable_safety_checker: true,
    });
    expect(schema.parse({ ...recorded, background: {} }).background).toEqual({
      type: "color",
      value: "#FFFFFF",
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ talking_style: "expressive" })).toBe(true);
    expect(accepts({ talking_style: "wild" })).toBe(false);
    expect(accepts({ expression: "happy" })).toBe(true);
    expect(accepts({ expression: "sad" })).toBe(false);
    expect(accepts({ background: { type: "video", value: "u" } })).toBe(true);
    expect(accepts({ background: { type: "gradient" } })).toBe(false);
    expect(accepts({ voice: "Ivy" })).toBe(true);
    expect(
      accepts({
        prompt: null,
        voice: null,
        audio_url: null,
        expression: null,
        aspect_ratio: "auto",
        caption: true,
      })
    ).toBe(true);
    expect(accepts({ image_url: "" })).toBe(true);
    expect(accepts({ resolution: "4k" })).toBe(false);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("requires a voice for a prompt without audio_url, as fal does", () => {
    const result = schema.safeParse({ image_url: "u", prompt: "hi" });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        message: "voice is required when using prompt (without audio_url)",
      }),
    ]);
    expect(
      schema.safeParse({ image_url: "u", prompt: "hi", audio_url: "a" }).success
    ).toBe(true);
    expect(
      schema.safeParse({ image_url: "u", prompt: "hi", voice: "Ivy" }).success
    ).toBe(true);
    expect(schema.safeParse({ image_url: "u" }).success).toBe(true);
  });

  it("is dynamically priced: the spoken script sets the billed output seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Avatar 4 Image To Video"
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
