import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal xai/grok-imagine-video image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/xai-grok-imagine-video-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from an image", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.xai.grokImagineVideo.imageToVideo({
      prompt: "the man waves at the camera as the wind blows his hair",
      image_url: imageDataUrl,
      duration: 6,
      aspect_ratio: "16:9",
      resolution: "720p",
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.imageToVideo.schema.safeParse({
      prompt: "wave",
      image_url: "https://example.com/img.png",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.imageToVideo.schema.safeParse(
      {}
    );
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(v.error?.issues.some((i) => i.path.includes("image_url"))).toBe(
      true
    );
  });

  it("should reject payload with invalid duration", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.imageToVideo.schema.safeParse({
      prompt: "wave",
      image_url: "https://example.com/img.png",
      duration: 20,
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with wrong resolution", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.imageToVideo.schema.safeParse({
      prompt: "wave",
      image_url: "https://example.com/img.png",
      resolution: "1080p",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.xai.grokImagineVideo.imageToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineVideo.imageToVideo).toBe(
      provider.post.run.xai.grokImagineVideo.imageToVideo
    );
  });
});
