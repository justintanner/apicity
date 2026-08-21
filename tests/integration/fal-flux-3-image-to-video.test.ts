import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3ImageToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal FLUX 3 image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from an image", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const imageDataUrl = `data:image/jpeg;base64,${fs
      .readFileSync(fixturePath)
      .toString("base64")}`;

    const result = await provider.run.blackforestlabs.flux3.imageToVideo({
      prompt: "The person turns toward the camera and smiles",
      image_url: imageDataUrl,
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFlux3ImageToVideoRequestSchema.safeParse({
      prompt: "The subject waves",
      image_url: "https://example.com/image.jpg",
      resolution: "1080p",
      duration: "auto",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid duration and resolution values", () => {
    expect(
      FalFlux3ImageToVideoRequestSchema.safeParse({
        prompt: "The subject waves",
        image_url: "https://example.com/image.jpg",
        duration: 21,
      }).success
    ).toBe(false);
    expect(
      FalFlux3ImageToVideoRequestSchema.safeParse({
        prompt: "The subject waves",
        image_url: "https://example.com/image.jpg",
        resolution: "4k",
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.imageToVideo.schema).toBe(
      FalFlux3ImageToVideoRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.imageToVideo).toBe(
      provider.post.run.blackforestlabs.flux3.imageToVideo
    );
  });
});
