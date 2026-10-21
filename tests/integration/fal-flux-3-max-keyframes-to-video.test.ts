import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3MaxKeyframesToVideoRequestSchema } from "@apicity/fal/zod";

function imageDataUrl(name: string): string {
  const fixturePath = path.resolve(import.meta.dirname, "..", "fixtures", name);
  return `data:image/jpeg;base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
}

// Pinned against the live queue OpenAPI read on 2026-10-21.
describe("fal FLUX 3 Max keyframes-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-max-keyframes-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video guided by ordered keyframes", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.blackforestlabs.flux3Max.keyframesToVideo(
      {
        prompt: "A cat shifts its pose in one continuous shot",
        keyframes: [
          { image_url: imageDataUrl("cat1.jpg"), frame_index: 0 },
          { image_url: imageDataUrl("cat2.jpg"), frame_index: 96 },
        ],
        resolution: "720p",
        duration: 5,
        generate_audio: false,
      }
    );

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFlux3MaxKeyframesToVideoRequestSchema.safeParse({
      prompt: "A cat shifts its pose",
      keyframes: [
        { image_url: "https://example.com/one.jpg", frame_index: 0 },
        { image_url: "https://example.com/two.jpg", frame_index: 96 },
      ],
      resolution: "1080p",
      duration: 5,
      reasoning_level: "low",
    });
    expect(result.success).toBe(true);
  });

  it("should reject auto duration and invalid keyframe counts", () => {
    const frame = {
      image_url: "https://example.com/frame.jpg",
      frame_index: 0,
    };
    expect(
      FalFlux3MaxKeyframesToVideoRequestSchema.safeParse({
        prompt: "p",
        keyframes: [frame],
        duration: "auto",
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxKeyframesToVideoRequestSchema.safeParse({
        prompt: "p",
        keyframes: [],
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxKeyframesToVideoRequestSchema.safeParse({
        prompt: "p",
        keyframes: Array.from({ length: 11 }, () => frame),
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxKeyframesToVideoRequestSchema.safeParse({
        prompt: "p",
        keyframes: [{ image_url: "https://example.com/frame.jpg" }],
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3Max.keyframesToVideo.schema).toBe(
      FalFlux3MaxKeyframesToVideoRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3Max.keyframesToVideo).toBe(
      provider.post.run.blackforestlabs.flux3Max.keyframesToVideo
    );
  });
});
