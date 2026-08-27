import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal google virtual-try-on integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/google-virtual-try-on");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should put a product image on a person image", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Upstream's own documented example media, and num_images: 1 for the
    // cheapest viable call.
    const result = await provider.run.virtualTryOn({
      person_image_url:
        "https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg",
      product_image_url:
        "https://storage.googleapis.com/falserverless/model_tests/leffa/tshirt_image.jpg",
      num_images: 1,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
  }, 300000);
});
