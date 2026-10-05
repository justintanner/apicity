import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Recraft 4.1 Flash Text To Image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/recraft-v4-1-flash-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.recraft.v4p1.flash.textToImage({
      prompt: "A red panda waves once, then holds still.",
    });
    expect(result).toBeTruthy();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0]?.url).toMatch(/^https?:\/\//);
  }, 900000);
});
