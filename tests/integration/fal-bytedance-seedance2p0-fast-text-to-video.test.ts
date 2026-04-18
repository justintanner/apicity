import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal bytedance seedance2p0 fast text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/bytedance-seedance2p0-fast-text-to-video"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short 480p video from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const result = await provider.run.bytedance.seedance2p0.fast.textToVideo({
      prompt:
        "A white odd-eyed cat blinks slowly and tilts its head, soft breeze through fur, cinematic close-up.",
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 300000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.textToVideo.schema.safeParse({
        prompt: "a serene mountain sunset",
      });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing prompt", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.textToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject payload with invalid resolution", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.textToVideo.schema.safeParse({
        prompt: "a cat",
        resolution: "1080p",
      });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid duration", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.bytedance.seedance2p0.fast.textToVideo.schema.safeParse({
        prompt: "a cat",
        duration: "20",
      });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p0.fast.textToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedance2p0.fast.textToVideo).toBe(
      provider.post.run.bytedance.seedance2p0.fast.textToVideo
    );
  });
});
