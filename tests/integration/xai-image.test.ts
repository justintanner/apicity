import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

const cat1Base64 = readFileSync(
  resolve(__dirname, "../fixtures/cat1.jpg")
).toString("base64");
const cat1DataUri = `data:image/jpeg;base64,${cat1Base64}`;

describe("xai image generation integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a prompt", async () => {
    ctx = setupPolly("xai/image-generate-basic");
    const provider = createXaiProvider();
    const result = await provider.post.v1.images.generations({
      prompt: "A simple red apple on a white background",
      model: "grok-imagine-image",
      n: 1,
    });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].url || result.data[0].b64_json).toBeTruthy();
  });

  it("should generate multiple images", async () => {
    ctx = setupPolly("xai/image-generate-multiple");
    const provider = createXaiProvider();
    const result = await provider.post.v1.images.generations({
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
    ctx = setupPolly("xai/image-generate-aspect-ratio");
    const provider = createXaiProvider();
    const result = await provider.post.v1.images.generations({
      prompt: "A mountain landscape",
      model: "grok-imagine-image",
      aspect_ratio: "16:9",
    });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("should support resolution parameter", async () => {
    ctx = setupPolly("xai/image-generate-resolution");
    const provider = createXaiProvider();
    const result = await provider.post.v1.images.generations({
      prompt: "A simple geometric pattern",
      model: "grok-imagine-image",
      resolution: "1k",
    });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("should support b64_json response format", async () => {
    ctx = setupPolly("xai/image-generate-b64");
    const provider = createXaiProvider();
    const result = await provider.post.v1.images.generations({
      prompt: "A green leaf",
      model: "grok-imagine-image",
      response_format: "b64_json",
      n: 1,
    });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.data[0].b64_json).toBeTruthy();
  });

  it(
    "should edit an image with a single image reference",
    { timeout: 60_000 },
    async () => {
      ctx = setupPolly("xai/image-edit-single");
      const provider = createXaiProvider();
      const result = await provider.post.v1.images.edits({
        prompt: "Render this as a pencil sketch with detailed shading",
        model: "grok-imagine-image",
        image: {
          url: cat1DataUri,
          type: "image_url",
        },
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].url || result.data[0].b64_json).toBeTruthy();
    }
  );

  it("should support aspect_ratio for image editing", async () => {
    ctx = setupPolly("xai/image-edit-aspect-ratio");
    const provider = createXaiProvider();
    const result = await provider.post.v1.images.edits({
      prompt: "Transform the cat into a watercolor painting with soft edges",
      model: "grok-imagine-image",
      image: {
        url: cat1DataUri,
        type: "image_url",
      },
      aspect_ratio: "1:1",
    });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
  });
});
