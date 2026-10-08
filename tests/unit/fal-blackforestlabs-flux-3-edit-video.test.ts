import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBlackforestlabsFlux3EditVideoParsedRequest,
  type FalBlackforestlabsFlux3EditVideoRequest,
  type FalBlackforestlabsFlux3EditVideoRequestInput,
  type FalBlackforestlabsFlux3EditVideoResponse,
  type FalRunFlux3Namespace,
} from "@apicity/fal";
import {
  FalBlackforestlabsFlux3EditVideoRequestSchema as schema,
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
// (sha256 15115befba2212917f30e6792e1216e68c97023871654b7ac26f337d6fbe2752).
const endpoint = "blackforestlabs/flux-3/edit-video";
const recorded = {
  prompt: "Make it snow heavily; give the scene a cold winter palette.",
  video_url:
    "https://storage.googleapis.com/falserverless/example_inputs/flux-3-red-panda.mp4",
} satisfies FalBlackforestlabsFlux3EditVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FLUX 3 edit-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.blackforestlabs.flux3.editVideo;
    expect(leaf).toBe(provider.post.run.blackforestlabs.flux3.editVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.blackforestlabs.flux3
    ).toEqualTypeOf<FalRunFlux3Namespace>();
    expectTypeOf<FalBlackforestlabsFlux3EditVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBlackforestlabsFlux3EditVideoRequestInput>().toEqualTypeOf<FalBlackforestlabsFlux3EditVideoRequest>();
    expectTypeOf<FalBlackforestlabsFlux3EditVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalBlackforestlabsFlux3EditVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
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
    const result = await provider.run.blackforestlabs.flux3.editVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/blackforestlabs/flux-3/edit-video"
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
      "safety_tolerance",
      "video_url",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The text prompt describing how to change the input video. The clip is re-rendered preserving motion, timing, and framing."
    );
    expect(schema.shape.safety_tolerance.description).toBe(
      "The safety tolerance level for the generated video. 0 is the strictest and 4 is the most permissive."
    );
    expect(schema.shape.video_url.description).toBe(
      "URL of the input video. MP4, under 50 MB and under 15 seconds."
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
    expect(accepts({ prompt: "x".repeat(4096) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(4097) })).toBe(false);
  });

  it("bounds the safety_tolerance number", () => {
    expect(accepts({ safety_tolerance: 0 })).toBe(true);
    expect(accepts({ safety_tolerance: -1 })).toBe(false);
    expect(accepts({ safety_tolerance: 4 })).toBe(true);
    expect(accepts({ safety_tolerance: 5 })).toBe(false);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
      costHints: { durationSeconds: 10 },
    });
    expect(estimate.usd).toBeCloseTo(0.3, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("requires a duration hint when the payload has no length", () => {
    const missing = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(missing.usd).toBe(0);
    expect(missing.warnings.join(" ")).toContain("costHints.durationSeconds");
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/blackforestlabs/flux-3/edit-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("flux3");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "FLUX 3"
    );
  });
});
