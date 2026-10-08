import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("keeps a reference subject consistent at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3Max.referenceToVideo({
      prompt:
        "Image 1 is the mountain biker. Keep the rider and the bike consistent with Image 1 as they land the jump and ride on along the sunlit forest trail.",
      reference_image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/hailuo23/pro_i2v_in.jpg",
      ],
      duration: 0.92,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 900000);
});
