import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal bytedance seedream v5 pro layerize integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/bytedance-seedream-v5-pro-layerize");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should decompose an image into a base image and layers", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Upstream's own sample image, from the endpoint's OpenAPI examples.
    // `auto_1K` is the cheapest resolution tier and `fast` the cheapest
    // prompt-optimization mode.
    const result = await provider.run.bytedance.seedream.v5.pro.layerize({
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/kontext_example_input.webp",
      image_size: "auto_1K",
      enhance_prompt_mode: "fast",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(Array.isArray(result.layers)).toBe(true);
    expect(result.layers.length).toBeGreaterThan(0);
    expect(result.images.length).toBe(result.layers.length);

    // The base image is always z_index 0 and carries no layer metadata.
    const base = result.layers[0];
    expect(base.z_index).toBe(0);
    expect(typeof base.image.url).toBe("string");
    expect(base.image.url.startsWith("http")).toBe(true);

    // z_index is bounded to [0, 16] and increases down the array.
    for (const [i, layer] of result.layers.entries()) {
      expect(typeof layer.image.url).toBe("string");
      expect(layer.z_index).toBeGreaterThanOrEqual(0);
      expect(layer.z_index).toBeLessThanOrEqual(16);
      if (i > 0) {
        expect(layer.z_index).toBeGreaterThanOrEqual(
          result.layers[i - 1].z_index
        );
      }
    }
  }, 300000);

  // AC-3: image_url is the only required field, and the two enum vocabularies
  // are closed.
  it("should reject a payload missing image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
      prompt: "separate the foreground",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should accept the minimal payload of image_url alone", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
      image_url: "https://example.com/input.webp",
    });
    expect(v.success).toBe(true);
  });

  it("should accept every documented image_size tier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const image_size of ["auto", "auto_1K", "auto_1.5K", "auto_2K"]) {
      const v =
        provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
          image_url: "https://example.com/input.webp",
          image_size,
        });
      expect(v.success, image_size).toBe(true);
    }
  });

  it("should reject an undocumented image_size tier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
      image_url: "https://example.com/input.webp",
      image_size: "auto_4K",
    });
    expect(v.success).toBe(false);
  });

  it("should accept both documented enhance_prompt_mode values", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const enhance_prompt_mode of ["standard", "fast"]) {
      const v =
        provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
          image_url: "https://example.com/input.webp",
          enhance_prompt_mode,
        });
      expect(v.success, enhance_prompt_mode).toBe(true);
    }
  });

  it("should reject an undocumented enhance_prompt_mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
      image_url: "https://example.com/input.webp",
      enhance_prompt_mode: "turbo",
    });
    expect(v.success).toBe(false);
  });

  it("should accept the optional boolean flags", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.pro.layerize.schema.safeParse({
      image_url: "https://example.com/input.webp",
      prompt: "separate the cat from the background",
      sync_mode: false,
      enable_safety_checker: true,
    });
    expect(v.success).toBe(true);
  });
});
