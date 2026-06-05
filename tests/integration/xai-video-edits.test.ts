import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  type PollyContext,
  mintXaiOtp,
} from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai video edits integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/video-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should submit a video edit and poll for status", async () => {
    const provider = createXaiProvider();

    const req = {
      model: "grok-imagine-video" as const,
      prompt: "Give the woman a silver necklace",
      video: {
        url: "https://vidgen.x.ai/xai-vidgen-bucket/xai-video-sample.mp4",
      },
    };
    const result = await provider.post.v1.videos.edits(
      req,
      mintXaiOtp("v1.videos.edits", req)
    );
    expect(result.request_id).toBeTruthy();
    expect(typeof result.request_id).toBe("string");

    const status = await provider.get.v1.videos(result.request_id);
    expect(["pending", "done", "expired", "failed"]).toContain(status.status);
    expect(typeof status.progress).toBe("number");
  });
});
