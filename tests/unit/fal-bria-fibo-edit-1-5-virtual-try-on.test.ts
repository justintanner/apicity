import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalBriaFiboEdit1p5VirtualTryOnRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "bria/fibo-edit-1.5/virtual-try-on";
const payload = {
  person_image_url:
    "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/virtual-try-on/person.jpg",
  garment_image_urls: [
    "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/virtual-try-on/garment-1.jpg",
  ],
};

describe("Bria Fibo Edit 1.5 Virtual Try On", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("briafiboedit");
    expect(modelDisplay("fal", endpoint)).toBe(
      "Bria Fibo Edit 1.5 Virtual Try On"
    );
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bria.fiboEdit1p5.virtualTryOn;
    expect(leaf).toBe(provider.post.run.bria.fiboEdit1p5.virtualTryOn);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
  });
  it("accepts the minimal documented request and keeps an unknown field", () => {
    expect(schema.safeParse(payload).success).toBe(true);
    expect(schema.safeParse({ ...payload, legacy: true }).success).toBe(true);
  });

  it("prices each output image at the published flat rate", () => {
    expect(
      computeEstimate({ provider: "fal", endpoint, payload }).usd
    ).toBeCloseTo(0.04);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, num_images: 3 },
      }).usd
    ).toBeCloseTo(0.12);
  });
});
