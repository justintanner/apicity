import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Ideogram 4.5", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/ideogram-v4-5");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.ideogram.v4p5({
      num_images: 1,
      quality: "low",
      prompt: "A red panda waves once, then holds still.",
    });
    expect(result).toBeTruthy();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0]?.url).toMatch(/^https?:\/\//);
    expect(result.seed).not.toBeUndefined();
  }, 900000);
});
