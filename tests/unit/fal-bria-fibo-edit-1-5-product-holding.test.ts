import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import {
  FalBriaFiboEdit1p5ProductHoldingRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  modelSlug,
  modelDisplay,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

const endpoint = "bria/fibo-edit-1.5/product-holding";
const payload = {
  person_image_url:
    "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/product-holding/person.jpg",
  product_image_urls: [
    "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/product-holding/product.jpg",
  ],
};

describe("Bria Fibo Edit 1.5 Product Holding", () => {
  it("registers fal slug and display", () => {
    expect(modelSlug("fal", endpoint)).toBe("briafiboedit");
    expect(modelDisplay("fal", endpoint)).toBe(
      "Bria Fibo Edit 1.5 Product Holding"
    );
    expect(MODEL_SLUGS.kie).not.toHaveProperty(endpoint);
  });
  it("exposes the leaf and request schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bria.fiboEdit1p5.productHolding;
    expect(leaf).toBe(provider.post.run.bria.fiboEdit1p5.productHolding);
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
