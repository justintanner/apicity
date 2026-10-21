import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3MaxImageToVideoRequestSchema } from "@apicity/fal/zod";

// Pinned against the live queue OpenAPI read on 2026-10-21.
describe("fal FLUX 3 Max image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-max-image-to-video");
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
      "cat1.jpg"
    );
    const imageDataUrl = `data:image/jpeg;base64,${fs
      .readFileSync(fixturePath)
      .toString("base64")}`;

    const result = await provider.run.blackforestlabs.flux3Max.imageToVideo({
      prompt: "The cat turns its head and blinks",
      image_url: imageDataUrl,
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFlux3MaxImageToVideoRequestSchema.safeParse({
      prompt: "The cat turns its head",
      image_url: "https://example.com/cat.jpg",
      end_image_url: "https://example.com/cat-end.jpg",
      resolution: "1080p",
      duration: 5,
      reasoning_level: "low",
      seed: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid duration and resolution values", () => {
    expect(
      FalFlux3MaxImageToVideoRequestSchema.safeParse({
        prompt: "The cat turns its head",
        image_url: "https://example.com/cat.jpg",
        duration: "auto",
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxImageToVideoRequestSchema.safeParse({
        prompt: "The cat turns its head",
        image_url: "https://example.com/cat.jpg",
        duration: 21,
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxImageToVideoRequestSchema.safeParse({
        prompt: "The cat turns its head",
        image_url: "https://example.com/cat.jpg",
        resolution: "4k",
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxImageToVideoRequestSchema.safeParse({
        prompt: "The cat turns its head",
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3Max.imageToVideo.schema).toBe(
      FalFlux3MaxImageToVideoRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3Max.imageToVideo).toBe(
      provider.post.run.blackforestlabs.flux3Max.imageToVideo
    );
  });
});
