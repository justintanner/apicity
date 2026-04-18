import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal kling-video v3 pro text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-v3-pro-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.klingVideo.v3.pro.textToVideo({
      prompt:
        "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
      aspect_ratio: "1:1",
      duration: "5",
      generate_audio: false,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.v3.pro.textToVideo.schema.safeParse({
      prompt: "a serene landscape",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload with cfg_scale out of range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.v3.pro.textToVideo.schema.safeParse({
      prompt: "a cat",
      cfg_scale: 5,
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid aspect_ratio", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.v3.pro.textToVideo.schema.safeParse({
      prompt: "a cat",
      aspect_ratio: "4:3",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.klingVideo.v3.pro.textToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.klingVideo.v3.pro.textToVideo).toBe(
      provider.post.run.klingVideo.v3.pro.textToVideo
    );
  });
});
