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
      ctx = setupPolly("xai/video-edit-via-generations");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should edit a video by passing video_url", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "Add dramatic lighting to the scene",
        model: "grok-imagine-video",
        video_url: "https://data.x.ai/docs/video-generation/portrait-wave.mp4",
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should generate video from an image_url", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "Animate this landscape with gentle wind",
        model: "grok-imagine-video",
        image_url: "https://example.com/landscape.jpg",
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should support aspect_ratio and resolution", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "A vertical video of rain falling on a window",
        model: "grok-imagine-video",
        aspect_ratio: "9:16",
        resolution: "720p",
        duration: 5,
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });

    it("should edit video with aspect_ratio preserved", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const result = await provider.v1.videos.generations({
        prompt: "Make the colors more vibrant and saturated",
        video_url: "https://data.x.ai/docs/video-generation/portrait-wave.mp4",
        aspect_ratio: "16:9",
      });

      expect(result.request_id).toBeTruthy();
      expect(typeof result.request_id).toBe("string");
    });
  });

  describe("pollVideoStatus", () => {
    beforeEach(() => {
      ctx = setupPolly("xai/video-poll-status");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should poll video status and return structured result", async () => {
      const provider = xai({
        apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
      });
      const gen = await provider.v1.videos.generations({
        prompt: "A brief flash of light",
      });
      const result = await provider.v1.videos(gen.request_id);

      expect(result.status).toBeTruthy();
      expect(["pending", "done", "expired", "failed"]).toContain(result.status);
    });
  });
});
