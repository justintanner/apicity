import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal bytedance seedream v5 pro text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/bytedance-seedream-v5-pro-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // `square_hd` (1024x1024) is the endpoint's documented min_area, which
    // puts the call in the cheaper of the two published area tiers, and
    // `num_images: 1` is the smallest billable count.
    const result = await provider.run.bytedance.seedream.v5.pro.textToImage({
      prompt:
        "A photorealistic red fox sitting in a snowy forest clearing at golden hour",
      image_size: "square_hd",
      num_images: 1,
      output_format: "jpeg",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBe(1);

    const [image] = result.images;
    expect(typeof image.url).toBe("string");
    expect(image.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: `prompt` is the only required field and the two enum vocabularies
  // are closed.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
        image_size: "square_hd",
      });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept the minimal payload of prompt alone", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
        prompt: "a red fox in the snow",
      });
    expect(v.success).toBe(true);
  });

  it("should accept every documented image_size preset", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const image_size of [
      "square_hd",
      "square",
      "portrait_4_3",
      "portrait_16_9",
      "landscape_4_3",
      "landscape_16_9",
      "auto_1K",
      "auto_2K",
    ]) {
      const v =
        provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
          prompt: "a red fox in the snow",
          image_size,
        });
      expect(v.success, image_size).toBe(true);
    }
  });

  it("should accept an explicit image_size object", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
        prompt: "a red fox in the snow",
        image_size: { width: 2048, height: 1152 },
      });
    expect(v.success).toBe(true);
  });

  // The Pro surface offers auto_1K/auto_2K, not the Lite surface's
  // auto_3K/auto_4K.
  it("should reject an undocumented image_size preset", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
        prompt: "a red fox in the snow",
        image_size: "auto_4K",
      });
    expect(v.success).toBe(false);
  });

  it("should bound num_images to the documented 1-6 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedream.v5.pro.textToImage.schema;
    const prompt = "a red fox in the snow";

    expect(schema.safeParse({ prompt, num_images: 1 }).success).toBe(true);
    expect(schema.safeParse({ prompt, num_images: 6 }).success).toBe(true);
    expect(schema.safeParse({ prompt, num_images: 0 }).success).toBe(false);
    expect(schema.safeParse({ prompt, num_images: 7 }).success).toBe(false);
    expect(schema.safeParse({ prompt, num_images: 1.5 }).success).toBe(false);
  });

  it("should accept both documented output_format values", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const output_format of ["jpeg", "png"]) {
      const v =
        provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
          prompt: "a red fox in the snow",
          output_format,
        });
      expect(v.success, output_format).toBe(true);
    }
  });

  it("should reject an undocumented output_format", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
        prompt: "a red fox in the snow",
        output_format: "webp",
      });
    expect(v.success).toBe(false);
  });

  it("should accept the optional boolean flags", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.pro.textToImage.schema.safeParse({
        prompt: "a red fox in the snow",
        sync_mode: false,
        enable_safety_checker: true,
      });
    expect(v.success).toBe(true);
  });
});
