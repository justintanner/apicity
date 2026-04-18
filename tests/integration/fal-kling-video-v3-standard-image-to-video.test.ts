import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal kling-video v3 standard image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kling-video-v3-standard-image-to-video");
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

    const result = await provider.run.klingVideo.v3.standard.imageToVideo({
      start_image_url: imageDataUrl,
      prompt: "the man waves at the camera as the wind blows his hair",
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
    const v =
      provider.run.klingVideo.v3.standard.imageToVideo.schema.safeParse({
        start_image_url: "https://example.com/img.png",
      });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing start_image_url", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.klingVideo.v3.standard.imageToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(
      v.error?.issues.some((i) => i.path.includes("start_image_url"))
    ).toBe(true);
  });

  it("should reject payload with cfg_scale out of range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v =
      provider.run.klingVideo.v3.standard.imageToVideo.schema.safeParse({
        start_image_url: "https://example.com/img.png",
        cfg_scale: 5,
      });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.klingVideo.v3.standard.imageToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.klingVideo.v3.standard.imageToVideo).toBe(
      provider.post.run.klingVideo.v3.standard.imageToVideo
    );
  });
});
