import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Bria Fibo Edit 1.5 Virtual Try On", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bria-fibo-edit-1-5-virtual-try-on");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.bria.fiboEdit1p5.virtualTryOn({
      person_image_url:
        "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/virtual-try-on/person.jpg",
      garment_image_urls: [
        "https://labs-assets.bria.ai/fal-examples/fibo-edit-1.5/virtual-try-on/garment-1.jpg",
      ],
    });
    expect(result).toBeTruthy();
    expect(result.image.url).toMatch(/^https?:\/\//);
    expect(result.structured_instruction).toBeTruthy();
  }, 900000);
});
