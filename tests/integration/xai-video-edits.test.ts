import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai video edits integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/video-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should submit a video edit and poll for status", async () => {
    const provider = xai({ apiKey: process.env.XAI_API_KEY ?? "sk-test-key" });

    const result = await provider.v1.videos.edits({
      model: "grok-imagine-video",
      prompt: "Give the woman a silver necklace",
      video: {
        url: "https://vidgen.x.ai/xai-vidgen-bucket/xai-video-sample.mp4",
      },
    });
    expect(result.request_id).toBeTruthy();
    expect(typeof result.request_id).toBe("string");

    const status = await provider.v1.videos(result.request_id);
    expect(["pending", "done", "expired", "failed"]).toContain(status.status);
    expect(typeof status.progress).toBe("number");
  });
});
