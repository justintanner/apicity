import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalLumaAgentRayV3p2ReframeParsedRequest,
  type FalLumaAgentRayV3p2ReframeRequest,
  type FalLumaAgentRayV3p2ReframeRequestInput,
  type FalLumaAgentRayV3p2ReframeResponse,
  type FalRunLumaAgentRayV3p2Namespace,
} from "@apicity/fal";
import {
  FalLumaAgentRayV3p2ReframeRequestSchema as schema,
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
// (sha256 6b7fbb43e98d0206bcaffe7046e871a54a8b5e37b63a1264fe03e34b902bb335).
const endpoint = "luma/agent/ray/v3.2/reframe";
const recorded = {
  prompt:
    "Extend the scene into cinematic widescreen with matching lighting and background detail.",
  video_url:
    "https://storage.googleapis.com/falserverless/example_inputs/birefnet-video-input.mp4",
  aspect_ratio: "21:9",
  resolution: "540p",
  duration: "5s",
} satisfies FalLumaAgentRayV3p2ReframeRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Ray 3.2 reframe contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.luma.agent.ray.v3p2.reframe;
    expect(leaf).toBe(provider.post.run.luma.agent.ray.v3p2.reframe);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.luma.agent.ray.v3p2
    ).toEqualTypeOf<FalRunLumaAgentRayV3p2Namespace>();
    expectTypeOf<FalLumaAgentRayV3p2ReframeRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2ReframeRequestInput>().toEqualTypeOf<FalLumaAgentRayV3p2ReframeRequest>();
    expectTypeOf<FalLumaAgentRayV3p2ReframeParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2ReframeResponse>().toEqualTypeOf<{
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
    const result = await provider.run.luma.agent.ray.v3p2.reframe(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/luma/agent/ray/v3.2/reframe");
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
      "aspect_ratio",
      "resolution",
      "duration",
      "source_position",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing the content to paint into the newly exposed canvas area when reframing to the target aspect ratio."
    );
    expect(schema.shape.video_url.description).toBe(
      "URL of the source video to reframe (must be 10 seconds or less)."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "Target aspect ratio for the reframed video."
    );
    expect(schema.shape.resolution.description).toBe(
      "Resolution of the reframed video. Higher resolutions cost more."
    );
    expect(schema.shape.duration.description).toBe(
      "Duration of the reframed video. Defaults to matching the source video's duration; set explicitly to 5s or 10s to override."
    );
    expect(schema.shape.source_position.description).toBe(
      "Optional normalized source rectangle controlling where the source video sits in the output canvas."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_aspect_ratio = { ...recorded } as Record<string, unknown>;
    delete without_aspect_ratio.aspect_ratio;
    expect(schema.safeParse(without_aspect_ratio).success).toBe(false);
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
  });

  it("accepts a null duration", () => {
    expect(accepts({ duration: null })).toBe(true);
  });

  it("accepts a null source_position", () => {
    expect(accepts({ source_position: null })).toBe(true);
  });

  it("is dynamically priced and has no static slug", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect(
      (MODEL_DISPLAY.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings[0]).toContain("models/pricing/estimate");
  });
});
