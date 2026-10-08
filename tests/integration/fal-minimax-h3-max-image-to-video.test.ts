import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates a first frame at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.imageToVideo({
      prompt:
        "The camera slowly pulls back from the scene, revealing the full landscape as clouds drift overhead and light shifts across the terrain.",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/hailuo23/pro_i2v_in.jpg",
      duration: 0.92,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 900000);
});
