import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalNvidiaCosmos3SuperTextToImageParsedRequest,
  type FalNvidiaCosmos3SuperTextToImageRequest,
  type FalNvidiaCosmos3SuperTextToImageRequestInput,
  type FalNvidiaCosmos3SuperTextToImageResponse,
  type FalRunNvidiaCosmos3SuperNamespace,
} from "@apicity/fal";
import {
  FalNvidiaCosmos3SuperTextToImageRequestSchema as schema,
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
// (sha256 955b94ac6f9420a59b7c7fd9adfc3858137c4222458e3aa3349535984851bace).
const endpoint = "nvidia/cosmos-3-super/text-to-image";
const recorded = {
  prompt:
    "A photorealistic close-up of two damp hands shaping a spinning cylinder of wet gray clay on a pottery wheel, fingers pinching the walls upward into a narrow-necked vase, water glistening on the clay, soft studio lighting, shallow depth of field.",
} satisfies FalNvidiaCosmos3SuperTextToImageRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Cosmos 3 Super text-to-image contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.nvidia.cosmos3Super.textToImage;
    expect(leaf).toBe(provider.post.run.nvidia.cosmos3Super.textToImage);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.nvidia.cosmos3Super
    ).toEqualTypeOf<FalRunNvidiaCosmos3SuperNamespace>();
    expectTypeOf<FalNvidiaCosmos3SuperTextToImageRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalNvidiaCosmos3SuperTextToImageRequestInput>().toEqualTypeOf<FalNvidiaCosmos3SuperTextToImageRequest>();
    expectTypeOf<FalNvidiaCosmos3SuperTextToImageParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalNvidiaCosmos3SuperTextToImageResponse>().toEqualTypeOf<{
      images: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }>;
      seed: number;
      has_nsfw_concepts: Array<boolean>;
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
    const result = await provider.run.nvidia.cosmos3Super.textToImage(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/nvidia/cosmos-3-super/text-to-image"
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
      "negative_prompt",
      "enable_prompt_expansion",
      "enable_agentic_generation",
      "agentic_max_iterations",
      "agentic_samples_per_iteration",
      "agentic_early_stop",
      "image_size",
      "num_inference_steps",
      "guidance_scale",
      "num_images",
      "seed",
      "enable_safety_checker",
      "sync_mode",
      "output_format",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing the image to generate."
    );
    expect(schema.shape.negative_prompt.description).toBe(
      "Content to steer the generation away from (colors, objects, artifacts)."
    );
    expect(schema.shape.enable_prompt_expansion.description).toBe(
      "Expand the prompt with OpenRouter before image generation. When enabled, the prompt is rewritten into the dense structured-JSON format Cosmos3 was trained on; generation falls back to the raw prompt if expansion fails."
    );
    expect(schema.shape.enable_agentic_generation.description).toBe(
      "Automatically generate and compare multiple candidate images, then refine the prompt between rounds to better match the original request. This can improve prompt adherence but increases latency and billable image generations."
    );
    expect(schema.shape.agentic_max_iterations.description).toBe(
      "Maximum number of refinement rounds when agentic generation is enabled."
    );
    expect(schema.shape.agentic_samples_per_iteration.description).toBe(
      "Candidate images to generate and judge per agentic iteration. The best candidate advances to the next rewrite stage."
    );
    expect(schema.shape.agentic_early_stop.description).toBe(
      "Stop early when a candidate image is already a strong match for the prompt."
    );
    expect(schema.shape.image_size.description).toBe(
      "The size of the generated image. Each edge is clamped to 512-1280px (multiples of 16)."
    );
    expect(schema.shape.num_inference_steps.description).toBe(
      "Number of denoising steps. More steps yield higher quality but take longer."
    );
    expect(schema.shape.guidance_scale.description).toBe(
      "Classifier-free guidance scale. Higher values increase prompt adherence at the cost of diversity."
    );
    expect(schema.shape.num_images.description).toBe(
      "The number of images to generate."
    );
    expect(schema.shape.seed.description).toBe(
      "The same seed and prompt given to the same model version will produce the same image every time."
    );
    expect(schema.shape.enable_safety_checker.description).toBe(
      "Enable content moderation for the input prompt and generated images. Disabling it requires account authorization; unauthorized requests are always checked, and images flagged as unsafe are returned as black images."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the image is returned as a data URI and the output data won't be available in the request history."
    );
    expect(schema.shape.output_format.description).toBe(
      "The format of the generated image."
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
    expect(accepts({ prompt: "x".repeat(4096) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(4097) })).toBe(false);
  });

  it("bounds negative_prompt", () => {
    expect(accepts({ negative_prompt: "x".repeat(1024) })).toBe(true);
    expect(accepts({ negative_prompt: "x".repeat(1025) })).toBe(false);
  });

  it("bounds the agentic_max_iterations number", () => {
    expect(accepts({ agentic_max_iterations: 1 })).toBe(true);
    expect(accepts({ agentic_max_iterations: 0 })).toBe(false);
    expect(accepts({ agentic_max_iterations: 3 })).toBe(true);
    expect(accepts({ agentic_max_iterations: 4 })).toBe(false);
  });

  it("bounds the agentic_samples_per_iteration number", () => {
    expect(accepts({ agentic_samples_per_iteration: 1 })).toBe(true);
    expect(accepts({ agentic_samples_per_iteration: 0 })).toBe(false);
    expect(accepts({ agentic_samples_per_iteration: 3 })).toBe(true);
    expect(accepts({ agentic_samples_per_iteration: 4 })).toBe(false);
  });

  it("bounds the num_inference_steps number", () => {
    expect(accepts({ num_inference_steps: 1 })).toBe(true);
    expect(accepts({ num_inference_steps: 0 })).toBe(false);
    expect(accepts({ num_inference_steps: 50 })).toBe(true);
    expect(accepts({ num_inference_steps: 51 })).toBe(false);
  });

  it("bounds the guidance_scale number", () => {
    expect(accepts({ guidance_scale: 0 })).toBe(true);
    expect(accepts({ guidance_scale: -1 })).toBe(false);
    expect(accepts({ guidance_scale: 20 })).toBe(true);
    expect(accepts({ guidance_scale: 21 })).toBe(false);
  });

  it("bounds the num_images number", () => {
    expect(accepts({ num_images: 1 })).toBe(true);
    expect(accepts({ num_images: 0 })).toBe(false);
    expect(accepts({ num_images: 4 })).toBe(true);
    expect(accepts({ num_images: 5 })).toBe(false);
  });

  it("accepts a null seed", () => {
    expect(accepts({ seed: null })).toBe(true);
  });

  it("accepts the documented output_format values", () => {
    expect(accepts({ output_format: "jpeg" })).toBe(true);
    expect(accepts({ output_format: "png" })).toBe(true);
    expect(accepts({ output_format: "not-a-documented-value" })).toBe(false);
    expect(accepts({ output_format: null })).toBe(false);
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

  it("adds the published prompt-expansion charge once", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        ...recorded,
        num_images: 2,
        enable_prompt_expansion: true,
      },
    });
    expect(estimate.usd).toBeCloseTo(0.1, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("warns when agentic generation is on", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, enable_agentic_generation: true },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/nvidia/cosmos-3-super/text-to-image",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "cosmos3i"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Cosmos 3 Super Image"
    );
  });
});
