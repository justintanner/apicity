import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

function fixtureDataUrl(name: string, mime: string): string {
  return `data:${mime};base64,${readFileSync(new URL(`../fixtures/${name}`, import.meta.url)).toString("base64")}`;
}

describe("fal MiniMax H3 Max relight", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/minimax-h3-max-relight");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("relights seedance-ref.mp4 with the studio-bg.jpg lighting at 480P", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The docs ask for a sphere render as the lighting reference. The repo has
    // none and no new asset may be made, so the committed studio-bg.jpg (a
    // dark studio lit from the upper left) stands in for it.
    const result = await provider.run.minimax.h3Max.relight({
      video_url: fixtureDataUrl("seedance-ref.mp4", "video/mp4"),
      reference_image_url: fixtureDataUrl("studio-bg.jpg", "image/jpeg"),
      resolution: "480P",
      aspect_ratio: "adaptive",
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
    if (result.timings != null) {
      for (const seconds of Object.values(result.timings))
        expect(typeof seconds).toBe("number");
    }
  }, 900000);
});
