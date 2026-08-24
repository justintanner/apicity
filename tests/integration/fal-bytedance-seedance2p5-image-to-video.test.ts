import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { FalSeedance2p5ImageToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal bytedance seedance2p5 image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p5-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short 480p video from cat1.jpg", async () => {
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

    const result = await provider.run.bytedance.seedance2p5.imageToVideo({
      prompt:
        "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
      image_url: imageDataUrl,
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 300000);

  it("should validate a minimal payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.imageToVideo.schema.safeParse({
        prompt: "a cat turns toward the camera",
        image_url: "https://example.com/cat.jpg",
      });
    expect(result.success).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.imageToVideo.schema.safeParse({
        image_url: "https://example.com/cat.jpg",
      });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("prompt"))
    ).toBe(true);
  });

  it("should reject a payload missing image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.imageToVideo.schema.safeParse({
        prompt: "a cat turns toward the camera",
      });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("image_url"))
    ).toBe(true);
  });

  it("should reject an unknown resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.imageToVideo.schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
        resolution: "4k",
      });
    expect(result.success).toBe(false);
  });

  it("should reject an out-of-range duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.imageToVideo.schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
        duration: "31",
      });
    expect(result.success).toBe(false);
  });

  it("should accept the expanded 2.5 resolution and duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.imageToVideo.schema;
    expect(
      schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
        duration: "30",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
        resolution: "1080p",
      }).success
    ).toBe(true);
  });

  it("should reject an unknown bitrate mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.imageToVideo.schema.safeParse({
        prompt: "a cat",
        image_url: "https://example.com/cat.jpg",
        bitrate_mode: "ultra",
      });
    expect(result.success).toBe(false);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.imageToVideo.schema;
    expect(schema).toBe(FalSeedance2p5ImageToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedance2p5.imageToVideo).toBe(
      provider.post.run.bytedance.seedance2p5.imageToVideo
    );
  });
});
