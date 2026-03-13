import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai video integration", () => {
  let ctx: PollyContext;

  describe("generateVideo", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-generate");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should generate a video from a prompt", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A cat playing with a ball",
        model: "grok-imagine-video",
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should support duration parameter", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A sunset over the ocean",
        model: "grok-imagine-video",
        duration: 6,
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should use default model when not specified", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A simple animation of falling rain",
      });

      expect(result.request_id).toBeTruthy();
    });
  });

  describe("editVideo", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-edit");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should edit a video with a prompt", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.edits({
        prompt: "Add snow to the scene",
        model: "grok-imagine-video",
        video: {
          url: "https://example.com/video.mp4",
        },
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should use default model when not specified", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.edits({
        prompt: "Make the colors more vibrant",
        video: {
          url: "https://example.com/video.mp4",
        },
      });

      expect(result.request_id).toBeTruthy();
    });
  });
});
