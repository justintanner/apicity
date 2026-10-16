import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
describe("fal Creatify Boreal", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/creatify-boreal");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a video from the house red panda prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Existing house prompt from fal-ideogram-v4-5; no input media.
    const result = await provider.run.creatify.boreal({
      prompt: "A red panda waves once, then holds still.",
      duration: 1,
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(result.video.content_type).toBe("video/mp4");
  }, 900000);
});
