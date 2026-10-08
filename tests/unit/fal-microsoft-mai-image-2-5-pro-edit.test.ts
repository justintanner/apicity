import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMicrosoftMaiImage2p5ProEditParsedRequest,
  type FalMicrosoftMaiImage2p5ProEditRequest,
  type FalMicrosoftMaiImage2p5ProEditRequestInput,
  type FalMicrosoftMaiImage2p5ProEditResponse,
  type FalRunMicrosoftMaiImage2p5ProNamespace,
} from "@apicity/fal";
import {
  FalMicrosoftMaiImage2p5ProEditRequestSchema as schema,
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
// (sha256 39588aa3f4029718ccbd21956ceac6aad20cb2fafcc70280100476c18fea407f).
const endpoint = "microsoft/mai-image-2.5-pro/edit";
const recorded = {
  prompt: "A red balloon.",
  image_url:
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
} satisfies FalMicrosoftMaiImage2p5ProEditRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MAI Image 2.5 Pro edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.microsoft.maiImage2p5Pro.edit;
    expect(leaf).toBe(provider.post.run.microsoft.maiImage2p5Pro.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.microsoft.maiImage2p5Pro
    ).toEqualTypeOf<FalRunMicrosoftMaiImage2p5ProNamespace>();
    expectTypeOf<FalMicrosoftMaiImage2p5ProEditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMicrosoftMaiImage2p5ProEditRequestInput>().toEqualTypeOf<FalMicrosoftMaiImage2p5ProEditRequest>();
    expectTypeOf<FalMicrosoftMaiImage2p5ProEditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMicrosoftMaiImage2p5ProEditResponse>().toEqualTypeOf<{
      images: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }>;
      description: string;
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
    const result = await provider.run.microsoft.maiImage2p5Pro.edit(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/microsoft/mai-image-2.5-pro/edit"
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
      "num_images",
      "aspect_ratio",
      "output_format",
      "sync_mode",
      "image_url",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The instruction describing how to edit the input image(s)."
    );
    expect(schema.shape.num_images.description).toBe(
      "The number of images to generate."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      'The aspect ratio of the generated image. Use "auto" to match the input or let the model decide.'
    );
    expect(schema.shape.output_format.description).toBe(
      "The format of the generated image."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the media will be returned as a data URI and the output data won't be available in the request history."
    );
    expect(schema.shape.image_url.description).toBe(
      "The URL of the image to edit. Provide one http(s) or data: URL."
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
    expect(accepts({ prompt: "x".repeat(2) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(3) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(5000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(5001) })).toBe(false);
  });

  it("bounds the num_images number", () => {
    expect(accepts({ num_images: 1 })).toBe(true);
    expect(accepts({ num_images: 0 })).toBe(false);
    expect(accepts({ num_images: 4 })).toBe(true);
    expect(accepts({ num_images: 5 })).toBe(false);
  });

  it("accepts the documented aspect_ratio values", () => {
    expect(accepts({ aspect_ratio: "auto" })).toBe(true);
    expect(accepts({ aspect_ratio: "1:1" })).toBe(true);
    expect(accepts({ aspect_ratio: "4:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:4" })).toBe(true);
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "9:16" })).toBe(true);
    expect(accepts({ aspect_ratio: "3:2" })).toBe(true);
    expect(accepts({ aspect_ratio: "2:3" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
    expect(accepts({ aspect_ratio: null })).toBe(false);
  });

  it("accepts the documented output_format values", () => {
    expect(accepts({ output_format: "jpeg" })).toBe(true);
    expect(accepts({ output_format: "png" })).toBe(true);
    expect(accepts({ output_format: "webp" })).toBe(true);
    expect(accepts({ output_format: "not-a-documented-value" })).toBe(false);
    expect(accepts({ output_format: null })).toBe(false);
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
