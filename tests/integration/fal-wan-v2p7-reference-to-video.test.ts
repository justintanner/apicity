import { describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";

describe("fal wan v2.7 reference-to-video schema", () => {
  it("accepts positive reference-to-video durations", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.referenceToVideo.schema.safeParse({
      prompt: "Animate the reference character walking through a garden.",
      reference_image_urls: ["https://example.com/reference.png"],
      resolution: "720p",
      aspect_ratio: "16:9",
      duration: 2,
    });

    expect(v.success).toBe(true);
  });

  it("rejects zero duration for reference-to-video", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.referenceToVideo.schema.safeParse({
      prompt: "Animate the reference character walking through a garden.",
      reference_image_urls: ["https://example.com/reference.png"],
      duration: 0,
    });

    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("duration"))).toBe(true);
  });

  it("preserves zero duration on source-clip edit-video", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.wan.v2p7.editVideo.schema.safeParse({
      prompt: "Keep the original source clip length while changing the style.",
      video_url: "https://example.com/source.mp4",
      duration: 0,
    });

    expect(v.success).toBe(true);
  });

  it("exposes the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.wan.v2p7.referenceToVideo).toBe(
      provider.post.run.wan.v2p7.referenceToVideo
    );
  });
});
