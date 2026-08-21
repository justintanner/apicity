import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3TextToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal FLUX 3 text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.blackforestlabs.flux3.textToVideo({
      prompt: "A paper boat glides through a quiet rain puddle",
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFlux3TextToVideoRequestSchema.safeParse({
      prompt: "A paper boat glides through a quiet rain puddle",
      aspect_ratio: "16:9",
      resolution: "1080p",
      duration: "auto",
      generate_audio: true,
      safety_tolerance: 2,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid duration and resolution values", () => {
    expect(
      FalFlux3TextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        duration: 21,
      }).success
    ).toBe(false);
    expect(
      FalFlux3TextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        resolution: "4k",
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.textToVideo.schema).toBe(
      FalFlux3TextToVideoRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.textToVideo).toBe(
      provider.post.run.blackforestlabs.flux3.textToVideo
    );
  });
});
