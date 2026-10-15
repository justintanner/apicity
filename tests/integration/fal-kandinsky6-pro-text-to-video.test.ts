import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kandinsky 6.0 Pro text-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/kandinsky6-pro-text-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a clip from the house prompt at eight steps", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The house prompt, reused from fal-ideogram-v4-5 and others. Eight steps
    // is the minimum and the card's cheapest listed point.
    const result = await provider.run.kandinsky6Pro.textToVideo({
      prompt: "A red panda waves once, then holds still.",
      num_inference_steps: 8,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
