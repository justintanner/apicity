import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { FalWan3p0ImageToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal alibaba wan3p0 image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/wan3p0-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should animate cat1.jpg into a short 480p video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
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

    const result = await provider.run.alibaba.wan3p0.imageToVideo({
      prompt:
        "The cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
      start_image_url: imageDataUrl,
      resolution: "480p",
      aspect_ratio: "1:1",
      duration: 2,
      audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.duration).toBe("number");
  }, 900000);

  it("should validate a minimal payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.wan3p0.imageToVideo.schema.safeParse({
      start_image_url: "https://example.com/cat.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should reject a payload missing start_image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.wan3p0.imageToVideo.schema.safeParse({
      prompt: "the cat blinks",
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) =>
        issue.path.includes("start_image_url")
      )
    ).toBe(true);
  });

  it("should accept an optional end_image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.wan3p0.imageToVideo.schema.safeParse({
      start_image_url: "https://example.com/cat.jpg",
      end_image_url: "https://example.com/cat2.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should reject a non-URL start_image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result = provider.run.alibaba.wan3p0.imageToVideo.schema.safeParse({
      start_image_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should bound duration to the published 2-30 second range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0.imageToVideo.schema;
    const base = { start_image_url: "https://example.com/cat.jpg" };
    expect(schema.safeParse({ ...base, duration: 2 }).success).toBe(true);
    expect(schema.safeParse({ ...base, duration: 30 }).success).toBe(true);
    expect(schema.safeParse({ ...base, duration: 1 }).success).toBe(false);
    expect(schema.safeParse({ ...base, duration: 31 }).success).toBe(false);
    expect(schema.safeParse({ ...base, duration: null }).success).toBe(true);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0.imageToVideo.schema;
    expect(schema).toBe(FalWan3p0ImageToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.alibaba.wan3p0.imageToVideo).toBe(
      provider.post.run.alibaba.wan3p0.imageToVideo
    );
  });
});
