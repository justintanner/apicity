import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKreaV3EditParsedRequest,
  type FalKreaV3EditRequest,
  type FalKreaV3EditRequestInput,
  type FalKreaV3EditResponse,
  type FalRunKreaNamespace,
  type FalRunKreaV3Namespace,
} from "@apicity/fal";
import {
  FalKreaV3EditRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-29
// (sha256 5fc40fc471b2be4960ee54eed8fd5993545f9d41096dbe9d83ef61518a74e913).
const endpoint = "krea/v3/edit";
const recorded = {
  prompt: "Keep the cat and soften the background",
  image_urls: ["https://example.com/cat.jpg"],
  image_size: { width: 1024, height: 1024 },
  reasoning_level: "low",
} satisfies FalKreaV3EditRequest;

const referenceWarning =
  "fal 'krea/v3/edit': each reference is counted at the output size (1 megapixels). A smaller reference bills less; a larger one is capped at the output size.";

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Krea 3 edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.krea.v3.edit;
    expect(leaf).toBe(provider.post.run.krea.v3.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.krea).toEqualTypeOf<FalRunKreaNamespace>();
    expectTypeOf(provider.run.krea.v3).toEqualTypeOf<FalRunKreaV3Namespace>();
    expectTypeOf<FalKreaV3EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKreaV3EditRequestInput>().toEqualTypeOf<FalKreaV3EditRequest>();
    expectTypeOf<FalKreaV3EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKreaV3EditResponse>().toEqualTypeOf<{
      images: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }>;
      seed: number;
      prompt: string;
      timings: Record<string, number>;
      has_nsfw_concepts: boolean[];
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        images: [{ url: "https://example.com/out.png" }],
        seed: 1,
        prompt: recorded.prompt,
        timings: { inference: 0.2 },
        has_nsfw_concepts: [false],
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.krea.v3.edit(recorded);
    expect(result.images[0]?.url).toBe("https://example.com/out.png");
    expect(result.seed).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/krea/v3/edit");
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
      "regions",
      "regional_edit",
      "model",
      "image_size",
      "reasoning_level",
      "negative_prompt",
      "seed",
      "output_format",
      "sync_mode",
      "enable_safety_checker",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Edit instruction. Refer to images as <image-1>, <image-2>, ... and regions as @label. May be omitted when a region has a note."
    );
    expect(schema.shape.image_urls.description).toBe(
      "Reference images to edit or combine (1-8). Order sets the <image-N> tags."
    );
    expect(schema.shape.regions.description).toBe(
      "Bounding boxes on reference images, with optional labels and editing notes. Requires high or ultra reasoning."
    );
    expect(schema.shape.regional_edit.description).toBe(
      "With high or ultra reasoning, true preserves pixels outside the edit regions on the chosen canvas; false disables automatic region cropping and preservation. Omit to retain automatic preservation. With image_size=auto, keeps the canvas dimensions; an explicit image_size preserves the resized input. Billing uses the generated render dimensions. Use PNG for lossless output."
    );
    expect(schema.shape.model.description).toBe(
      "Model variant: berry favors quality, jam favors speed."
    );
    expect(schema.shape.image_size.description).toBe(
      "Output size, rounded up to multiples of 16, at most 4,220,160 total pixels (1680×2512). auto lets the prompt expander pick the aspect ratio at about 2048×2048."
    );
    expect(schema.shape.reasoning_level.description).toBe(
      "How much effort the harness spends reasoning about the given editing task. Higher reasoning effort means slower generation time. high plans the edit with segmentation, web search and reference photos, keeps unedited areas of a single input image, corrects required text, and bills a flat $0.125 (5 megapixels) more per request. low and medium bill $0.025 per megapixel of the output plus each reference (references larger than the output count as the output size). ultra generates at 2K with Krea's ultra thinking mode, ignores image_size and negative_prompt, and bills a flat price by reference count: $0.27 for 1, $0.30 for 2, $0.32 for 3, $0.35 for 4, plus $0.0275 per reference past 4."
    );
    expect(schema.shape.negative_prompt.description).toBe(
      "What to keep out of the image. Used by berry only."
    );
    expect(schema.shape.seed.description).toBe(
      "Latent noise seed. Use a new seed when editing a previous output again."
    );
    expect(schema.shape.output_format.description).toBe("Output image format.");
    expect(schema.shape.sync_mode.description).toBe(
      "Return images as data URIs instead of saving them in request history."
    );
    expect(schema.shape.enable_safety_checker.description).toBe(
      "Check output images for unsafe content. Disabling requires account authorization."
    );
    const region = schema.shape.regions.unwrap().element;
    expect(Object.keys(region.shape)).toEqual([
      "image_idx",
      "x",
      "y",
      "width",
      "height",
      "label",
      "note",
    ]);
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires only image_urls", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    expect(
      schema.safeParse({ image_urls: ["https://example.com/a.png"] }).success
    ).toBe(true);
    const without = { ...recorded } as Record<string, unknown>;
    delete without.image_urls;
    expect(schema.safeParse(without).success).toBe(false);
    expect(accepts({ image_urls: [] })).toBe(false);
    expect(accepts({ image_urls: ["https://example.com/a.png"] })).toBe(true);
    expect(
      accepts({
        image_urls: Array.from(
          { length: 8 },
          () => "https://example.com/a.png"
        ),
      })
    ).toBe(true);
    expect(
      accepts({
        image_urls: Array.from(
          { length: 9 },
          () => "https://example.com/a.png"
        ),
      })
    ).toBe(false);
  });

  it("bounds prompt, negative_prompt, and seed", () => {
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ prompt: "x".repeat(5000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(5001) })).toBe(false);
    expect(accepts({ negative_prompt: "x".repeat(1024) })).toBe(true);
    expect(accepts({ negative_prompt: "x".repeat(1025) })).toBe(false);
    expect(accepts({ seed: 1 })).toBe(true);
    expect(accepts({ seed: null })).toBe(true);
    expect(accepts({ seed: 1.5 })).toBe(false);
  });

  it("bounds regions", () => {
    const region = {
      image_idx: 0,
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5,
      label: "face",
      note: "soften",
    };
    expect(accepts({ regions: [region] })).toBe(true);
    expect(accepts({ regions: [{ ...region, label: null }] })).toBe(true);
    expect(accepts({ regions: [{ ...region, label: "@face" }] })).toBe(false);
    expect(accepts({ regions: [{ ...region, label: "has space" }] })).toBe(
      false
    );
    expect(accepts({ regions: [{ ...region, x: 1 }] })).toBe(false);
    expect(accepts({ regions: [{ ...region, width: 0 }] })).toBe(false);
    expect(accepts({ regions: [{}] })).toBe(false);
    expect(
      accepts({
        regions: Array.from({ length: 24 }, () => region),
      })
    ).toBe(true);
    expect(
      accepts({
        regions: Array.from({ length: 25 }, () => region),
      })
    ).toBe(false);
    expect(accepts({ regional_edit: null })).toBe(true);
    expect(accepts({ regional_edit: true })).toBe(true);
  });

  it("accepts the documented enums and image sizes", () => {
    expect(accepts({ model: "berry" })).toBe(true);
    expect(accepts({ model: "jam" })).toBe(true);
    expect(accepts({ model: "not-a-documented-value" })).toBe(false);
    expect(accepts({ reasoning_level: "low" })).toBe(true);
    expect(accepts({ reasoning_level: "medium" })).toBe(true);
    expect(accepts({ reasoning_level: "high" })).toBe(true);
    expect(accepts({ reasoning_level: "ultra" })).toBe(true);
    expect(accepts({ reasoning_level: "not-a-documented-value" })).toBe(false);
    expect(accepts({ output_format: "png" })).toBe(true);
    expect(accepts({ output_format: "jpeg" })).toBe(true);
    expect(accepts({ output_format: "webp" })).toBe(false);
    expect(accepts({ image_size: "square_hd" })).toBe(true);
    expect(accepts({ image_size: "auto" })).toBe(true);
    expect(accepts({ image_size: "not-a-documented-value" })).toBe(false);
    expect(accepts({ image_size: { width: 1024, height: 1024 } })).toBe(true);
    expect(accepts({ image_size: { width: 0, height: 1024 } })).toBe(false);
    expect(accepts({ image_size: { width: 14142, height: 1 } })).toBe(true);
    expect(accepts({ image_size: { width: 14143, height: 1 } })).toBe(false);
  });

  it("prices the pinned low payload at one megapixel plus one reference", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.05, 8);
    expect(estimate.warnings).toEqual([referenceWarning]);
  });

  it("prices high, ultra, and a fractional output, and leaves auto unpriced", () => {
    const high = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, reasoning_level: "high" },
    });
    expect(high.usd).toBeCloseTo(0.175, 8);

    const ultra = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        image_urls: ["https://example.com/cat.jpg"],
        reasoning_level: "ultra",
        image_size: "auto",
      },
    });
    expect(ultra.usd).toBeCloseTo(0.27, 8);
    expect(ultra.warnings).toEqual([]);

    const five = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        image_urls: Array.from(
          { length: 5 },
          () => "https://example.com/a.png"
        ),
        reasoning_level: "ultra",
      },
    });
    expect(five.usd).toBeCloseTo(0.3775, 8);

    const fractional = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        ...recorded,
        image_size: { width: 768, height: 1024 },
      },
    });
    expect(fractional.usd).toBeCloseTo(0.0375, 8);
    expect(fractional.warnings[0]).toContain("0.75 megapixels");

    const auto = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, image_size: "auto" },
    });
    expect(auto.usd).toBe(0);
    expect(auto.warnings.join(" ")).toMatch(/image_size is omitted, auto/);
    expect(auto.breakdown).toEqual({});
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/krea/v3/edit",
      asOf: "2026-10-29",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("krea3");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Krea 3 Edit"
    );
  });
});
