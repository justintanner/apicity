import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMetaMuseImageEditParsedRequest,
  type FalMetaMuseImageEditRequest,
  type FalMetaMuseImageEditRequestInput,
  type FalMetaMuseImageEditResponse,
  type FalRunMetaMuseImageNamespace,
} from "@apicity/fal";
import {
  FalMetaMuseImageEditRequestSchema as schema,
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
// (sha256 17c4f7963251d25af485098d771d5a8c9f3f6942db30fd42d05dfeddb3412422).
const endpoint = "meta/muse-image/edit";
const recorded = {
  prompt:
    "A cinematic editorial portrait in soft window light with crisp typography",
  image_urls: [
    "https://storage.googleapis.com/falserverless/example_inputs/kontext_example_input.webp",
  ],
} satisfies FalMetaMuseImageEditRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Muse Image edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.meta.museImage.edit;
    expect(leaf).toBe(provider.post.run.meta.museImage.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.meta.museImage
    ).toEqualTypeOf<FalRunMetaMuseImageNamespace>();
    expectTypeOf<FalMetaMuseImageEditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMetaMuseImageEditRequestInput>().toEqualTypeOf<FalMetaMuseImageEditRequest>();
    expectTypeOf<FalMetaMuseImageEditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMetaMuseImageEditResponse>().toEqualTypeOf<{
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
    const result = await provider.run.meta.museImage.edit(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/meta/muse-image/edit");
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
      "image_urls",
      "aspect_ratio",
      "num_images",
      "output_format",
      "sync_mode",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The text prompt used to generate or edit the image."
    );
    expect(schema.shape.image_urls.description).toBe(
      "Reference images used for the edit. Provide between 1 and 10 HTTP(S) or data URLs."
    );
    expect(schema.shape.aspect_ratio.description).toBe(
      'Any custom output aspect ratio as "width:height", for example "16:9", "5:4", or "1920:1200". Common presets are "21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21". The ratio must be between 1:16 and 16:1, the range Muse supports. Only the ratio is used: Muse renders it at its own fixed resolution of roughly 2.5 megapixels, so "1920:1200" and "960:600" both return the same 1920x1200 image. If omitted, Muse chooses the output dimensions automatically.'
    );
    expect(schema.shape.num_images.description).toBe(
      "The number of edited images to generate."
    );
    expect(schema.shape.output_format.description).toBe(
      "The format of the generated image."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the image is returned as a data URI and is not persisted in the request history."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_image_urls = { ...recorded } as Record<string, unknown>;
    delete without_image_urls.image_urls;
    expect(schema.safeParse(without_image_urls).success).toBe(false);
    const without_prompt = { ...recorded } as Record<string, unknown>;
    delete without_prompt.prompt;
    expect(schema.safeParse(without_prompt).success).toBe(false);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(0) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(1) })).toBe(true);
  });

  it("accepts a null aspect_ratio", () => {
    expect(accepts({ aspect_ratio: null })).toBe(true);
  });

  it("matches the documented aspect_ratio pattern", () => {
    expect(accepts({ aspect_ratio: "16:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "not-a-documented-value" })).toBe(false);
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

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.01, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/meta/muse-image/edit",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("muse");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Muse Image Edit"
    );
  });
});
