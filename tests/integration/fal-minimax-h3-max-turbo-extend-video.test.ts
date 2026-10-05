import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max Turbo video extension", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-turbo-extend-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a short continuation", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.minimax.h3MaxTurbo.extendVideo({
      video_url:
        "https://storage.googleapis.com/falserverless/example_inputs/flux-3-red-panda.mp4",
      prompt:
        "The red panda keeps walking along the log, then looks up at a bird.",
      duration: 1,
      resolution: "480P",
      output: "continuation",
      enable_prompt_expansion: false,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.duration).toBeGreaterThan(0);
    expect(typeof result.seed).toBe("number");
    expect(result.source).toBeTypeOf("object");
  }, 900000);
});
