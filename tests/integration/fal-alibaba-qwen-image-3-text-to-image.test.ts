import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
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
        negative_prompt: "x".repeat(501),
      }).success
    ).toBe(false);
  });

  it("should reject an unknown image-size preset", () => {
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

  it("should reject a seed below the published range", () => {
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
        seed: 2147483648,
      }).success
    ).toBe(false);
  });

  it("should reject an unsupported output format", () => {
    expect(
      FalAlibabaQwenImage3TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        output_format: "gif",
      }).success
    ).toBe(false);
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
