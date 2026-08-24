import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalSeedance2p5TextToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal bytedance seedance2p5 text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/bytedance-seedance2p5-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short 480p video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.bytedance.seedance2p5.textToVideo({
      prompt:
        "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
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
      provider.run.bytedance.seedance2p5.textToVideo.schema.safeParse({
        prompt: "a serene mountain sunset",
      });
    expect(result.success).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.textToVideo.schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("prompt"))
    ).toBe(true);
  });

  it("should reject an unknown resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.textToVideo.schema.safeParse({
        prompt: "a cat",
        resolution: "4k",
      });
    expect(result.success).toBe(false);
  });

  it("should reject an out-of-range duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.textToVideo.schema.safeParse({
        prompt: "a cat",
        duration: "31",
      });
    expect(result.success).toBe(false);
  });

  it("should accept the expanded 2.5 resolution and duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.textToVideo.schema;
    expect(schema.safeParse({ prompt: "a cat", duration: "30" }).success).toBe(
      true
    );
    expect(
      schema.safeParse({ prompt: "a cat", resolution: "1080p" }).success
    ).toBe(true);
  });

  it("should reject an unknown bitrate mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.textToVideo.schema.safeParse({
        prompt: "a cat",
        bitrate_mode: "ultra",
      });
    expect(result.success).toBe(false);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.textToVideo.schema;
    expect(schema).toBe(FalSeedance2p5TextToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedance2p5.textToVideo).toBe(
      provider.post.run.bytedance.seedance2p5.textToVideo
    );
  });
});
