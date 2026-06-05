import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext, mintXaiOtp } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai video generation integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/video-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = createXaiProvider();

    const req = {
      prompt:
        "A white cat with heterochromia eyes walking across a rooftop at golden hour, cinematic drone shot",
      model: "grok-imagine-video" as const,
      duration: 10,
      aspect_ratio: "16:9" as const,
      resolution: "720p" as const,
    };
    const result = await provider.post.v1.videos.generations(req, mintXaiOtp("v1.videos.generations", req));

    expect(result.request_id).toBeTruthy();
    expect(typeof result.request_id).toBe("string");
  });
});
