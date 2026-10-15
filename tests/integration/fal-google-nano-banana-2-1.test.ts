import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Nano Banana 2.1 text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-nano-banana-2-1");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates one image from the house prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The house prompt, reused from fal-ideogram-v4-5 and others.
    const result = await provider.run.nanoBanana2p1.textToImage({
      prompt: "A red panda waves once, then holds still.",
      num_images: 1,
      resolution: "1K",
      thinking_level: "minimal",
    });
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(typeof result.description).toBe("string");
  }, 900000);
});
