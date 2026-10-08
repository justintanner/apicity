import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalLumaAgentRayV3p2ImageToVideoParsedRequest,
  type FalLumaAgentRayV3p2ImageToVideoRequest,
  type FalLumaAgentRayV3p2ImageToVideoRequestInput,
  type FalLumaAgentRayV3p2ImageToVideoResponse,
  type FalRunLumaAgentRayV3p2Namespace,
} from "@apicity/fal";
import {
  FalLumaAgentRayV3p2ImageToVideoRequestSchema as schema,
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
// (sha256 e95ae20b1a5eaf379534320d570eed680354232f5c035907988f14486305d5cd).
const endpoint = "luma/agent/ray/v3.2/image-to-video";
const recorded = {
  prompt:
    "Low-angle shot of a majestic tiger prowling through a snowy landscape, leaving paw prints on the white blanket.",
  image_url:
    "https://storage.googleapis.com/falserverless/gallery/example_inputs_liuyifei.png",
  duration: "5s",
  resolution: "540p",
} satisfies FalLumaAgentRayV3p2ImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Ray 3.2 image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.luma.agent.ray.v3p2.imageToVideo;
    expect(leaf).toBe(provider.post.run.luma.agent.ray.v3p2.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.luma.agent.ray.v3p2
    ).toEqualTypeOf<FalRunLumaAgentRayV3p2Namespace>();
    expectTypeOf<FalLumaAgentRayV3p2ImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2ImageToVideoRequestInput>().toEqualTypeOf<FalLumaAgentRayV3p2ImageToVideoRequest>();
    expectTypeOf<FalLumaAgentRayV3p2ImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2ImageToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      exr_file?: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      } | null;
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
      await provider.run.luma.agent.ray.v3p2.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/luma/agent/ray/v3.2/image-to-video"
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
      "image_url",
      "end_image_url",
      "aspect_ratio",
      "resolution",
      "duration",
      "loop",
      "hdr",
      "exr_export",
      "keyframes",
      "keyframe_indexes",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing the motion/scene to generate."
    );
    expect(schema.shape.image_url.description).toBe(
      "URL of the image used as the first frame of the video. Provide either image_url (optionally with end_image_url) or keyframes — the two anchoring modes are mutually exclusive."
    );
    expect(schema.shape.end_image_url.description).toBe(
      "Optional URL of an image used as the last frame. When set, the model interpolates between image_url and end_image_url. Cannot be combined with keyframes."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "Aspect ratio of the generated video."
    );
    expect(schema.shape.resolution.description).toBe(
      "Resolution of the generated video. Higher resolutions cost more."
    );
    expect(schema.shape.duration.description).toBe(
      "Duration of the generated video. 10s requires multi-keyframe input (keyframes / keyframe_indexes); it is not supported with a single image_url / end_image_url anchor."
    );
    expect(schema.shape.loop.description).toBe(
      "Generate a seamless loop. Only valid for standard-dynamic-range generations without an end frame or keyframes."
    );
    expect(schema.shape.hdr.description).toBe(
      "Generate an HDR-encoded MP4. Requires HDR access on the account and a resolution of 720p or 1080p; not supported with loop."
    );
    expect(schema.shape.exr_export.description).toBe(
      "Also export an EXR file alongside the MP4. Requires hdr=true and HDR access."
    );
    expect(schema.shape.keyframes.description).toBe(
      "Multi-keyframe image-to-video guide frames: 1-64 image URLs pinned at the positions given by keyframe_indexes. Mutually exclusive with image_url, end_image_url, and loop; unlocks 10s and HDR. Provide keyframes and keyframe_indexes together (same length)."
    );
    expect(schema.shape.keyframe_indexes.description).toBe(
      "Output-frame positions (duration x 24fps: 5s -> 0-120, 10s -> 0-240) where each keyframes[i] is anchored. Non-negative, unique, and the same length as keyframes."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_prompt = { ...recorded } as Record<string, unknown>;
    delete without_prompt.prompt;
    expect(schema.safeParse(without_prompt).success).toBe(false);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(0) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(1) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(6000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(6001) })).toBe(false);
  });

  it("accepts a null image_url", () => {
    expect(accepts({ image_url: null })).toBe(true);
  });

  it("bounds image_url", () => {
    expect(accepts({ image_url: "x".repeat(0) })).toBe(false);
    expect(accepts({ image_url: "x".repeat(1) })).toBe(true);
  });

  it("accepts a null end_image_url", () => {
    expect(accepts({ end_image_url: null })).toBe(true);
  });

  it("accepts the documented aspect_ratio values", () => {
    expect(accepts({ aspect_ratio: "3:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "1:1" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
    expect(accepts({ aspect_ratio: null })).toBe(false);
  });

  it("accepts the documented resolution values", () => {
    expect(accepts({ resolution: "540p" })).toBe(true);
    expect(accepts({ resolution: "720p" })).toBe(true);
    expect(accepts({ resolution: "1080p" })).toBe(true);
    expect(accepts({ resolution: "not-a-documented-value" })).toBe(false);
    expect(accepts({ resolution: null })).toBe(false);
  });

  it("accepts the documented duration values", () => {
    expect(accepts({ duration: "5s" })).toBe(true);
    expect(accepts({ duration: "10s" })).toBe(true);
    expect(accepts({ duration: "not-a-documented-value" })).toBe(false);
    expect(accepts({ duration: null })).toBe(false);
  });

  it("accepts a null keyframes", () => {
    expect(accepts({ keyframes: null })).toBe(true);
  });

  it("accepts a null keyframe_indexes", () => {
    expect(accepts({ keyframe_indexes: null })).toBe(true);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.15, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("warns when the card publishes no package", () => {
    for (const payload of [
      { ...recorded, duration: "10s" },
      { ...recorded, resolution: "720p" },
      { ...recorded, resolution: "1080p" },
      { ...recorded, hdr: true },
      { ...recorded, exr_export: true },
    ]) {
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload,
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.length).toBeGreaterThan(0);
    }
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/luma/agent/ray/v3.2/image-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "ray32i"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Ray 3.2 Image"
    );
  });
});
