import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@apicity/fal";

describe("fal bytedance seedream v5 lite text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedream-v5-lite-text-to-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result =
      await provider.run.bytedance.seedream.v5.lite.textToImage({
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
      provider.run.bytedance.seedream.v5.lite.textToImage.validatePayload({
        prompt: "a beautiful landscape",
      });
    expect(v.valid).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.validatePayload({});
    expect(v.valid).toBe(false);
    expect(v.errors).toContain("prompt is required");
  });

  it("should reject payload with wrong enum value for image_size", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedream.v5.lite.textToImage.validatePayload({
        prompt: "a cat",
        image_size: "auto_8K",
      });
    expect(v.valid).toBe(false);
  });

  it("should expose payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema =
      provider.run.bytedance.seedream.v5.lite.textToImage.payloadSchema;
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe(
      "/fal-ai/bytedance/seedream/v5/lite/text-to-image"
    );
    expect(schema.contentType).toBe("application/json");
    expect(schema.fields.prompt.required).toBe(true);
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedream.v5.lite.textToImage).toBe(
      provider.post.run.bytedance.seedream.v5.lite.textToImage
    );
  });
});
