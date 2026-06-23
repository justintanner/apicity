import { describe, expect, it } from "vitest";
import { createXai } from "@apicity/xai";

const provider = createXai({ apiKey: "sk-test-key" });

function generationPayload(duration: number) {
  return {
    prompt: "A cinematic tracking shot through a neon city",
    duration,
  };
}

function imageToVideoPayload(duration: number) {
  return {
    prompt: "Animate the still image",
    image: "https://example.com/still.png",
    duration,
  };
}

function extensionPayload(duration: number) {
  return {
    prompt: "Continue the scene into a forest",
    video: { url: "https://example.com/source.mp4" },
    duration,
  };
}

describe("xAI video duration schemas", () => {
  it.each([1, 6, 10, 15])(
    "accepts documented generation duration %s",
    (duration) => {
      const result = provider.post.v1.videos.generations.schema.safeParse(
        generationPayload(duration)
      );

      expect(result.success).toBe(true);
    }
  );

  it.each([0, 6.5, 16])(
    "rejects unsupported generation duration %s",
    (duration) => {
      const result = provider.post.v1.videos.generations.schema.safeParse(
        generationPayload(duration)
      );

      expect(result.success).toBe(false);
    }
  );

  it.each([1, 6, 10, 15])(
    "accepts documented image-to-video duration %s",
    (duration) => {
      const result =
        provider.post.v1.videos.generations.imageToVideo.schema.safeParse(
          imageToVideoPayload(duration)
        );

      expect(result.success).toBe(true);
    }
  );

  it.each([0, 6.5, 16])(
    "rejects unsupported image-to-video duration %s",
    (duration) => {
      const result =
        provider.post.v1.videos.generations.imageToVideo.schema.safeParse(
          imageToVideoPayload(duration)
        );

      expect(result.success).toBe(false);
    }
  );

  it.each([2, 5, 6, 10])(
    "accepts documented extension duration %s",
    (duration) => {
      const result = provider.post.v1.videos.extensions.schema.safeParse(
        extensionPayload(duration)
      );

      expect(result.success).toBe(true);
    }
  );

  it.each([1, 6.5, 11])(
    "rejects unsupported extension duration %s",
    (duration) => {
      const result = provider.post.v1.videos.extensions.schema.safeParse(
        extensionPayload(duration)
      );

      expect(result.success).toBe(false);
    }
  );
});
