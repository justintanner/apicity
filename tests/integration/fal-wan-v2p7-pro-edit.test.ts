import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal wan v2.7 pro edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/wan-v2p7-pro-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.wan.v2p7.pro.edit({
      prompt: "Turn image 1 into a watercolor painting.",
      image_urls: [
        "https://storage.googleapis.com/falserverless/model_tests/wan/dragon-warrior.jpg",
      ],
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
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.pro.edit.schema.safeParse({
      prompt: "make it a watercolor",
      image_urls: ["https://example.com/image.jpg"],
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing image_urls", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.pro.edit.schema.safeParse({
      prompt: "a cat",
    });
    expect(v.success).toBe(false);
  });

  it("should reject more than 4 image_urls", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.pro.edit.schema.safeParse({
      prompt: "a cat",
      image_urls: [
        "https://example.com/a.jpg",
        "https://example.com/b.jpg",
        "https://example.com/c.jpg",
        "https://example.com/d.jpg",
        "https://example.com/e.jpg",
      ],
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.wan.v2p7.pro.edit.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.wan.v2p7.pro.edit).toBe(
      provider.post.run.wan.v2p7.pro.edit
    );
  });
});
