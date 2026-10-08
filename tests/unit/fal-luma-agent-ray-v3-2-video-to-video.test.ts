import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalLumaAgentRayV3p2VideoToVideoParsedRequest,
  type FalLumaAgentRayV3p2VideoToVideoRequest,
  type FalLumaAgentRayV3p2VideoToVideoRequestInput,
  type FalLumaAgentRayV3p2VideoToVideoResponse,
  type FalRunLumaAgentRayV3p2Namespace,
} from "@apicity/fal";
import {
  FalLumaAgentRayV3p2VideoToVideoRequestSchema as schema,
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
// (sha256 8bd14a741c36236019df945f9b48fe593fddd54853d7ea947ace9731e68c84c3).
const endpoint = "luma/agent/ray/v3.2/video-to-video";
const recorded = {
  prompt:
    "Restyle the footage as a hand-painted watercolor animation with soft pastel colors.",
  video_url:
    "https://storage.googleapis.com/falserverless/example_inputs/birefnet-video-input.mp4",
  duration: "5s",
  resolution: "540p",
} satisfies FalLumaAgentRayV3p2VideoToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Ray 3.2 video-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.luma.agent.ray.v3p2.videoToVideo;
    expect(leaf).toBe(provider.post.run.luma.agent.ray.v3p2.videoToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.luma.agent.ray.v3p2
    ).toEqualTypeOf<FalRunLumaAgentRayV3p2Namespace>();
    expectTypeOf<FalLumaAgentRayV3p2VideoToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2VideoToVideoRequestInput>().toEqualTypeOf<FalLumaAgentRayV3p2VideoToVideoRequest>();
    expectTypeOf<FalLumaAgentRayV3p2VideoToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2VideoToVideoResponse>().toEqualTypeOf<{
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
      await provider.run.luma.agent.ray.v3p2.videoToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/luma/agent/ray/v3.2/video-to-video"
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
      "video_url",
      "user",
      "start_image_url",
      "resolution",
      "duration",
      "edit_strength",
      "auto_controls",
      "hdr",
      "exr_export",
      "controls",
      "keyframes",
      "keyframe_indexes",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing how to edit the source video."
    );
    expect(schema.shape.video_url.description).toBe(
      "URL of the source video to edit."
    );
    expect(schema.shape.user.description).toBe(
      "Optional opaque identifier for the end user making the request. Used only for abuse attribution; never interpreted by fal."
    );
    expect(schema.shape.start_image_url.description).toBe(
      "Optional URL of an image to use as the edited video's first frame — e.g. a restyled version of the source's opening frame to steer the look of the edit. Leave unset to let the model derive the first frame from the source video."
    );
    expect(schema.shape.resolution.description).toBe(
      "Resolution of the edited video. Higher resolutions cost more."
    );
    expect(schema.shape.duration.description).toBe(
      "Duration of the edited video."
    );
    expect(schema.shape.edit_strength.description).toBe(
      "How closely the edit preserves the source video. 'adhere_*' stays closest to the source, 'flex_*' is balanced, and 'reimagine_*' diverges most. Leave unset to use Luma's default. Cannot be combined with auto_controls."
    );
    expect(schema.shape.auto_controls.description).toBe(
      "Let the model derive the edit conditioning schedule from the source video. Cannot be combined with edit_strength."
    );
    expect(schema.shape.hdr.description).toBe(
      "Generate an HDR-encoded MP4. Requires HDR access on the account and a resolution of 720p or 1080p."
    );
    expect(schema.shape.exr_export.description).toBe(
      "Also export an EXR file alongside the MP4. Requires hdr=true and HDR access."
    );
    expect(schema.shape.controls.description).toBe(
      "Per-signal conditioning controls (pose, depth, normals, trajectory, face) for finer control than edit_strength. Cannot be combined with auto_controls."
    );
    expect(schema.shape.keyframes.description).toBe(
      "Multi-keyframe edit guide frames: up to 64 image URLs pinned at the source-frame positions given by keyframe_indexes. Mutually exclusive with start_image_url. Provide keyframes and keyframe_indexes together (same length)."
    );
    expect(schema.shape.keyframe_indexes.description).toBe(
      "Source-video frame positions where each keyframes[i] is anchored. Non-negative, unique, and the same length as keyframes."
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
    const without_video_url = { ...recorded } as Record<string, unknown>;
    delete without_video_url.video_url;
    expect(schema.safeParse(without_video_url).success).toBe(false);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(0) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(1) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(6000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(6001) })).toBe(false);
  });

  it("bounds video_url", () => {
    expect(accepts({ video_url: "x".repeat(0) })).toBe(false);
    expect(accepts({ video_url: "x".repeat(1) })).toBe(true);
  });

  it("accepts a null user", () => {
    expect(accepts({ user: null })).toBe(true);
  });

  it("accepts a null start_image_url", () => {
    expect(accepts({ start_image_url: null })).toBe(true);
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

  it("accepts the documented edit_strength values", () => {
    expect(accepts({ edit_strength: "adhere_1" })).toBe(true);
    expect(accepts({ edit_strength: "adhere_2" })).toBe(true);
    expect(accepts({ edit_strength: "adhere_3" })).toBe(true);
    expect(accepts({ edit_strength: "flex_1" })).toBe(true);
    expect(accepts({ edit_strength: "flex_2" })).toBe(true);
    expect(accepts({ edit_strength: "flex_3" })).toBe(true);
    expect(accepts({ edit_strength: "reimagine_1" })).toBe(true);
    expect(accepts({ edit_strength: "reimagine_2" })).toBe(true);
    expect(accepts({ edit_strength: "reimagine_3" })).toBe(true);
    expect(accepts({ edit_strength: "not-a-documented-value" })).toBe(false);
  });

  it("accepts a null edit_strength", () => {
    expect(accepts({ edit_strength: null })).toBe(true);
  });

  it("accepts a null controls", () => {
    expect(accepts({ controls: null })).toBe(true);
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
    expect(estimate.usd).toBeCloseTo(0.72, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("prices the published 10 second 540p package", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, duration: "10s" },
    });
    expect(estimate.usd).toBeCloseTo(1.44, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("warns when the card publishes no package", () => {
    for (const payload of [
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
      url: "https://fal.ai/models/luma/agent/ray/v3.2/video-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "ray32v"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Ray 3.2 Video"
    );
  });
});
