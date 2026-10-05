import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Bytedance Seedream V5 Flash Edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedream-v5-flash-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.bytedance.seedream.v5.flash.edit({
      num_images: 1,
      prompt: "A red panda waves once, then holds still.",
      image_urls: [
        "https://v3b.fal.media/files/b/0a8b90e0/BFLE9VDlZqsryU-UA3BoD_image_004.png",
      ],
    });
    expect(result).toBeTruthy();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0]?.url).toMatch(/^https?:\/\//);
  }, 900000);
});
