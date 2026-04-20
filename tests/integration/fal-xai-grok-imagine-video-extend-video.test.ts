import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal xai/grok-imagine-video extend-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/xai-grok-imagine-video-extend-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should extend a video", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "jump.mp4"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const videoDataUrl = `data:video/mp4;base64,${b64}`;

    const result = await provider.run.xai.grokImagineVideo.extendVideo({
      prompt:
        "The camera slowly zooms out to reveal the city skyline at sunset",
      video_url: videoDataUrl,
      duration: 4,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.extendVideo.schema.safeParse({
      prompt: "zoom out",
      video_url: "https://example.com/clip.mp4",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.extendVideo.schema.safeParse(
      {}
    );
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(v.error?.issues.some((i) => i.path.includes("video_url"))).toBe(
      true
    );
  });

  it("should reject payload with duration below range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.extendVideo.schema.safeParse({
      prompt: "zoom out",
      video_url: "https://example.com/clip.mp4",
      duration: 1,
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with duration above range", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const v = provider.run.xai.grokImagineVideo.extendVideo.schema.safeParse({
      prompt: "zoom out",
      video_url: "https://example.com/clip.mp4",
      duration: 11,
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.run.xai.grokImagineVideo.extendVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineVideo.extendVideo).toBe(
      provider.post.run.xai.grokImagineVideo.extendVideo
    );
  });
});
