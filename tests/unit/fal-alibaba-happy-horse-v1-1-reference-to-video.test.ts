import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalAlibabaHappyHorseV1p1ReferenceToVideoParsedRequest,
  type FalAlibabaHappyHorseV1p1ReferenceToVideoRequest,
  type FalAlibabaHappyHorseV1p1ReferenceToVideoRequestInput,
  type FalAlibabaHappyHorseV1p1ReferenceToVideoResponse,
  type FalRunAlibabaHappyHorseV1p1Namespace,
} from "@apicity/fal";
import {
  FalAlibabaHappyHorseV1p1ReferenceToVideoRequestSchema as schema,
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
// (sha256 10e9ea49b4e3c7d3298ecdd9e8eda5fb332c5122e4f699b51592c839ae2c674e).
const endpoint = "alibaba/happy-horse/v1.1/reference-to-video";
const recorded = {
  prompt: "A horse walks through warm grass.",
  image_urls: [
    "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250925/wpimhv/rap.png",
  ],
  resolution: "720p",
  duration: 3,
} satisfies FalAlibabaHappyHorseV1p1ReferenceToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Happy Horse 1.1 reference-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.alibaba.happyHorse.v1p1.referenceToVideo;
    expect(leaf).toBe(
      provider.post.run.alibaba.happyHorse.v1p1.referenceToVideo
    );
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.alibaba.happyHorse.v1p1
    ).toEqualTypeOf<FalRunAlibabaHappyHorseV1p1Namespace>();
    expectTypeOf<FalAlibabaHappyHorseV1p1ReferenceToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseV1p1ReferenceToVideoRequestInput>().toEqualTypeOf<FalAlibabaHappyHorseV1p1ReferenceToVideoRequest>();
    expectTypeOf<FalAlibabaHappyHorseV1p1ReferenceToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalAlibabaHappyHorseV1p1ReferenceToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.alibaba.happyHorse.v1p1.referenceToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/alibaba/happy-horse/v1.1/reference-to-video"
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
      "prompt",
      "image_urls",
      "aspect_ratio",
      "resolution",
      "duration",
      "seed",
      "enable_safety_checker",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing the desired video. Reference subjects from your images using ``character1``, ``character2``, ... up to ``character9`` (the order matches the order of ``image_urls``). Max 2500 characters."
    );
    expect(schema.shape.image_urls.description).toBe(
      "Reference images for subject consistency (1-9 images). Formats: JPEG, JPG, PNG, WEBP. Shortest side must be at least 400 px (720P or higher recommended). Max 20 MB each."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "Aspect ratio of the generated video."
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
    const without_image_urls = { ...recorded } as Record<string, unknown>;
    delete without_image_urls.image_urls;
    expect(schema.safeParse(without_image_urls).success).toBe(false);
    const without_prompt = { ...recorded } as Record<string, unknown>;
    delete without_prompt.prompt;
    expect(schema.safeParse(without_prompt).success).toBe(false);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(0) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(1) })).toBe(true);
  });

  it("accepts the documented aspect_ratio values", () => {
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "1:1" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:21" })).toBe(true);
    expect(accepts({ aspect_ratio: "5:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:5" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
    expect(accepts({ aspect_ratio: null })).toBe(false);
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
      url: "https://fal.ai/models/alibaba/happy-horse/v1.1/reference-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("hh11");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Happy Horse 1.1"
    );
  });
});
