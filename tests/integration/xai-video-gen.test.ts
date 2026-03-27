import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai video generation integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/video-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.v1.videos.generations({
      prompt:
        "A white cat with heterochromia eyes walking across a rooftop at golden hour, cinematic drone shot",
      model: "grok-imagine-video",
      duration: 10,
      aspect_ratio: "16:9",
      resolution: "720p",
    });

    expect(result.request_id).toBeTruthy();
    expect(typeof result.request_id).toBe("string");
  });
});
