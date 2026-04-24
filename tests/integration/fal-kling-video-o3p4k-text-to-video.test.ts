import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal kling-video o3/4k text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-o3p4k-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.klingVideo.o3p4k.textToVideo({
      prompt:
        'A mecha lands on the ground to save the city, and says "I\'m here", in anime style',
      aspect_ratio: "16:9",
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
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({
      prompt: "a serene landscape",
    });
    expect(v.success).toBe(true);
  });

  it("should accept an empty payload (all fields optional)", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({});
    expect(v.success).toBe(true);
  });

  it("should reject payload with invalid duration", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({
      prompt: "a cat",
      duration: "20",
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid aspect_ratio", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.klingVideo.o3p4k.textToVideo.schema.safeParse({
      prompt: "a cat",
      aspect_ratio: "4:3",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.klingVideo.o3p4k.textToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.klingVideo.o3p4k.textToVideo).toBe(
      provider.post.run.klingVideo.o3p4k.textToVideo
    );
  });
});
