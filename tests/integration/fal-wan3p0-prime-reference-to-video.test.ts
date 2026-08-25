import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import { FalWan3p0ReferenceToVideoRequestSchema } from "@apicity/fal/zod";

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

describe("fal alibaba wan3p0-prime reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/wan3p0-prime-reference-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a short video from an image reference", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.alibaba.wan3p0Prime.referenceToVideo({
      prompt:
        "The cat in Image 1 blinks slowly and tilts its head, cinematic close-up.",
      reference_image_urls: [fixtureDataUrl("cat1.jpg", "image/jpeg")],
      resolution: "480p",
      aspect_ratio: "1:1",
      duration: 2,
      audio: false,
    });

    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.duration).toBe("number");
  }, 900000);

  it("should validate an image-reference payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.referenceToVideo.schema.safeParse({
        reference_image_urls: ["https://example.com/cat.jpg"],
      });
    expect(result.success).toBe(true);
  });

  it("should reject a payload with no grounding input", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.referenceToVideo.schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(
      result.error.issues.some((issue) =>
        issue.path.includes("reference_image_urls")
      )
    ).toBe(true);
  });

  it("should accept a prompt-only payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const result =
      provider.run.alibaba.wan3p0Prime.referenceToVideo.schema.safeParse({
        prompt: "a red panda in a bamboo forest",
      });
    expect(result.success).toBe(true);
  });

  it("should enforce the published reference-media limits", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0Prime.referenceToVideo.schema;
    const image = "https://example.com/cat.jpg";
    const video = "https://example.com/clip.mp4";
    const audio = "https://example.com/clip.mp3";
    expect(
      schema.safeParse({ reference_image_urls: Array(10).fill(image) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ reference_image_urls: Array(11).fill(image) }).success
    ).toBe(false);
    expect(
      schema.safeParse({ reference_video_urls: Array(5).fill(video) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ reference_video_urls: Array(6).fill(video) }).success
    ).toBe(false);
    expect(
      schema.safeParse({ reference_audio_urls: Array(5).fill(audio) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ reference_audio_urls: Array(6).fill(audio) }).success
    ).toBe(false);
  });

  it("should accept file_url and web_url grounding inputs", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0Prime.referenceToVideo.schema;
    expect(
      schema.safeParse({
        file_url: "https://example.com/brief.pdf",
        enable_thinking: true,
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        web_url: "https://example.com/article",
        enable_thinking: true,
      }).success
    ).toBe(true);
  });

  it("should expose the endpoint-specific schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.alibaba.wan3p0Prime.referenceToVideo.schema;
    expect(schema).toBe(FalWan3p0ReferenceToVideoRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.alibaba.wan3p0Prime.referenceToVideo).toBe(
      provider.post.run.alibaba.wan3p0Prime.referenceToVideo
    );
  });
});
