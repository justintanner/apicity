import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import {
  createFal,
  type FalAlibabaQwenImage3TextToImageResponse,
} from "@apicity/fal";
import { FalAlibabaQwenImage3TextToImageRequestSchema } from "@apicity/fal/zod";

describe("fal alibaba qwen image 3 text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/alibaba-qwen-image-3-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.alibaba.qwenImage3.textToImage({
      prompt: "A serene mountain landscape at sunrise.",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 300000);

  it("should accept a minimal payload", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a serene mountain landscape",
      }).success
    ).toBe(true);
  });

  it("should enforce the published prompt boundaries", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "x".repeat(5000),
      }).success
    ).toBe(true);
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "",
      }).success
    ).toBe(false);
  });

  it("should reject a payload missing prompt", () => {
    const result = FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("prompt"))
    ).toBe(true);
  });

  it("should reject a prompt longer than 5000 characters", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "x".repeat(5001),
      }).success
    ).toBe(false);
  });

  it("should reject a negative prompt longer than 500 characters", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        negative_prompt: "x".repeat(500),
      }).success
    ).toBe(true);
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        negative_prompt: "x".repeat(501),
      }).success
    ).toBe(false);
  });

  it("should reject an unknown image-size preset", () => {
    for (const imageSize of [
      "square_hd",
      "square",
      "portrait_4_3",
      "portrait_16_9",
      "landscape_4_3",
      "landscape_16_9",
    ] as const) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          image_size: imageSize,
        }).success
      ).toBe(true);
    }
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        image_size: "ultra_hd",
      }).success
    ).toBe(false);
  });

  it("should reject a custom image size below the total-pixel minimum", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        image_size: { width: 100, height: 100 },
      }).success
    ).toBe(false);
  });

  it("should reject a custom image size above the total-pixel maximum", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        image_size: { width: 4096, height: 4096 },
      }).success
    ).toBe(false);
  });

  it("should accept a legal non-square custom image size", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        image_size: { width: 1280, height: 720 },
      }).success
    ).toBe(true);
  });

  it("should enforce the published per-dimension maximum", () => {
    for (const imageSize of [
      { width: 14142, height: 200 },
      { width: 200, height: 14142 },
    ]) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          image_size: imageSize,
        }).success
      ).toBe(true);
    }
    for (const imageSize of [
      { width: 20000, height: 200 },
      { width: 200, height: 20000 },
    ]) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          image_size: imageSize,
        }).success
      ).toBe(false);
    }
  });

  it.each([
    "enable_prompt_expansion",
    "enable_safety_checker",
    "sync_mode",
  ] as const)("should enforce boolean values for %s", (field) => {
    for (const value of [true, false]) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          [field]: value,
        }).success
      ).toBe(true);
    }
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        [field]: "true",
      }).success
    ).toBe(false);
  });

  it("should reject a seed below the published range", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        seed: 0,
      }).success
    ).toBe(true);
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        seed: -1,
      }).success
    ).toBe(false);
  });

  it("should reject a seed above the published range", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        seed: 2147483647,
      }).success
    ).toBe(true);
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        seed: 2147483648,
      }).success
    ).toBe(false);
  });

  it("should reject an unsupported output format", () => {
    for (const outputFormat of ["jpeg", "png", "webp"] as const) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          output_format: outputFormat,
        }).success
      ).toBe(true);
    }
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        output_format: "gif",
      }).success
    ).toBe(false);
  });

  it("should enforce the published image-count boundaries", () => {
    for (const numImages of [1, 6]) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          num_images: numImages,
        }).success
      ).toBe(true);
    }
    for (const numImages of [0, 7]) {
      expect(
        FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          num_images: numImages,
        }).success
      ).toBe(false);
    }
  });

  it("should type nullable file sizes from the response", () => {
    const response: FalAlibabaQwenImage3TextToImageResponse = {
      images: [
        {
          url: "https://example.com/image.png",
          file_size: null,
        },
      ],
      seed: 1,
    };

    expect(response.images[0].file_size).toBeNull();
  });

  it("should expose the schema by identity", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.alibaba.qwenImage3.textToImage.schema).toBe(
      FalAlibabaQwenImage3TextToImageRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.alibaba.qwenImage3.textToImage).toBe(
      provider.post.run.alibaba.qwenImage3.textToImage
    );
  });
});
