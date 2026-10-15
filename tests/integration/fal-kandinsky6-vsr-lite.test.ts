import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kandinsky 6.0 VSR Lite", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kandinsky6-vsr-lite");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("upscales seedance-ref.mp4 two times", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The committed 720x576 colour-bar clip: both sides are multiples of 16,
    // as 2x upscaling requires.
    const result = await provider.run.kandinsky6Vsr.lite({
      video_url: `data:video/mp4;base64,${readFileSync(new URL("../fixtures/seedance-ref.mp4", import.meta.url)).toString("base64")}`,
      upscale_factor: 2,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
