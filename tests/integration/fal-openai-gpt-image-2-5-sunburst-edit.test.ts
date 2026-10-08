import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal GPT Image 2.5 Sunburst edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/openai-gpt-image-2-5-sunburst-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.openai.gptImage2p5.sunburst.edit({
      prompt: "A red balloon.",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
      ],
      quality: "low",
    });
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
