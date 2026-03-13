import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai image generation integration", () => {
  let ctx: PollyContext;

  describe("generateImage", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/image-generate");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should generate an image from a prompt", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.images.generations({
        prompt: "A simple red apple on a white background",
        model: "grok-imagine-image",
        n: 1,
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].url || result.data[0].b64_json).toBeTruthy();
    });

    it("should generate multiple images", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.images.generations({
        prompt: "A simple blue circle",
        model: "grok-imagine-image",
        n: 2,
      });

      expect(result.data).toHaveLength(2);
      result.data.forEach((img) => {
        expect(img.url || img.b64_json).toBeTruthy();
      });
    });

    it("should support aspect_ratio parameter", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.images.generations({
        prompt: "A mountain landscape",
        model: "grok-imagine-image",
        aspect_ratio: "16:9",
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should support resolution parameter", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.images.generations({
        prompt: "A simple geometric pattern",
        model: "grok-imagine-image",
        resolution: "1k",
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should support b64_json response format", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.images.generations({
        prompt: "A green leaf",
        model: "grok-imagine-image",
        response_format: "b64_json",
        n: 1,
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data[0].b64_json).toBeTruthy();
    });
  });

  describe("editImage", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/image-edit");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should edit an image with a single image reference", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });

      // For this test, we use a publicly accessible image URL
      // In practice, this would be a URL from a previous generation or a public image
      const result = await provider.v1.images.edits({
        prompt: "Add a colorful background to this image",
        model: "grok-imagine-image",
        image: {
          url: "https://picsum.photos/200/200",
          type: "image_url",
        },
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].url || result.data[0].b64_json).toBeTruthy();
    });

    it("should support aspect_ratio for image editing", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.images.edits({
        prompt: "Make this image more vibrant",
        model: "grok-imagine-image",
        image: {
          url: "https://picsum.photos/200/200",
          type: "image_url",
        },
        aspect_ratio: "1:1",
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
