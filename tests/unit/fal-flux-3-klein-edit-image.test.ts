import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createFal,
  type FalFlux3KleinEditImageRequest,
  type FalRunFlux3KleinEditImageNamespace,
} from "@apicity/fal";
import {
  FalFlux3KleinEditImageLoraRequestSchema as loraSchema,
  FalFlux3KleinEditImageRequestSchema as schema,
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

const endpoint = "blackforestlabs/flux-3/klein/edit-image";
const recorded = {
  image_urls: ["data:image/jpeg;base64,/9j/4AAQ"],
  prompt: "Make the photo black and white.",
  enable_prompt_expansion: false,
  seed: 5555,
  num_images: 1,
  output_format: "jpeg",
  image_size: { width: 256, height: 256 },
} satisfies FalFlux3KleinEditImageRequest;

describe("FLUX 3 Klein edit-image", () => {
  it("makes editImage callable and keeps its LoRA leaf", () => {
    const p = createFal({ apiKey: "test-key" });
    const namespace = p.run.blackforestlabs.flux3.klein.editImage;
    expectTypeOf(namespace).toEqualTypeOf<FalRunFlux3KleinEditImageNamespace>();
    expect(typeof namespace).toBe("function");
    expect(namespace).toBe(p.post.run.blackforestlabs.flux3.klein.editImage);
    expect(namespace.schema).toBe(schema);
    expect(namespace.lora.schema).toBe(loraSchema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });

  it("takes the LoRA endpoint's input without loras", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    expect(Object.keys(schema.shape).sort()).toEqual(
      Object.keys(loraSchema.shape)
        .filter((key) => key !== "loras")
        .sort()
    );
    expect(schema.safeParse({ ...recorded, image_urls: [] }).success).toBe(
      false
    );
  });

  it("posts the request body unchanged to the endpoint", async () => {
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
    expect(await p.run.blackforestlabs.flux3.klein.editImage(recorded)).toEqual(
      response
    );
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(`https://fal.run/${endpoint}`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(recorded);
    expect(init.headers).toMatchObject({ Authorization: "Key fal-test-key" });
  });

  it("stays dynamic after the recorded bill", () => {
    for (const payload of [
      recorded,
      { ...recorded, image_size: null },
      { ...recorded, num_images: 2 },
    ]) {
      const estimate = computeEstimate({ provider: "fal", endpoint, payload });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings).toHaveLength(1);
      expect(estimate.warnings[0]).toContain("megapixels at $0.009");
    }
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(FAL_DYNAMIC_BILLED_UNITS[endpoint].why).toContain("recorded bill");
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("FLUX 3 Klein Edit");
  });
});
