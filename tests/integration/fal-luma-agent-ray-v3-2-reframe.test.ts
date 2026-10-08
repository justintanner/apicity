import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Ray 3.2 reframe", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/luma-agent-ray-v3-2-reframe");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.luma.agent.ray.v3p2.reframe({
      prompt:
        "Extend the scene into cinematic widescreen with matching lighting and background detail.",
      video_url:
        "https://storage.googleapis.com/falserverless/example_inputs/birefnet-video-input.mp4",
      aspect_ratio: "21:9",
      resolution: "540p",
      duration: "5s",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
