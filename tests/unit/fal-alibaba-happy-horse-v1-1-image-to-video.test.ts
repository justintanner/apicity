import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalAlibabaHappyHorseV1p1ImageToVideoParsedRequest,
  type FalAlibabaHappyHorseV1p1ImageToVideoRequest,
  type FalAlibabaHappyHorseV1p1ImageToVideoRequestInput,
  type FalAlibabaHappyHorseV1p1ImageToVideoResponse,
  type FalRunAlibabaHappyHorseV1p1Namespace,
} from "@apicity/fal";
import {
  FalAlibabaHappyHorseV1p1ImageToVideoRequestSchema as schema,
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
// (sha256 19e08067c44b97e67233cabf1e0ccfc17ef3efb25c01fcf4d0e4f3754501de68).
const endpoint = "alibaba/happy-horse/v1.1/image-to-video";
const recorded = {
  image_url:
    "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/wpimhv/rap.png",
  prompt: "A horse walks through warm grass.",
  resolution: "720p",
  duration: 3,
} satisfies FalAlibabaHappyHorseV1p1ImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Happy Horse 1.1 image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.alibaba.happyHorse.v1p1.imageToVideo;
    expect(leaf).toBe(provider.post.run.alibaba.happyHorse.v1p1.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.alibaba.happyHorse.v1p1
    ).toEqualTypeOf<FalRunAlibabaHappyHorseV1p1Namespace>();
    expectTypeOf<FalAlibabaHappyHorseV1p1ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseV1p1ImageToVideoRequestInput>().toEqualTypeOf<FalAlibabaHappyHorseV1p1ImageToVideoRequest>();
    expectTypeOf<FalAlibabaHappyHorseV1p1ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseV1p1ImageToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
        fps?: number | null;
        duration?: number | null;
        num_frames?: number | null;
      };
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ video: { url: "https://example.com/out.bin" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.alibaba.happyHorse.v1p1.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/alibaba/happy-horse/v1.1/image-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "image_url",
      "prompt",
      "resolution",
      "duration",
      "seed",
      "enable_safety_checker",
    ]);
    expect(schema.shape.image_url.description).toBe(
      "URL of the first frame image. Formats: JPEG, JPG, PNG, BMP, WEBP. Dimensions must be at least 300px. Aspect ratio must be between 1:2.5 and 2.5:1. Max 20 MB."
    );
    expect(schema.shape.prompt.description).toBe(
      "Optional text prompt guiding the animation. Max 2500 characters."
    );
    expect(schema.shape.resolution.description).toBe(
      "Output video resolution tier."
    );
    expect(schema.shape.duration.description).toBe(
      "Output video duration in seconds (3-15)."
    );
    expect(schema.shape.seed.description).toBe(
      "Random seed for reproducibility (0-2147483647)."
    );
    expect(schema.shape.enable_safety_checker.description).toBe(
      "Enable content moderation for input and output. Disabling it requires account authorization; unauthorized requests are always checked."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_image_url = { ...recorded } as Record<string, unknown>;
    delete without_image_url.image_url;
    expect(schema.safeParse(without_image_url).success).toBe(false);
  });

  it("accepts a null prompt", () => {
    expect(accepts({ prompt: null })).toBe(true);
  });

  it("accepts the documented resolution values", () => {
    expect(accepts({ resolution: "720p" })).toBe(true);
    expect(accepts({ resolution: "1080p" })).toBe(true);
    expect(accepts({ resolution: "not-a-documented-value" })).toBe(false);
    expect(accepts({ resolution: null })).toBe(false);
  });

  it("accepts the documented duration values", () => {
    expect(accepts({ duration: 3 })).toBe(true);
    expect(accepts({ duration: 4 })).toBe(true);
    expect(accepts({ duration: 5 })).toBe(true);
    expect(accepts({ duration: 6 })).toBe(true);
    expect(accepts({ duration: 7 })).toBe(true);
    expect(accepts({ duration: 8 })).toBe(true);
    expect(accepts({ duration: 9 })).toBe(true);
    expect(accepts({ duration: 10 })).toBe(true);
    expect(accepts({ duration: 11 })).toBe(true);
    expect(accepts({ duration: 12 })).toBe(true);
    expect(accepts({ duration: 13 })).toBe(true);
    expect(accepts({ duration: 14 })).toBe(true);
    expect(accepts({ duration: 15 })).toBe(true);
    expect(accepts({ duration: "not-a-documented-value" })).toBe(false);
    expect(accepts({ duration: null })).toBe(false);
  });

  it("accepts a null seed", () => {
    expect(accepts({ seed: null })).toBe(true);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.42, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/alibaba/happy-horse/v1.1/image-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("hh11");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Happy Horse 1.1"
    );
  });
});
