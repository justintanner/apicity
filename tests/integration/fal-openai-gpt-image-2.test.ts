import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal GPT Image 2", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/openai-gpt-image-2");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates one low-quality image at the minimum legal area", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.openai.gptImage2({
      prompt: "A blue ceramic cup on a white table.",
      image_size: { width: 1024, height: 640 },
      quality: "low",
      num_images: 1,
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
