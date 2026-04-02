import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI video get integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/video-get");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get video generation result", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    // First create a video generation
    const created = await provider.post.v1.videos.generations({
      model: "grok-video",
      prompt: "A cat playing with a ball",
    });
    expect(created.id).toBeTruthy();

    // Get video result (may be pending)
    const result = await provider.get.v1.videos(created.id);
    expect(result.id).toBe(created.id);
    expect(result.status).toBeDefined();
  });
});
