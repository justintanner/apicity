import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai video extensions integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should extend a video from a source video URL", async () => {
    ctx = setupPolly("xai/video-extensions-basic");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });

    // Extend a sample video with a new prompt
    const result = await provider.post.v1.videos.extensions({
      model: "grok-imagine-video",
      prompt:
        "The scene continues with the character walking into a magical forest",
      video: {
        url: "https://vidgen.x.ai/xai-vidgen-bucket/xai-video-sample.mp4",
      },
      duration: 5,
    });

    expect(result.request_id).toBeTruthy();
    expect(typeof result.request_id).toBe("string");
  });

  it("should support custom duration for video extension", async () => {
    ctx = setupPolly("xai/video-extensions-duration");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.videos.extensions({
      model: "grok-imagine-video",
      prompt: "The camera zooms out to reveal a beautiful landscape",
      video: {
        url: "https://vidgen.x.ai/xai-vidgen-bucket/xai-video-sample.mp4",
      },
      duration: 10,
    });

    expect(result.request_id).toBeTruthy();
  });
});
