import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKlingV4ImageToImageParsedRequest,
  type FalKlingV4ImageToImageRequest,
  type FalKlingV4ImageToImageRequestInput,
  type FalKlingV4ImageToImageResponse,
} from "@apicity/fal";
import {
  FalKlingV4ImageToImageRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  falDynamicBilledUnit,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-11-20
// (sha256 15c4978af1d2649f0bd7a10ea685c2bab1223116df919226194a23eb29708990).
const endpoint = "kling/v4/image-to-image";
const image = "https://example.com/cat.jpg";
const recorded = {
  prompt: "Add a small red bow tie to the cat in @Image1.",
  image_urls: [image],
} satisfies FalKlingV4ImageToImageRequest;

const element = {
  frontal_image_url: "https://example.com/front.jpg",
  reference_image_urls: ["https://example.com/side.jpg"],
};

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("Kling Image 4.0 image-to-image contract", () => {
  it("adds imageToImage on the existing kling.v4 object", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kling.v4.imageToImage;
    expect(typeof provider.run.kling.v4).toBe("object");
    expect(provider.run.kling.v4).toHaveProperty("imageToImage", leaf);
    expect(provider.run.kling.v4).toHaveProperty("imageToVideo");
    expect(provider.run.kling.v4).toHaveProperty("textToVideo");
    expect(leaf).toBe(provider.post.run.kling.v4.imageToImage);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalKlingV4ImageToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKlingV4ImageToImageRequestInput>().toEqualTypeOf<FalKlingV4ImageToImageRequest>();
    expectTypeOf<FalKlingV4ImageToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKlingV4ImageToImageResponse>().toEqualTypeOf<{
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
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ images: [{ url: image }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.kling.v4.imageToImage(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/kling/v4/image-to-image");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_urls",
      "elements",
      "result_type",
      "num_images",
      "series_amount",
      "resolution",
      "aspect_ratio",
      "sync_mode",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      result_type: "single",
      num_images: 1,
      series_amount: 4,
      resolution: "2K",
      aspect_ratio: "auto",
      sync_mode: false,
    });
  });

  it("accepts the documented image input and rejects the published bounds", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: "x".repeat(50000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(50001) })).toBe(false);
    expect(accepts({ image_urls: [] })).toBe(false);
    expect(accepts({ image_urls: Array(10).fill(image) })).toBe(true);
    expect(accepts({ image_urls: Array(11).fill(image) })).toBe(false);
    expect(accepts({ image_urls: ["not a url"] })).toBe(false);
    expect(accepts({ image_urls: ["data:image/jpeg;base64,abc"] })).toBe(true);
    expect(accepts({ elements: null })).toBe(true);
    expect(accepts({ elements: [] })).toBe(true);
    expect(accepts({ elements: [element] })).toBe(true);
    expect(accepts({ elements: [{ ...element, foo: 1 }] })).toBe(true);
    expect(
      accepts({ elements: [{ ...element, reference_image_urls: [] }] })
    ).toBe(false);
    expect(
      accepts({
        elements: [
          {
            ...element,
            reference_image_urls: Array(4).fill("https://example.com/side.jpg"),
          },
        ],
      })
    ).toBe(false);
    expect(accepts({ elements: Array(7).fill(element) })).toBe(true);
    expect(accepts({ elements: Array(8).fill(element) })).toBe(false);
    expect(accepts({ elements: [{ frontal_image_url: image }] })).toBe(false);
    expect(accepts({ num_images: 1 })).toBe(true);
    expect(accepts({ num_images: 9 })).toBe(true);
    expect(accepts({ num_images: 0 })).toBe(false);
    expect(accepts({ num_images: 10 })).toBe(false);
    expect(accepts({ series_amount: 2 })).toBe(true);
    expect(accepts({ series_amount: 10 })).toBe(true);
    expect(accepts({ series_amount: "auto" })).toBe(true);
    expect(accepts({ series_amount: 1 })).toBe(false);
    expect(accepts({ series_amount: 11 })).toBe(false);
    expect(accepts({ series_amount: "AUTO" })).toBe(false);
    expect(accepts({ resolution: "2K" })).toBe(true);
    expect(accepts({ resolution: "4K" })).toBe(true);
    expect(accepts({ resolution: "8K" })).toBe(true);
    expect(accepts({ resolution: "1K" })).toBe(false);
    expect(accepts({ aspect_ratio: "21:9" })).toBe(true);
    expect(accepts({ aspect_ratio: "5:4" })).toBe(false);
    expect(accepts({ result_type: "single" })).toBe(true);
    expect(accepts({ result_type: "series" })).toBe(true);
    expect(accepts({ result_type: "batch" })).toBe(false);
    expect(accepts({ sync_mode: true })).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: one 2K image billed 1.0476 units", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Kling 4.0 Image"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe("units at $0.063");
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain("units at $0.063");
    expect(estimate.warnings[0]).toContain("x-fal-billable-units");
  });
});
