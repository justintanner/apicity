import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Bria Fibo Edit 1.5 Product Holding", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bria-fibo-edit-1-5-product-holding");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.bria.fiboEdit1p5.productHolding({
      person_image_url:
        "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/product-holding/person.jpg",
      product_image_urls: [
        "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/product-holding/product.jpg",
      ],
    });
    expect(result).toBeTruthy();
    expect(result.image.url).toMatch(/^https?:\/\//);
    expect(result.structured_instruction).toBeTruthy();
  }, 900000);
});
