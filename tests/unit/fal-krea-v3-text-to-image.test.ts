import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKreaV3TextToImageParsedRequest,
  type FalKreaV3TextToImageRequest,
  type FalKreaV3TextToImageRequestInput,
  type FalKreaV3TextToImageResponse,
  type FalRunKreaNamespace,
  type FalRunKreaV3Namespace,
} from "@apicity/fal";
import {
  FalKreaV3TextToImageRequestSchema as schema,
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
// (sha256 347a03eddc1f1385a22e32ea9d6f6217e970da6890d8a630978fbb19cc24ff42).
const endpoint = "krea/v3/text-to-image";
const recorded = {
  prompt: "A red ceramic cup on a wooden table",
  image_size: { width: 1024, height: 1024 },
  reasoning_level: "low",
} satisfies FalKreaV3TextToImageRequest;

const sizeWarning =
  "fal 'krea/v3/text-to-image': image_size is omitted, auto, or unrecognized; low and medium bill output megapixels, so pass an explicit size";

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Krea 3 text-to-image contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.krea.v3.textToImage;
    expect(leaf).toBe(provider.post.run.krea.v3.textToImage);
    expect(leaf.schema).toBe(schema);
    expect(provider.run.krea.v3.edit).toBe(provider.post.run.krea.v3.edit);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.krea).toEqualTypeOf<FalRunKreaNamespace>();
    expectTypeOf(provider.run.krea.v3).toEqualTypeOf<FalRunKreaV3Namespace>();
    expectTypeOf<FalKreaV3TextToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKreaV3TextToImageRequestInput>().toEqualTypeOf<FalKreaV3TextToImageRequest>();
    expectTypeOf<FalKreaV3TextToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKreaV3TextToImageResponse>().toEqualTypeOf<{
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
    const result = await provider.run.krea.v3.textToImage(recorded);
    expect(result.images[0]?.url).toBe("https://example.com/out.png");
    expect(result.seed).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/krea/v3/text-to-image");
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
      "Description of the image to generate."
    );
    expect(schema.shape.model.description).toBe(
      "Model variant: berry favors quality, jam favors speed."
    );
    expect(schema.shape.image_size.description).toBe(
      "Output size, rounded up to multiples of 16, at most 4,220,160 total pixels (1680×2512). auto lets the prompt expander pick the aspect ratio at about 2048×2048."
    );
    expect(schema.shape.reasoning_level.description).toBe(
      "How much effort the harness spends reasoning about the given prompt. Higher reasoning effort means slower generation time. Both levels bill $0.025 per output megapixel."
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
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires only prompt", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    expect(schema.safeParse({ prompt: "A cup" }).success).toBe(true);
    const without = { ...recorded } as Record<string, unknown>;
    delete without.prompt;
    expect(schema.safeParse(without).success).toBe(false);
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: "a" })).toBe(true);
    expect(accepts({ prompt: "a".repeat(5000) })).toBe(true);
    expect(accepts({ prompt: "a".repeat(5001) })).toBe(false);
    expect(accepts({ negative_prompt: "a".repeat(1024) })).toBe(true);
    expect(accepts({ negative_prompt: "a".repeat(1025) })).toBe(false);
    expect(accepts({ seed: null })).toBe(true);
    expect(accepts({ seed: 1.5 })).toBe(false);
  });

  it("accepts the documented enums and image sizes", () => {
    expect(accepts({ model: "berry" })).toBe(true);
    expect(accepts({ model: "jam" })).toBe(true);
    expect(accepts({ model: "not-a-documented-value" })).toBe(false);
    expect(accepts({ reasoning_level: "low" })).toBe(true);
    expect(accepts({ reasoning_level: "medium" })).toBe(true);
    expect(accepts({ reasoning_level: "high" })).toBe(false);
    expect(accepts({ reasoning_level: "ultra" })).toBe(false);
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

  it("prices the pinned low payload at one output megapixel", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.025, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("prices medium, a preset, and a fraction, and leaves auto unpriced", () => {
    const medium = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, reasoning_level: "medium" },
    });
    expect(medium.usd).toBeCloseTo(0.025, 8);
    expect(medium.warnings).toEqual([]);

    const omitted = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { prompt: recorded.prompt, image_size: recorded.image_size },
    });
    expect(omitted.usd).toBeCloseTo(0.025, 8);

    const preset = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, image_size: "square_hd" },
    });
    expect(preset.usd).toBeCloseTo(0.025, 8);

    const fractional = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        ...recorded,
        image_size: { width: 768, height: 1024 },
      },
    });
    expect(fractional.usd).toBeCloseTo(0.01875, 8);
    expect(fractional.warnings).toEqual([]);

    const auto = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, image_size: "auto" },
    });
    expect(auto.usd).toBe(0);
    expect(auto.warnings).toEqual([sizeWarning]);
    expect(auto.breakdown).toEqual({});

    const unknown = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, reasoning_level: "high" },
    });
    expect(unknown.usd).toBe(0);
    expect(unknown.warnings.join(" ")).toMatch(
      /reasoning_level 'high' is not a priced tier/
    );
    expect(unknown.breakdown).toEqual({});
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/krea/v3/text-to-image",
      asOf: "2026-10-29",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("krea3");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Krea 3"
    );
  });
});
