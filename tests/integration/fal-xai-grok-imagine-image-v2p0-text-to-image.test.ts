import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalXaiGrokImagineImageV2p0TextToImageRequestSchema } from "@apicity/fal/zod";

describe("fal xai grok-imagine-image v2.0 text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/xai-grok-imagine-image-v2p0-text-to-image"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.xai.grokImagineImage.v2p0.textToImage({
      prompt: "A serene mountain landscape at sunrise.",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(result.revised_prompt).toBeNull();
  }, 300000);

  it("should accept a minimal payload", () => {
    expect(
      FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
        prompt: "a serene mountain landscape",
      }).success
    ).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    const result = FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse(
      {}
    );
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("prompt"))
    ).toBe(true);
  });

  it("should reject an empty prompt", () => {
    expect(
      FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
        prompt: "",
      }).success
    ).toBe(false);
  });

  it("should enforce the image-count boundaries", () => {
    for (const numImages of [1, 4]) {
      expect(
        FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          num_images: numImages,
        }).success
      ).toBe(true);
    }
    for (const numImages of [0, 5]) {
      expect(
        FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          num_images: numImages,
        }).success
      ).toBe(false);
    }
  });

  it("should accept every published aspect ratio", () => {
    for (const aspectRatio of [
      "2:1",
      "20:9",
      "19.5:9",
      "16:9",
      "4:3",
      "3:2",
      "1:1",
      "2:3",
      "3:4",
      "9:16",
      "9:19.5",
      "9:20",
      "1:2",
    ] as const) {
      expect(
        FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          aspect_ratio: aspectRatio,
        }).success
      ).toBe(true);
    }
    expect(
      FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        aspect_ratio: "auto",
      }).success
    ).toBe(false);
  });

  it.each([
    ["resolution", ["1k", "2k"], "4k"],
    ["quality", ["low", "medium"], "high"],
    ["output_format", ["jpeg", "png", "webp"], "gif"],
  ] as const)(
    "should enforce the published %s enum",
    (field, accepted, rejected) => {
      for (const value of accepted) {
        expect(
          FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
            prompt: "a cat",
            [field]: value,
          }).success
        ).toBe(true);
      }
      expect(
        FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          [field]: rejected,
        }).success
      ).toBe(false);
    }
  );

  it("should enforce boolean sync_mode values", () => {
    for (const syncMode of [true, false]) {
      expect(
        FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
          prompt: "a cat",
          sync_mode: syncMode,
        }).success
      ).toBe(true);
    }
    expect(
      FalXaiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
        prompt: "a cat",
        sync_mode: "true",
      }).success
    ).toBe(false);
  });

  it("should expose the schema by identity", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineImage.v2p0.textToImage.schema).toBe(
      FalXaiGrokImagineImageV2p0TextToImageRequestSchema
    );
  });

  it("should preserve v1 and share the v2 endpoint via post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineImage.v2p0.textToImage).not.toBe(
      provider.run.xai.grokImagineImage
    );
    expect(provider.run.xai.grokImagineImage.v2p0.textToImage).toBe(
      provider.post.run.xai.grokImagineImage.v2p0.textToImage
    );
  });
});
