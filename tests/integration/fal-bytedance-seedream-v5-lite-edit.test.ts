import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@apicity/fal";

describe("fal bytedance seedream v5 lite edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedream-v5-lite-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit images with a prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.bytedance.seedream.v5.lite.edit({
      prompt:
        "Change the background to a beautiful sunset beach scene with palm trees",
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
    const v = provider.run.bytedance.seedream.v5.lite.edit.validatePayload({
      prompt: "a beautiful landscape",
      image_urls: ["https://example.com/image.png"],
    });
    expect(v.valid).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.lite.edit.validatePayload({});
    expect(v.valid).toBe(false);
    expect(v.errors).toContain("prompt is required");
    expect(v.errors).toContain("image_urls is required");
  });

  it("should reject payload with wrong enum value for image_size", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.lite.edit.validatePayload({
      prompt: "a cat",
      image_urls: ["https://example.com/cat.png"],
      image_size: "auto_8K",
    });
    expect(v.valid).toBe(false);
  });

  it("should reject non-string items in image_urls", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.lite.edit.validatePayload({
      prompt: "a cat",
      image_urls: [123, 456],
    });
    expect(v.valid).toBe(false);
  });

  it("should expose payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedream.v5.lite.edit.payloadSchema;
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/fal-ai/bytedance/seedream/v5/lite/edit");
    expect(schema.contentType).toBe("application/json");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.image_urls.required).toBe(true);
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedream.v5.lite.edit).toBe(
      provider.post.run.bytedance.seedream.v5.lite.edit
    );
  });
});
