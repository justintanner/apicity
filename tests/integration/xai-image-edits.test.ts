import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai image edits integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/image-edits");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    // Create a simple image blob for testing
    const imageBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    const image = new File([blob], "test-image.jpg", { type: "image/jpeg" });

    const result = await provider.post.v1.images.edits({
      model: "grok-2-image-1212",
      image,
      prompt: "Add a sunset background",
      n: 1,
    });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should validate payload schema for required fields", () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const validation = provider.post.v1.images.edits.validatePayload({
      model: "grok-2-image-1212",
      image: {},
      prompt: "Edit this image",
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const validation = provider.post.v1.images.edits.validatePayload({});

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("model is required");
    expect(validation.errors).toContain("image is required");
    expect(validation.errors).toContain("prompt is required");
  });
});
