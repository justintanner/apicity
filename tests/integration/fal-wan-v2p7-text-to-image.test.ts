import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal wan v2.7 text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/wan-v2p7-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.wan.v2p7.textToImage({
      prompt: "An astronaut riding a horse in a photorealistic style.",
      max_images: 1,
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
    const v = provider.run.wan.v2p7.textToImage.schema.safeParse({
      prompt: "a serene mountain landscape",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.textToImage.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject payload with wrong enum value for image_size", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.textToImage.schema.safeParse({
      prompt: "a cat",
      image_size: "ultra_hd",
    });
    expect(v.success).toBe(false);
  });

  it("should reject max_images outside 1-5 range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.textToImage.schema.safeParse({
      prompt: "a cat",
      max_images: 6,
    });
    expect(v.success).toBe(false);
  });

  it("should reject negative_prompt longer than 500 characters", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.textToImage.schema.safeParse({
      prompt: "a cat",
      negative_prompt: "x".repeat(501),
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.wan.v2p7.textToImage.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.wan.v2p7.textToImage).toBe(
      provider.post.run.wan.v2p7.textToImage
    );
  });
});
