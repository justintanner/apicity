import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal xai grok-imagine-image edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/xai-grok-imagine-image-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image from a reference", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.xai.grokImagineImage.edit({
      prompt: "Make this scene more realistic but still keep the game vibes",
      num_images: 1,
      resolution: "1k",
      output_format: "jpeg",
      image_urls: [
        "https://v3b.fal.media/files/b/0a8b911d/Abk8vStrvmSPlzUqI_NN3_image_043.png",
      ],
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.revised_prompt).toBe("string");
  }, 300000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.edit.schema.safeParse({
      prompt: "make it glow",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing prompt", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.edit.schema.safeParse({});
    expect(v.success).toBe(false);
  });

  it("should reject num_images outside 1-4 range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.edit.schema.safeParse({
      prompt: "a cat",
      num_images: 5,
    });
    expect(v.success).toBe(false);
  });

  it("should reject more than 3 image_urls", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.edit.schema.safeParse({
      prompt: "a cat",
      image_urls: [
        "https://example.com/1.png",
        "https://example.com/2.png",
        "https://example.com/3.png",
        "https://example.com/4.png",
      ],
    });
    expect(v.success).toBe(false);
  });

  it("should reject invalid resolution", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.edit.schema.safeParse({
      prompt: "a cat",
      resolution: "4k",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.xai.grokImagineImage.edit.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineImage.edit).toBe(
      provider.post.run.xai.grokImagineImage.edit
    );
  });
});
