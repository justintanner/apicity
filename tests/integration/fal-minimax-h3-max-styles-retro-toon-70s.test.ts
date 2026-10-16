import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max Retro Toon 70s styled text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-styles-retro-toon-70s");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates the house prompt as a five-second Retro Toon 70s clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The repo's house prompt (fal-ideogram-v4-5, fal-meshy-v7-1-text-to-3d
    // and others); duration 5 is the shortest the schema allows.
    const result = await provider.run.minimax.h3Max.styles.retroToon70s({
      prompt: "A red panda waves once, then holds still.",
      duration: 5,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
  }, 900000);
});
