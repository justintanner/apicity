import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBriaFiboGen1p5TextToImageParsedRequest,
  type FalBriaFiboGen1p5TextToImageRequest,
  type FalBriaFiboGen1p5TextToImageRequestInput,
  type FalBriaFiboGen1p5TextToImageResponse,
  type FalRunBriaFiboGen1p5Namespace,
} from "@apicity/fal";
import {
  FalBriaFiboGen1p5TextToImageRequestSchema as schema,
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
// (sha256 d09a549c7740da5690caa8b876dd119bcd8b590d8adb4fb6f0caa896b52d3778).
const endpoint = "bria/fibo-gen-1.5/text-to-image";
const recorded = {
  prompt:
    "A weathered brown leather armchair in a sunlit study, cracked grain texture, soft afternoon light raking across the surface.",
} satisfies FalBriaFiboGen1p5TextToImageRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Bria Fibo Gen 1.5 text-to-image contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bria.fiboGen1p5.textToImage;
    expect(leaf).toBe(provider.post.run.bria.fiboGen1p5.textToImage);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.bria.fiboGen1p5
    ).toEqualTypeOf<FalRunBriaFiboGen1p5Namespace>();
    expectTypeOf<FalBriaFiboGen1p5TextToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBriaFiboGen1p5TextToImageRequestInput>().toEqualTypeOf<FalBriaFiboGen1p5TextToImageRequest>();
    expectTypeOf<FalBriaFiboGen1p5TextToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalBriaFiboGen1p5TextToImageResponse>().toEqualTypeOf<{
      image: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      };
      images?: Array<Record<string, unknown>>;
      structured_prompt: Record<string, unknown>;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ image: { url: "https://example.com/out.bin" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.bria.fiboGen1p5.textToImage(recorded);
    expect(result.image.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/bria/fibo-gen-1.5/text-to-image");
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
      "structured_prompt",
      "seed",
      "aspect_ratio",
      "resolution",
      "sync_mode",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Prompt for image generation."
    );
    expect(schema.shape.structured_prompt.description).toBe(
      "The structured prompt to generate an image from."
    );
    expect(schema.shape.seed.description).toBe(
      "Random seed for reproducibility."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      "Aspect ratio. Options: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9"
    );
    expect(schema.shape.resolution.description).toBe("Output image resolution");
    expect(schema.shape.sync_mode.description).toBe(
      "If true, returns the image directly in the response (increases latency)."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("accepts an empty body and fills documented defaults", () => {
    expect(schema.parse({})).toEqual({
      aspect_ratio: "1:1",
      sync_mode: false,
      seed: 5555,
      resolution: "1MP",
    });
  });

  it("accepts a null prompt", () => {
    expect(accepts({ prompt: null })).toBe(true);
  });

  it("accepts a null structured_prompt", () => {
    expect(accepts({ structured_prompt: null })).toBe(true);
  });

  it("accepts the documented aspect_ratio values", () => {
    expect(accepts({ aspect_ratio: "1:1" })).toBe(true);
    expect(accepts({ aspect_ratio: "2:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:2" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:5" })).toBe(true);
    expect(accepts({ aspect_ratio: "5:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
    expect(accepts({ aspect_ratio: null })).toBe(false);
  });

  it("accepts the documented resolution values", () => {
    expect(accepts({ resolution: "1MP" })).toBe(true);
    expect(accepts({ resolution: "4MP" })).toBe(true);
    expect(accepts({ resolution: "not-a-documented-value" })).toBe(false);
    expect(accepts({ resolution: null })).toBe(false);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.04, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/bria/fibo-gen-1.5/text-to-image",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "briafibogen"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Bria Fibo Gen 1.5"
    );
  });
});
