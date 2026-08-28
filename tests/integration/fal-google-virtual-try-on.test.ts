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

  it("should render a person wearing the product image", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Upstream's own sample media, from the endpoint's OpenAPI examples.
    const result = await provider.run.virtualTryOn({
      person_image_url:
        "https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg",
      product_image_url:
        "https://storage.googleapis.com/falserverless/model_tests/leffa/tshirt_image.jpg",
      num_images: 1,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBe(1);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: person_image_url and product_image_url are required, and num_images
  // is bounded to 1-4 inclusive.
  it("should reject a payload missing person_image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.virtualTryOn.schema.safeParse({
      product_image_url: "https://example.com/tshirt.jpg",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(
      v.error.issues.some((i) => i.path.includes("person_image_url"))
    ).toBe(true);
  });

  it("should reject a payload missing product_image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.virtualTryOn.schema.safeParse({
      person_image_url: "https://example.com/person.jpg",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(
      v.error.issues.some((i) => i.path.includes("product_image_url"))
    ).toBe(true);
  });

  it("should reject num_images below the documented minimum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.virtualTryOn.schema.safeParse({
      person_image_url: "https://example.com/person.jpg",
      product_image_url: "https://example.com/tshirt.jpg",
      num_images: 0,
    });
    expect(v.success).toBe(false);
  });

  it("should reject num_images above the documented maximum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.virtualTryOn.schema.safeParse({
      person_image_url: "https://example.com/person.jpg",
      product_image_url: "https://example.com/tshirt.jpg",
      num_images: 5,
    });
    expect(v.success).toBe(false);
  });

  it("should accept num_images at the documented minimum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.virtualTryOn.schema.safeParse({
      person_image_url: "https://example.com/person.jpg",
      product_image_url: "https://example.com/tshirt.jpg",
      num_images: 1,
    });
    expect(v.success).toBe(true);
  });

  it("should accept num_images at the documented maximum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.virtualTryOn.schema.safeParse({
      person_image_url: "https://example.com/person.jpg",
      product_image_url: "https://example.com/tshirt.jpg",
      num_images: 4,
    });
    expect(v.success).toBe(true);
  });
});
