import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal bytedance seedream v5 lite text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/bytedance-seedream-v5-lite-text-to-image"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.bytedance.seedream.v5.lite.textToImage({
      prompt:
        "A photorealistic red fox sitting in a snowy forest clearing at golden hour",
      num_images: 1,
      enable_safety_checker: true,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 300000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.schema.safeParse({
        prompt: "a beautiful landscape",
      });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject payload with wrong enum value for image_size", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.schema.safeParse({
        prompt: "a cat",
        image_size: "auto_8K",
      });
    expect(v.success).toBe(false);
  });

  it.each([
    "square_hd",
    "square",
    "portrait_4_3",
    "portrait_16_9",
    "landscape_4_3",
    "landscape_16_9",
    "auto_2K",
    "auto_3K",
  ])("should accept image_size preset %s", (preset) => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.schema.safeParse({
        prompt: "a cat",
        image_size: preset,
      });
    expect(v.success).toBe(true);
  });

  it("should reject image_size auto_4K (not supported upstream)", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.schema.safeParse({
        prompt: "a cat",
        image_size: "auto_4K",
      });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedream.v5.lite.textToImage.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedream.v5.lite.textToImage).toBe(
      provider.post.run.bytedance.seedream.v5.lite.textToImage
    );
  });
});
