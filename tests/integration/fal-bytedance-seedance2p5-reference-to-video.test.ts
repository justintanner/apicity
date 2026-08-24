import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { FalSeedance2p5ReferenceToVideoRequestSchema } from "@apicity/fal/zod";

const fixtureDataUrl = (fileName: string, contentType: string) => {
  const fixturePath = path.resolve(
    import.meta.dirname,
    "..",
    "fixtures",
    fileName
  );
  return `data:${contentType};base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
};

describe("fal bytedance seedance2p5 reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p5-reference-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short video from image and video references", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const imageDataUrl = fixtureDataUrl("cat1.jpg", "image/jpeg");
    const videoDataUrl = fixtureDataUrl("seedance-ref.mp4", "video/mp4");

    const result = await provider.run.bytedance.seedance2p5.referenceToVideo({
      prompt:
        "@Image1 follows the gentle head movement from @Video1, cinematic close-up.",
      image_urls: [imageDataUrl],
      video_urls: [videoDataUrl],
      resolution: "480p",
      duration: "4",
      aspect_ratio: "1:1",
      generate_audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
  }, 900000);

  it("should validate a minimal payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.referenceToVideo.schema.safeParse({
        prompt: "a serene mountain sunset",
      });
    expect(result.success).toBe(true);
  });

  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.referenceToVideo.schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) => issue.path.includes("prompt"))
    ).toBe(true);
  });

  it("should enforce the documented per-modality caps", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.referenceToVideo.schema;
    const urls = (count: number) =>
      Array.from({ length: count }, (_, index) => `https://e.test/${index}`);

    expect(
      schema.safeParse({
        prompt: "combine the references",
        image_urls: urls(30),
        video_urls: urls(10),
        audio_urls: urls(10),
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ prompt: "p", image_urls: urls(31) }).success
    ).toBe(false);
    expect(
      schema.safeParse({ prompt: "p", video_urls: urls(11) }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["https://e.test/image"],
        audio_urls: urls(11),
      }).success
    ).toBe(false);
  });

  it("should require an image or video when audio is provided", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.referenceToVideo.schema;
    const audioOnly = schema.safeParse({
      prompt: "follow the rhythm",
      audio_urls: ["https://example.com/audio.mp3"],
    });
    expect(audioOnly.success).toBe(false);
    if (audioOnly.success) throw new Error("expected failure");
    expect(
      audioOnly.error.issues.some((issue) => issue.path.includes("audio_urls"))
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "follow the rhythm",
        image_urls: ["https://example.com/image.jpg"],
        audio_urls: ["https://example.com/audio.mp3"],
      }).success
    ).toBe(true);
  });

  it("should reject an unknown resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.referenceToVideo.schema.safeParse({
        prompt: "a cat",
        resolution: "4k",
      });
    expect(result.success).toBe(false);
  });

  it("should reject an out-of-range duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.bytedance.seedance2p5.referenceToVideo.schema.safeParse({
        prompt: "a cat",
        duration: "31",
      });
    expect(result.success).toBe(false);
  });

  it("should accept the expanded 2.5 resolution and duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.referenceToVideo.schema;
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
      provider.run.bytedance.seedance2p5.referenceToVideo.schema.safeParse({
        prompt: "a cat",
        bitrate_mode: "ultra",
      });
    expect(result.success).toBe(false);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.bytedance.seedance2p5.referenceToVideo.schema;
    expect(schema).toBe(FalSeedance2p5ReferenceToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.bytedance.seedance2p5.referenceToVideo).toBe(
      provider.post.run.bytedance.seedance2p5.referenceToVideo
    );
  });
});
