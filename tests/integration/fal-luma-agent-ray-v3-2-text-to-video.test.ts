import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Ray 3.2 text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/luma-agent-ray-v3-2-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.luma.agent.ray.v3p2.textToVideo({
      prompt:
        "A herd of wild horses galloping across a dusty desert plain under a blazing midday sun, their manes flying in the wind; wide tracking shot.",
      duration: "5s",
      resolution: "540p",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
  }, 900000);
});
