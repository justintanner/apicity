import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Cosmos 3 Super image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/nvidia-cosmos-3-super-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.nvidia.cosmos3Super.imageToVideo({
      prompt:
        "The camera slowly pushes in as the subject turns their head toward the light, hair drifting in a gentle breeze, dust motes floating through warm afternoon sun.",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/hunyuan_i2v.jpg",
      num_frames: 5,
      enable_agentic_generation: false,
      enable_prompt_expansion: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
