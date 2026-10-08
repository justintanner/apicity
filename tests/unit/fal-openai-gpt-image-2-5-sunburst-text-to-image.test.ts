import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalOpenaiGptImage2p5SunburstTextToImageParsedRequest,
  type FalOpenaiGptImage2p5SunburstTextToImageRequest,
  type FalOpenaiGptImage2p5SunburstTextToImageRequestInput,
  type FalOpenaiGptImage2p5SunburstTextToImageResponse,
  type FalRunOpenaiGptImage2p5SunburstNamespace,
} from "@apicity/fal";
import {
  FalOpenaiGptImage2p5SunburstTextToImageRequestSchema as schema,
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
// (sha256 5721d6ddae78788031890764b6f1fc75136c39ab7b6c906c277e3e7d6e5d40cc).
const endpoint = "openai/gpt-image-2.5/sunburst/text-to-image";
const recorded = {
  prompt: "A red balloon.",
  quality: "low",
} satisfies FalOpenaiGptImage2p5SunburstTextToImageRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GPT Image 2.5 Sunburst text-to-image contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.openai.gptImage2p5.sunburst.textToImage;
    expect(leaf).toBe(
      provider.post.run.openai.gptImage2p5.sunburst.textToImage
    );
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.openai.gptImage2p5.sunburst
    ).toEqualTypeOf<FalRunOpenaiGptImage2p5SunburstNamespace>();
    expectTypeOf<FalOpenaiGptImage2p5SunburstTextToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalOpenaiGptImage2p5SunburstTextToImageRequestInput>().toEqualTypeOf<FalOpenaiGptImage2p5SunburstTextToImageRequest>();
    expectTypeOf<FalOpenaiGptImage2p5SunburstTextToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalOpenaiGptImage2p5SunburstTextToImageResponse>().toEqualTypeOf<{
      images: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }>;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ images: [{ url: "https://example.com/out.bin" }] })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.openai.gptImage2p5.sunburst.textToImage(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/openai/gpt-image-2.5/sunburst/text-to-image"
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
      "image_size",
      "background",
      "quality",
      "num_images",
      "output_format",
      "output_compression",
      "sync_mode",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The prompt for image generation"
    );
    expect(schema.shape.image_size.description).toBe(
      "The size of the generated image. Supports preset names, explicit {width, height}, or 'auto' to let the model pick the best size. Concrete sizes must have both dimensions as multiples of 16, max edge 3840px, aspect ratio <= 3:1, total pixels between 655,360 and 8,294,400."
    );
    expect(schema.shape.background.description).toBe(
      "Background for the generated image"
    );
    expect(schema.shape.quality.description).toBe(
      "Quality for the generated image. Higher settings increase detail, latency, and token usage. Use 'auto' to let the model choose."
    );
    expect(schema.shape.num_images.description).toBe(
      "Number of images to generate"
    );
    expect(schema.shape.output_format.description).toBe(
      "Output format for the images"
    );
    expect(schema.shape.output_compression.description).toBe(
      "Compression level from 0 to 100. Only supported when output_format is 'jpeg' or 'webp'."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the media will be returned as a data URI and the output data won't be available in the request history."
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
    expect(accepts({ prompt: "x".repeat(32000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(32001) })).toBe(false);
  });

  it("accepts the documented background values", () => {
    expect(accepts({ background: "auto" })).toBe(true);
    expect(accepts({ background: "transparent" })).toBe(true);
    expect(accepts({ background: "opaque" })).toBe(true);
    expect(accepts({ background: "not-a-documented-value" })).toBe(false);
    expect(accepts({ background: null })).toBe(false);
  });

  it("accepts the documented quality values", () => {
    expect(accepts({ quality: "auto" })).toBe(true);
    expect(accepts({ quality: "low" })).toBe(true);
    expect(accepts({ quality: "medium" })).toBe(true);
    expect(accepts({ quality: "high" })).toBe(true);
    expect(accepts({ quality: "xhigh" })).toBe(true);
    expect(accepts({ quality: "max" })).toBe(true);
    expect(accepts({ quality: "not-a-documented-value" })).toBe(false);
    expect(accepts({ quality: null })).toBe(false);
  });

  it("bounds the num_images number", () => {
    expect(accepts({ num_images: 1 })).toBe(true);
    expect(accepts({ num_images: 0 })).toBe(false);
    expect(accepts({ num_images: 10 })).toBe(true);
    expect(accepts({ num_images: 11 })).toBe(false);
  });

  it("accepts the documented output_format values", () => {
    expect(accepts({ output_format: "jpeg" })).toBe(true);
    expect(accepts({ output_format: "png" })).toBe(true);
    expect(accepts({ output_format: "webp" })).toBe(true);
    expect(accepts({ output_format: "not-a-documented-value" })).toBe(false);
    expect(accepts({ output_format: null })).toBe(false);
  });

  it("accepts a null output_compression", () => {
    expect(accepts({ output_compression: null })).toBe(true);
  });

  it("bounds the output_compression number", () => {
    expect(accepts({ output_compression: 0 })).toBe(true);
    expect(accepts({ output_compression: -1 })).toBe(false);
    expect(accepts({ output_compression: 100 })).toBe(true);
    expect(accepts({ output_compression: 101 })).toBe(false);
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
