import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalOpenaiGptImage2p6FlareTextToImageParsedRequest,
  type FalOpenaiGptImage2p6FlareTextToImageRequest,
  type FalOpenaiGptImage2p6FlareTextToImageRequestInput,
  type FalOpenaiGptImage2p6FlareTextToImageResponse,
  type FalRunOpenaiGptImage2p6FlareNamespace,
} from "@apicity/fal";
import {
  FalOpenaiGptImage2p6FlareTextToImageRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-11-11
// (sha256 7ac322e36a1a1436dd6505924977f3c9369c913b8a18bc292d95bc0cc04e2c49).
const endpoint = "openai/gpt-image-2.6/flare/text-to-image";
const recorded = {
  prompt: "A red balloon.",
  quality: "low",
  reasoning_effort: "low",
  image_size: "square",
  num_images: 1,
  output_format: "jpeg",
} satisfies FalOpenaiGptImage2p6FlareTextToImageRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GPT Image 2.6 Flare text-to-image contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.openai.gptImage2p6.flare.textToImage;
    expect(leaf).toBe(provider.post.run.openai.gptImage2p6.flare.textToImage);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.openai.gptImage2p6.flare
    ).toEqualTypeOf<FalRunOpenaiGptImage2p6FlareNamespace>();
    expectTypeOf<FalOpenaiGptImage2p6FlareTextToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalOpenaiGptImage2p6FlareTextToImageRequestInput>().toEqualTypeOf<FalOpenaiGptImage2p6FlareTextToImageRequest>();
    expectTypeOf<FalOpenaiGptImage2p6FlareTextToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalOpenaiGptImage2p6FlareTextToImageResponse>().toEqualTypeOf<{
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
      await provider.run.openai.gptImage2p6.flare.textToImage(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/openai/gpt-image-2.6/flare/text-to-image"
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
      "reasoning_effort",
      "num_images",
      "output_format",
      "output_compression",
      "frame_count",
      "frame_duration_ms",
      "svg_model",
      "sync_mode",
      "enable_safety_checker",
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
      "Rendering quality for the generated image. For SVG output it controls the reference image used to create the vector."
    );
    expect(schema.shape.reasoning_effort.description).toBe(
      "How much the model plans before rendering, independently of quality (OpenAI `complexity`). Higher levels can help with dense text and complex layouts but add latency."
    );
    expect(schema.shape.num_images.description).toBe(
      "Number of images to generate. Must be 1 for SVG output. For GIF output, all frames of all outputs share the request's pixel budget."
    );
    expect(schema.shape.output_format.description).toBe(
      "Output format for the images. 'gif' returns an animation and 'svg' a vector image."
    );
    expect(schema.shape.output_compression.description).toBe(
      "Compression level from 0 to 100. Only supported when output_format is 'jpeg' or 'webp'."
    );
    expect(schema.shape.frame_count.description).toBe(
      "GIF only: number of frames. image_size applies to each frame; reduce size or count if the request exceeds the pixel budget."
    );
    expect(schema.shape.frame_duration_ms.description).toBe(
      "GIF only: milliseconds per frame, rounded to 10 ms."
    );
    expect(schema.shape.svg_model.description).toBe(
      "SVG only: the model that converts the generated reference image into vector paths. Larger models produce more accurate shapes."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the media will be returned as a data URI and the output data won't be available in the request history."
    );
    expect(schema.shape.enable_safety_checker.description).toBe(
      "Authorized callers may set false to request relaxed screening."
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
    expect(accepts({ output_format: "gif" })).toBe(true);
    expect(accepts({ output_format: "svg" })).toBe(true);
    expect(accepts({ output_format: "not-a-documented-value" })).toBe(false);
    expect(accepts({ output_format: null })).toBe(false);
  });

  it("accepts the documented reasoning_effort values", () => {
    expect(accepts({ reasoning_effort: "low" })).toBe(true);
    expect(accepts({ reasoning_effort: "medium" })).toBe(true);
    expect(accepts({ reasoning_effort: "high" })).toBe(true);
    expect(accepts({ reasoning_effort: "max" })).toBe(false);
    expect(schema.parse({ prompt: "x" }).reasoning_effort).toBe("high");
  });

  it("accepts gif and svg output with their frame and svg_model knobs", () => {
    expect(accepts({ output_format: "gif" })).toBe(true);
    expect(accepts({ output_format: "svg" })).toBe(true);
    expect(accepts({ frame_count: 1 })).toBe(false);
    expect(accepts({ frame_count: 2 })).toBe(true);
    expect(accepts({ frame_count: 16 })).toBe(true);
    expect(accepts({ frame_count: 17 })).toBe(false);
    expect(accepts({ frame_duration_ms: 19 })).toBe(false);
    expect(accepts({ frame_duration_ms: 20 })).toBe(true);
    expect(accepts({ frame_duration_ms: 2000 })).toBe(true);
    expect(accepts({ frame_duration_ms: 2001 })).toBe(false);
    for (const svg_model of [
      "gpt-6-astra",
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.6-terra",
      "gpt-6-luna",
      "gpt-6-sol",
    ])
      expect(accepts({ svg_model }), svg_model).toBe(true);
    // Model ids stay open to the gpt-<version>[-<name>] grammar.
    expect(accepts({ svg_model: "gpt-6.1-nova" })).toBe(true);
    expect(accepts({ svg_model: "claude-opus" })).toBe(false);
    expect(schema.parse({ prompt: "x" })).toMatchObject({
      frame_count: 9,
      frame_duration_ms: 200,
      svg_model: "gpt-6-astra",
      enable_safety_checker: true,
    });
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
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "GPT Image 2.6 Flare"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings[0]).toContain("models/pricing/estimate");
  });
});
