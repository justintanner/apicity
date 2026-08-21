import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3FirstLastFrameToVideoRequestSchema } from "@apicity/fal/zod";

function imageDataUrl(name: string): string {
  const fixturePath = path.resolve(import.meta.dirname, "..", "fixtures", name);
  return `data:image/jpeg;base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
}

describe("fal FLUX 3 first-last-frame-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-first-last-frame-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video between two frames", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result =
      await provider.run.blackforestlabs.flux3.firstLastFrameToVideo({
        prompt: "A cat walks across the frame in one continuous shot",
        start_image_url: imageDataUrl("cat1.jpg"),
        end_image_url: imageDataUrl("cat2.jpg"),
        resolution: "720p",
        duration: 5,
        generate_audio: false,
      });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFlux3FirstLastFrameToVideoRequestSchema.safeParse({
      prompt: "A cat walks across the frame",
      start_image_url: "https://example.com/start.jpg",
      end_image_url: "https://example.com/end.jpg",
      resolution: "1080p",
      duration: 10,
    });
    expect(result.success).toBe(true);
  });

  it("should reject auto and out-of-range duration values", () => {
    const base = {
      prompt: "A cat walks across the frame",
      start_image_url: "https://example.com/start.jpg",
      end_image_url: "https://example.com/end.jpg",
    };
    expect(
      FalFlux3FirstLastFrameToVideoRequestSchema.safeParse({
        ...base,
        duration: "auto",
      }).success
    ).toBe(false);
    expect(
      FalFlux3FirstLastFrameToVideoRequestSchema.safeParse({
        ...base,
        duration: 21,
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(
      provider.run.blackforestlabs.flux3.firstLastFrameToVideo.schema
    ).toBe(FalFlux3FirstLastFrameToVideoRequestSchema);
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.firstLastFrameToVideo).toBe(
      provider.post.run.blackforestlabs.flux3.firstLastFrameToVideo
    );
  });
});
