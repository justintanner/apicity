import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Kandinsky 6.0 Lite image-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kandinsky6-lite-image-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("animates cat1.jpg at four steps", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The prompt and the committed cat1.jpg fixture are reused together from
    // fal-wan3p0-image-to-video. Four steps is the card's cheapest listed
    // point.
    const result = await provider.run.kandinsky6Lite.imageToVideo({
      prompt: "the cat blinks",
      image_url: `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      num_inference_steps: 4,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
