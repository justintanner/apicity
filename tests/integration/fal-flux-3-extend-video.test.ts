import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalFlux3ExtendVideoRequestSchema } from "@apicity/fal/zod";

function videoDataUrl(name: string): string {
  const fixturePath = path.resolve(import.meta.dirname, "..", "fixtures", name);
  return `data:video/mp4;base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
}

describe("fal FLUX 3 extend-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-extend-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should extend an existing video", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.blackforestlabs.flux3.extendVideo({
      prompt: "The jump continues into a smooth landing",
      video_url: videoDataUrl("jump.mp4"),
      resolution: "720p",
      duration: 5,
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate mixed duration values", () => {
    const base = {
      prompt: "The jump continues",
      video_url: "https://example.com/jump.mp4",
    };
    expect(
      FalFlux3ExtendVideoRequestSchema.safeParse({
        ...base,
        duration: "auto",
      }).success
    ).toBe(true);
    expect(
      FalFlux3ExtendVideoRequestSchema.safeParse({ ...base, duration: 5 })
        .success
    ).toBe(true);
  });

  it("should reject invalid duration and resolution values", () => {
    const base = {
      prompt: "The jump continues",
      video_url: "https://example.com/jump.mp4",
    };
    expect(
      FalFlux3ExtendVideoRequestSchema.safeParse({ ...base, duration: 4 })
        .success
    ).toBe(false);
    expect(
      FalFlux3ExtendVideoRequestSchema.safeParse({ ...base, duration: 21 })
        .success
    ).toBe(false);
    expect(
      FalFlux3ExtendVideoRequestSchema.safeParse({
        ...base,
        resolution: "4k",
      }).success
    ).toBe(false);
  });

  it("should expose the exact request schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.extendVideo.schema).toBe(
      FalFlux3ExtendVideoRequestSchema
    );
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.blackforestlabs.flux3.extendVideo).toBe(
      provider.post.run.blackforestlabs.flux3.extendVideo
    );
  });
});
