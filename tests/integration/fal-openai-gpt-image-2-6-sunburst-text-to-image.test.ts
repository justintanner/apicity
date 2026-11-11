import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal GPT Image 2.6 Sunburst text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/openai-gpt-image-2-6-sunburst-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest meaningful call: the 2.5 recordings' prompt at low quality,
  // low reasoning effort, one square JPEG.
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.openai.gptImage2p6.sunburst.textToImage({
      prompt: "A red balloon.",
      quality: "low",
      reasoning_effort: "low",
      image_size: "square",
      num_images: 1,
      output_format: "jpeg",
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
