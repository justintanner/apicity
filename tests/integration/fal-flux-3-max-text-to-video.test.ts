import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3MaxTextToVideoRequestSchema } from "@apicity/fal/zod";

// Pinned against the live queue OpenAPI read on 2026-10-21.
describe("fal FLUX 3 Max text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-max-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.blackforestlabs.flux3Max.textToVideo({
      prompt: "A paper boat glides through a quiet rain puddle",
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFlux3MaxTextToVideoRequestSchema.safeParse({
      prompt: "A paper boat glides through a quiet rain puddle",
      aspect_ratio: "16:9",
      resolution: "1080p",
      duration: 8,
      generate_audio: true,
      reasoning_level: "high",
      seed: 7,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid duration, resolution, and prompt values", () => {
    expect(
      FalFlux3MaxTextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        duration: "auto",
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxTextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        duration: 4,
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxTextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        duration: 21,
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxTextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        resolution: "4k",
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxTextToVideoRequestSchema.safeParse({
        prompt: "",
      }).success
    ).toBe(false);
    expect(
      FalFlux3MaxTextToVideoRequestSchema.safeParse({
        prompt: "A paper boat",
        reasoning_level: "medium",
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3Max.textToVideo.schema).toBe(
      FalFlux3MaxTextToVideoRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3Max.textToVideo).toBe(
      provider.post.run.blackforestlabs.flux3Max.textToVideo
    );
  });
});
