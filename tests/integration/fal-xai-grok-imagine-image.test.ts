import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalXaiGrokImagineImageRequestSchema } from "@apicity/fal/zod";

describe("fal xai grok-imagine-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/xai-grok-imagine-image");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.xai.grokImagineImage({
      prompt:
        "Abstract human silhouette, golden particles ready to burst outward representing joy, data visualization style, emotional expression through particles, artistic scientific",
      num_images: 1,
      aspect_ratio: "1:1",
      resolution: "1k",
      output_format: "jpeg",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.revised_prompt).toBe("string");
  }, 300000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.schema.safeParse({
      prompt: "a serene mountain landscape",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.schema.safeParse({});
    expect(v.success).toBe(false);
  });

  it("should reject num_images outside 1-4 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.schema.safeParse({
      prompt: "a cat",
      num_images: 5,
    });
    expect(v.success).toBe(false);
  });

  it("should reject invalid aspect_ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.schema.safeParse({
      prompt: "a cat",
      aspect_ratio: "5:7",
    });
    expect(v.success).toBe(false);
  });

  it("should reject invalid resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineImage.schema.safeParse({
      prompt: "a cat",
      resolution: "4k",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.xai.grokImagineImage.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalXaiGrokImagineImageRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineImage).toBe(
      provider.post.run.xai.grokImagineImage
    );
  });
});
