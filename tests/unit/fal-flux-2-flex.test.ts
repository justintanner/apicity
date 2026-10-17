import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalFlux2FlexParsedRequest,
  type FalFlux2FlexRequest,
  type FalFlux2FlexRequestInput,
  type FalFlux2FlexResponse,
  type FalRunFlux2FlexNamespace,
  type FalRunNamespace,
} from "@apicity/fal";
import {
  FalFlux2FlexRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-15
// (sha256 84eb309ac9856ddbd0668ff6ae244410837e67d19e360c4a8ed8ea5c825116a5,
// the planning archive's JSON) and the free 422 probes of the same day.
const endpoint = "fal-ai/flux-2-flex";
// The recorded call. The prompt is the repo's house prompt, reused from
// tests/integration/fal-ideogram-v4-5.test.ts and others.
const recorded = {
  prompt: "A red panda waves once, then holds still.",
} satisfies FalFlux2FlexRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FLUX.2 Flex text-to-image contract", () => {
  it("exposes the callable on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.flux2Flex;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.flux2Flex);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["flux2Flex"]
    >().toEqualTypeOf<FalRunFlux2FlexNamespace>();
    expectTypeOf(leaf).toEqualTypeOf<FalRunFlux2FlexNamespace>();
    expectTypeOf(leaf).parameter(0).toEqualTypeOf<FalFlux2FlexRequest>();
    expectTypeOf(leaf).returns.resolves.toEqualTypeOf<FalFlux2FlexResponse>();
    expectTypeOf<FalFlux2FlexRequest>().toEqualTypeOf<z.input<typeof schema>>();
    expectTypeOf<FalFlux2FlexRequestInput>().toEqualTypeOf<FalFlux2FlexRequest>();
    expectTypeOf<FalFlux2FlexParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalFlux2FlexResponse>().toEqualTypeOf<{
      images: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }[];
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        images: [{ url: "https://example.com/red-panda.jpg" }],
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.flux2Flex(recorded);
    expect(result.images[0].url).toBe("https://example.com/red-panda.jpg");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/flux-2-flex");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only prompt and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_size",
      "seed",
      "safety_tolerance",
      "enable_safety_checker",
      "output_format",
      "sync_mode",
      "guidance_scale",
      "num_inference_steps",
    ]);
    expect(schema.parse(recorded)).toEqual({
      prompt: recorded.prompt,
      image_size: "landscape_4_3",
      safety_tolerance: "2",
      enable_safety_checker: true,
      output_format: "jpeg",
      sync_mode: false,
      guidance_scale: 3.5,
      num_inference_steps: 28,
    });
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["prompt"],
    ]);
    // The validator took an empty prompt and ignored an undocumented field,
    // so the schema sets no minimum and is not strict.
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ unknown_field: true })).toBe(true);
    for (const prompt of [null, 1, {}]) expect(accepts({ prompt })).toBe(false);
  });

  it("takes a size preset or an explicit size", () => {
    for (const preset of [
      "square_hd",
      "square",
      "portrait_4_3",
      "portrait_16_9",
      "landscape_4_3",
      "landscape_16_9",
    ])
      expect(accepts({ image_size: preset })).toBe(true);
    for (const preset of ["landscape_21_9", "auto", null])
      expect(accepts({ image_size: preset })).toBe(false);
    // Explicit sides are positive integers up to 14142; a missing side
    // defaults to 512. fal's validator took 250, 1000 and 2576 wide sizes and
    // a 2560x2048 area, which its x-fal hints discourage, so neither is
    // refused here.
    expect(schema.parse({ ...recorded, image_size: { width: 1024 } })).toEqual(
      expect.objectContaining({ image_size: { width: 1024, height: 512 } })
    );
    for (const size of [
      { width: 256, height: 2560 },
      { width: 1000, height: 512 },
      { width: 2560, height: 2048 },
      { width: 14142, height: 1 },
    ])
      expect(accepts({ image_size: size })).toBe(true);
    for (const size of [
      { width: 0, height: 512 },
      { width: 512, height: 14143 },
      { width: 512.5, height: 512 },
      { width: "512", height: 512 },
    ])
      expect(accepts({ image_size: size })).toBe(false);
  });

  it("takes only the five string safety tolerances", () => {
    for (const level of ["1", "2", "3", "4", "5"])
      expect(accepts({ safety_tolerance: level })).toBe(true);
    // fal's lax validator coerced the number 2; the schema keeps the
    // documented string enum.
    for (const level of ["0", "6", 2, null])
      expect(accepts({ safety_tolerance: level })).toBe(false);
  });

  it("takes jpeg or png output", () => {
    for (const format of ["jpeg", "png"])
      expect(accepts({ output_format: format })).toBe(true);
    for (const format of ["webp", "jpg", null])
      expect(accepts({ output_format: format })).toBe(false);
  });

  it("bounds guidance_scale at 1.5 to 10", () => {
    for (const scale of [1.5, 3.5, 10])
      expect(accepts({ guidance_scale: scale })).toBe(true);
    for (const scale of [1.4, 10.5, "3.5", null])
      expect(accepts({ guidance_scale: scale })).toBe(false);
  });

  it("bounds num_inference_steps at two to fifty whole steps", () => {
    for (const steps of [2, 28, 50])
      expect(accepts({ num_inference_steps: steps })).toBe(true);
    for (const steps of [1, 51, 2.5, "28", null])
      expect(accepts({ num_inference_steps: steps })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42", {}]) expect(accepts({ seed })).toBe(false);
  });

  it.each(["enable_safety_checker", "sync_mode"])(
    "takes %s as a boolean",
    (field) => {
      for (const value of [true, false])
        expect(accepts({ [field]: value })).toBe(true);
      for (const value of ["true", 1, null, {}])
        expect(accepts({ [field]: value })).toBe(false);
    }
  );

  it("keeps billing dynamic because the recorded units miss the card", () => {
    // The card bills $0.05 per megapixel rounded up, so the default 1024x768
    // image should bill one megapixel. The recorded call billed 0.834
    // processed megapixels ($0.0417) and the usage API agrees.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Flux 2 Flex"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
