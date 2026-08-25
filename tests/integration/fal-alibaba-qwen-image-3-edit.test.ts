import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { FalAlibabaQwenImage3EditRequestSchema } from "@apicity/fal/zod";

describe("fal alibaba qwen-image-3 edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/alibaba-qwen-image-3-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit cat1.jpg from a text instruction", async () => {
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
    const imageDataUrl = `data:image/jpeg;base64,${fs
      .readFileSync(fixturePath)
      .toString("base64")}`;

    const result = await provider.run.alibaba.qwenImage3.edit({
      prompt: "Give the cat in image 1 a small red knitted scarf.",
      image_urls: [imageDataUrl],
      image_size: "square",
      num_images: 1,
      output_format: "png",
    });

    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 300000);

  it("should validate a minimal payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.qwenImage3.edit.schema.safeParse({
      prompt: "add a scarf",
      image_urls: ["https://example.com/cat.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject a payload missing image_urls", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.qwenImage3.edit.schema.safeParse({
      prompt: "add a scarf",
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("image_urls"))
    ).toBe(true);
  });

  it("should enforce the published 1-3 reference-image range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.qwenImage3.edit.schema;
    const url = "https://example.com/cat.jpg";
    expect(schema.safeParse({ prompt: "p", image_urls: [] }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ prompt: "p", image_urls: Array(3).fill(url) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ prompt: "p", image_urls: Array(4).fill(url) }).success
    ).toBe(false);
  });

  it("should bound the image_size total pixel count", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.qwenImage3.edit.schema;
    const base = { prompt: "p", image_urls: ["https://example.com/cat.jpg"] };
    // The docs page's own 1280x720 example must parse.
    expect(
      schema.safeParse({ ...base, image_size: { width: 1280, height: 720 } })
        .success
    ).toBe(true);
    expect(
      schema.safeParse({ ...base, image_size: { width: 100, height: 100 } })
        .success
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, image_size: { width: 4096, height: 4096 } })
        .success
    ).toBe(false);
    expect(schema.safeParse({ ...base, image_size: "square_hd" }).success).toBe(
      true
    );
  });

  it("should bound num_images to the published 1-6 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.qwenImage3.edit.schema;
    const base = { prompt: "p", image_urls: ["https://example.com/cat.jpg"] };
    expect(schema.safeParse({ ...base, num_images: 1 }).success).toBe(true);
    expect(schema.safeParse({ ...base, num_images: 6 }).success).toBe(true);
    expect(schema.safeParse({ ...base, num_images: 7 }).success).toBe(false);
  });

  it("should reject an unknown output format", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.qwenImage3.edit.schema.safeParse({
      prompt: "p",
      image_urls: ["https://example.com/cat.jpg"],
      output_format: "gif",
    });
    expect(result.success).toBe(false);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.qwenImage3.edit.schema;
    expect(schema).toBe(FalAlibabaQwenImage3EditRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.alibaba.qwenImage3.edit).toBe(
      provider.post.run.alibaba.qwenImage3.edit
    );
  });
});
