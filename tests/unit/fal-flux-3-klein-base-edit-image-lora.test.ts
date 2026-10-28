import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createFal,
  type FalFlux3KleinEditImageLoraRequest,
  type FalRunFlux3KleinBaseEditImageNamespace,
} from "@apicity/fal";
import {
  FalFlux3KleinEditImageLoraRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  FAL_DYNAMIC_BILLED_UNITS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "blackforestlabs/flux-3/klein/base/edit-image/lora";
const recorded = {
  loras: [
    {
      path: "https://v3b.fal.media/files/b/0ab02ac9/p2dcEmp5srNPEw2V81PLz_flux3_klein_lora_031f628e922a4a958f3998be6ca46bfb.safetensors",
      scale: 1,
    },
  ],
  image_urls: ["data:image/jpeg;base64,AA=="],
  prompt: "Make the photo black and white.",
  enable_prompt_expansion: false,
  seed: 5555,
  num_images: 1,
  output_format: "jpeg",
  image_size: { width: 256, height: 256 },
} satisfies FalFlux3KleinEditImageLoraRequest;

describe("FLUX 3 Klein base edit-image LoRA", () => {
  it("owns the base editImage namespace and shares its schema and aliases", () => {
    const p = createFal({ apiKey: "test-key" });
    const namespace = p.run.blackforestlabs.flux3.klein.base.editImage;
    expectTypeOf(
      namespace
    ).toEqualTypeOf<FalRunFlux3KleinBaseEditImageNamespace>();
    expect(namespace.lora).toBe(
      p.post.run.blackforestlabs.flux3.klein.base.editImage.lora
    );
    expect(namespace.lora.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expect(schema.safeParse(recorded).success).toBe(true);
    expect(
      schema.parse({ ...recorded, image_size: undefined }).image_size
    ).toBeUndefined();
    expect(schema.safeParse({ ...recorded, image_urls: [] }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ ...recorded, loras: [{ path: "u", scale: 5 }] })
        .success
    ).toBe(false);
  });

  it("posts the recorded body unchanged to the endpoint", async () => {
    const response = {
      images: [{ url: "https://example.com/out.jpg" }],
      seed: 5555,
    };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const p = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    expect(
      await p.run.blackforestlabs.flux3.klein.base.editImage.lora(recorded)
    ).toEqual(response);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(`https://fal.run/${endpoint}`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
    expect(init.headers).toMatchObject({ Authorization: "Key fal-test-key" });
  });

  it.each([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
  ])(
    "accepts %s but does not invent a rate from the contradicted minimum",
    (image_size) => {
      expect(schema.safeParse({ ...recorded, image_size }).success).toBe(true);
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...recorded, image_size },
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toContain(
        "minimum does not match the recorded bill"
      );
    }
  );

  it("keeps explicit sizes and image counts dynamic after the observed bill", () => {
    for (const payload of [
      recorded,
      { ...recorded, image_size: undefined },
      { ...recorded, num_images: 2 },
      { ...recorded, image_size: { width: 1025, height: 256 } },
    ]) {
      const estimate = computeEstimate({ provider: "fal", endpoint, payload });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings).toHaveLength(1);
      expect(estimate.warnings[0]).toContain("megapixels at $0.035");
    }
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(FAL_DYNAMIC_BILLED_UNITS[endpoint].why).toContain("recorded bill");
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("FLUX 3 Klein Base Edit LoRA");
  });
});
