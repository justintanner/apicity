import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFluxVideoUpscaleRequestSchema } from "@apicity/fal/zod";

function videoDataUrl(name: string): string {
  const fixturePath = path.resolve(import.meta.dirname, "..", "fixtures", name);
  return `data:video/mp4;base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
}

describe("fal FLUX video upscale integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-video-upscale");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upscale an existing video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.blackforestlabs.fluxVideoUpscale({
      video_url: videoDataUrl("jump.mp4"),
      upscale_factor: 1.5,
      creativity: 0,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a representative payload", () => {
    const result = FalFluxVideoUpscaleRequestSchema.safeParse({
      video_url: "https://example.com/jump.mp4",
      upscale_factor: 2,
      creativity: 1,
      prompt: null,
      safety_tolerance: 2,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid upscale factor and creativity values", () => {
    const base = { video_url: "https://example.com/jump.mp4" };
    expect(
      FalFluxVideoUpscaleRequestSchema.safeParse({
        ...base,
        upscale_factor: 4,
      }).success
    ).toBe(false);
    expect(
      FalFluxVideoUpscaleRequestSchema.safeParse({
        ...base,
        creativity: 2,
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.fluxVideoUpscale.schema).toBe(
      FalFluxVideoUpscaleRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.fluxVideoUpscale).toBe(
      provider.post.run.blackforestlabs.fluxVideoUpscale
    );
  });
});
