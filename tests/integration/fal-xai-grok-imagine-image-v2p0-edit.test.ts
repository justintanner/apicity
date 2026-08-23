import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalXaiGrokImagineImageV2p0EditRequestSchema } from "@apicity/fal/zod";

describe("fal xai grok-imagine-image v2.0 edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/xai-grok-imagine-image-v2p0-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image from an input image and prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "cat1.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.xai.grokImagineImage.v2p0.edit({
      prompt: "Turn this cat into a watercolor painting.",
      image_urls: [imageDataUrl],
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
      FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
        prompt: "turn this cat into a watercolor painting",
        image_urls: ["https://example.com/cat.jpg"],
      }).success
    ).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    expect(
      FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
        image_urls: ["https://example.com/cat.jpg"],
      }).success
    ).toBe(false);
  });

  it("should reject an empty prompt", () => {
    expect(
      FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
        prompt: "",
        image_urls: ["https://example.com/cat.jpg"],
      }).success
    ).toBe(false);
  });

  it("should require one to three image URLs", () => {
    for (const imageUrls of [
      undefined,
      [],
      [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
      ],
    ]) {
      expect(
        FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
          prompt: "a cat",
          ...(imageUrls === undefined ? {} : { image_urls: imageUrls }),
        }).success
      ).toBe(false);
    }
  });

  it("should enforce the image-count boundaries", () => {
    for (const numImages of [1, 4]) {
      expect(
        FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
          prompt: "a cat",
          image_urls: ["https://example.com/cat.jpg"],
          num_images: numImages,
        }).success
      ).toBe(true);
    }
    for (const numImages of [0, 5]) {
      expect(
        FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
          prompt: "a cat",
          image_urls: ["https://example.com/cat.jpg"],
          num_images: numImages,
        }).success
      ).toBe(false);
    }
  });

  it("should accept every published aspect ratio", () => {
    for (const aspectRatio of [
      "auto",
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
        FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
          prompt: "a cat",
          image_urls: ["https://example.com/cat.jpg"],
          aspect_ratio: aspectRatio,
        }).success
      ).toBe(true);
    }
    expect(
      FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
        prompt: "a cat",
        image_urls: ["https://example.com/cat.jpg"],
        aspect_ratio: "3:1",
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
          FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
            prompt: "a cat",
            image_urls: ["https://example.com/cat.jpg"],
            [field]: value,
          }).success
        ).toBe(true);
      }
      expect(
        FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
          prompt: "a cat",
          image_urls: ["https://example.com/cat.jpg"],
          [field]: rejected,
        }).success
      ).toBe(false);
    }
  );

  it("should enforce boolean sync_mode values", () => {
    for (const syncMode of [true, false]) {
      expect(
        FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
          prompt: "a cat",
          image_urls: ["https://example.com/cat.jpg"],
          sync_mode: syncMode,
        }).success
      ).toBe(true);
    }
    expect(
      FalXaiGrokImagineImageV2p0EditRequestSchema.safeParse({
        prompt: "a cat",
        image_urls: ["https://example.com/cat.jpg"],
        sync_mode: "true",
      }).success
    ).toBe(false);
  });

  it("should expose the schema by identity", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineImage.v2p0.edit.schema).toBe(
      FalXaiGrokImagineImageV2p0EditRequestSchema
    );
  });

  it("should preserve v1 and share the v2 endpoint via post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineImage.v2p0.edit).not.toBe(
      provider.run.xai.grokImagineImage.edit
    );
    expect(provider.run.xai.grokImagineImage.v2p0.edit).not.toBe(
      provider.run.xai.grokImagineImage.v2p0.textToImage
    );
    expect(provider.run.xai.grokImagineImage.v2p0.edit).toBe(
      provider.post.run.xai.grokImagineImage.v2p0.edit
    );
  });
});
