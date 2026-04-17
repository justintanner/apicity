import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal bytedance seedream v5 lite edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/bytedance-seedream-v5-lite-edit");
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
    const v = provider.run.bytedance.seedream.v5.lite.edit.schema.safeParse({
      prompt: "a beautiful landscape",
      image_urls: ["https://example.com/image.png"],
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.lite.edit.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(v.error?.issues.some((i) => i.path.includes("image_urls"))).toBe(
      true
    );
  });

  it("should reject payload with wrong enum value for image_size", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.lite.edit.schema.safeParse({
      prompt: "a cat",
      image_urls: ["https://example.com/cat.png"],
      image_size: "auto_8K",
    });
    expect(v.success).toBe(false);
  });

  it("should reject non-string items in image_urls", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.bytedance.seedream.v5.lite.edit.schema.safeParse({
      prompt: "a cat",
      image_urls: [123, 456],
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedream.v5.lite.edit.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedream.v5.lite.edit).toBe(
      provider.post.run.bytedance.seedream.v5.lite.edit
    );
  });
});
