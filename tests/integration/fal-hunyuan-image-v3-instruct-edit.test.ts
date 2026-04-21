import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal hunyuan-image v3 instruct edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/hunyuan-image-v3-instruct-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image with a prompt", async () => {
    const provider = fal({
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

    const result = await provider.run.hunyuan.v3.instructEdit({
      prompt: "Turn this cat into a watercolor painting",
      image_urls: [imageDataUrl],
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
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "Turn this artwork into a realistic image",
      image_urls: ["https://example.com/image.jpg"],
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing image_urls", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
    });
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("image_urls"))).toBe(
      true
    );
  });

  it("should reject empty image_urls array", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
      image_urls: [],
    });
    expect(v.success).toBe(false);
  });

  it("should reject more than 3 image_urls (max is 3)", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
      image_urls: [
        "https://example.com/a.jpg",
        "https://example.com/b.jpg",
        "https://example.com/c.jpg",
        "https://example.com/d.jpg",
      ],
    });
    expect(v.success).toBe(false);
  });

  it("should reject num_images outside 1-4 range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
      image_urls: ["https://example.com/a.jpg"],
      num_images: 5,
    });
    expect(v.success).toBe(false);
  });

  it("should reject guidance_scale outside 1-20 range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
      image_urls: ["https://example.com/a.jpg"],
      guidance_scale: 25,
    });
    expect(v.success).toBe(false);
  });

  it("should accept valid image_size enum values", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
      image_urls: ["https://example.com/a.jpg"],
      image_size: "square_hd",
    });
    expect(v.success).toBe(true);
  });

  it("should accept valid image_size object", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.hunyuan.v3.instructEdit.schema.safeParse({
      prompt: "a cat",
      image_urls: ["https://example.com/a.jpg"],
      image_size: { width: 1024, height: 1024 },
    });
    expect(v.success).toBe(true);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.hunyuan.v3.instructEdit.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.hunyuan.v3.instructEdit).toBe(
      provider.post.run.hunyuan.v3.instructEdit
    );
  });
});
