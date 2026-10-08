import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalLumaAgentRayV3p2TextToVideoParsedRequest,
  type FalLumaAgentRayV3p2TextToVideoRequest,
  type FalLumaAgentRayV3p2TextToVideoRequestInput,
  type FalLumaAgentRayV3p2TextToVideoResponse,
  type FalRunLumaAgentRayV3p2Namespace,
} from "@apicity/fal";
import {
  FalLumaAgentRayV3p2TextToVideoRequestSchema as schema,
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
// (sha256 1b65c2b603474ce4cb84c9b680a6b5d374187e871ea347c5526ec5e9ac11e5e1).
const endpoint = "luma/agent/ray/v3.2/text-to-video";
const recorded = {
  prompt:
    "A herd of wild horses galloping across a dusty desert plain under a blazing midday sun, their manes flying in the wind; wide tracking shot.",
  duration: "5s",
  resolution: "540p",
} satisfies FalLumaAgentRayV3p2TextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Ray 3.2 text-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.luma.agent.ray.v3p2.textToVideo;
    expect(leaf).toBe(provider.post.run.luma.agent.ray.v3p2.textToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.luma.agent.ray.v3p2
    ).toEqualTypeOf<FalRunLumaAgentRayV3p2Namespace>();
    expectTypeOf<FalLumaAgentRayV3p2TextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2TextToVideoRequestInput>().toEqualTypeOf<FalLumaAgentRayV3p2TextToVideoRequest>();
    expectTypeOf<FalLumaAgentRayV3p2TextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalLumaAgentRayV3p2TextToVideoResponse>().toEqualTypeOf<{
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
    const result = await provider.run.luma.agent.ray.v3p2.textToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/luma/agent/ray/v3.2/text-to-video"
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
      "aspect_ratio",
      "resolution",
      "duration",
      "loop",
      "hdr",
      "exr_export",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing the video to generate."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "Aspect ratio of the generated video."
    );
    expect(schema.shape.resolution.description).toBe(
      "Resolution of the generated video. Higher resolutions cost more."
    );
    expect(schema.shape.duration.description).toBe(
      "Duration of the generated video."
    );
    expect(schema.shape.loop.description).toBe(
      "Generate a seamless loop. Only valid for 5s, standard-dynamic-range generations without an end frame."
    );
    expect(schema.shape.hdr.description).toBe(
      "Generate an HDR-encoded MP4. Requires HDR access on the account and a resolution of 720p or 1080p; not supported with 10s or loop."
    );
    expect(schema.shape.exr_export.description).toBe(
      "Also export an EXR file alongside the MP4. Requires hdr=true and HDR access."
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
