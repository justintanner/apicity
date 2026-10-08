import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKlingVideoV3TurboStandardTextToVideoParsedRequest,
  type FalKlingVideoV3TurboStandardTextToVideoRequest,
  type FalKlingVideoV3TurboStandardTextToVideoRequestInput,
  type FalKlingVideoV3TurboStandardTextToVideoResponse,
  type FalRunKlingVideoV3TurboStandardNamespace,
} from "@apicity/fal";
import {
  FalKlingVideoV3TurboStandardTextToVideoRequestSchema as schema,
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
// (sha256 bfc28f267f80d27856a8d98a21988eefe395216750e988e53d9fe649ee4fc7fd).
const endpoint = "fal-ai/kling-video/v3/turbo/standard/text-to-video";
const recorded = {
  prompt: "A lioness and her cubs in warm grass, camera drifting closer.",
  duration: "3",
  aspect_ratio: "16:9",
} satisfies FalKlingVideoV3TurboStandardTextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Kling v3 Turbo Standard text-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.klingVideo.v3.turbo.standard.textToVideo;
    expect(leaf).toBe(
      provider.post.run.klingVideo.v3.turbo.standard.textToVideo
    );
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.klingVideo.v3.turbo.standard
    ).toEqualTypeOf<FalRunKlingVideoV3TurboStandardNamespace>();
    expectTypeOf<FalKlingVideoV3TurboStandardTextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKlingVideoV3TurboStandardTextToVideoRequestInput>().toEqualTypeOf<FalKlingVideoV3TurboStandardTextToVideoRequest>();
    expectTypeOf<FalKlingVideoV3TurboStandardTextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKlingVideoV3TurboStandardTextToVideoResponse>().toEqualTypeOf<{
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
        jsonResponse({ video: { url: "https://example.com/out.bin" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.klingVideo.v3.turbo.standard.textToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/kling-video/v3/turbo/standard/text-to-video"
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
      "multi_prompt",
      "aspect_ratio",
      "duration",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt to generate the video with. For best results keep the prompt under 2500 characters. Mutually exclusive with `multi_prompt`."
    );
    expect(schema.shape.multi_prompt.description).toBe(
      "Multi-shot storyboard (1-6 shots). Each shot has its own prompt and duration; the total duration must not exceed 15s. Mutually exclusive with `prompt`."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "The aspect ratio (width:height) of the generated video."
    );
    expect(schema.shape.duration.description).toBe("Video length in seconds.");
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("accepts an empty body and fills documented defaults", () => {
    expect(schema.parse({})).toEqual({ aspect_ratio: "16:9", duration: "5" });
  });

  it("accepts a null prompt", () => {
    expect(accepts({ prompt: null })).toBe(true);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(3072) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(3073) })).toBe(false);
  });

  it("accepts a null multi_prompt", () => {
    expect(accepts({ multi_prompt: null })).toBe(true);
  });

  it("accepts the documented aspect_ratio values", () => {
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "1:1" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
    expect(accepts({ aspect_ratio: null })).toBe(false);
  });

  it("accepts the documented duration values", () => {
    expect(accepts({ duration: "3" })).toBe(true);
    expect(accepts({ duration: "4" })).toBe(true);
    expect(accepts({ duration: "5" })).toBe(true);
    expect(accepts({ duration: "6" })).toBe(true);
    expect(accepts({ duration: "7" })).toBe(true);
    expect(accepts({ duration: "8" })).toBe(true);
    expect(accepts({ duration: "9" })).toBe(true);
    expect(accepts({ duration: "10" })).toBe(true);
    expect(accepts({ duration: "11" })).toBe(true);
    expect(accepts({ duration: "12" })).toBe(true);
    expect(accepts({ duration: "13" })).toBe(true);
    expect(accepts({ duration: "14" })).toBe(true);
    expect(accepts({ duration: "15" })).toBe(true);
    expect(accepts({ duration: "not-a-documented-value" })).toBe(false);
    expect(accepts({ duration: null })).toBe(false);
  });

  it("rejects mutually exclusive fields", () => {
    expect(
      schema.safeParse({
        ...recorded,
        prompt: "shot",
        multi_prompt: [{ prompt: "shot" }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...recorded,
        prompt: null,
        multi_prompt: [{ prompt: "shot" }],
      }).success
    ).toBe(true);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.336);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/fal-ai/kling-video/v3/turbo/standard/text-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "kling3ts"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Kling v3 Turbo Standard"
    );
  });
});
