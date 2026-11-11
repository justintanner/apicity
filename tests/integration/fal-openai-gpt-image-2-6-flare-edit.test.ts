import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal GPT Image 2.6 Flare edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/openai-gpt-image-2-6-flare-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  // The cheapest meaningful edit: the owned cat photo at low quality and low
  // reasoning effort, one image.
  it("edits the owned cat photo", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result = await provider.run.openai.gptImage2p6.flare.edit({
      prompt: "Add a small red bow tie to the cat.",
      image_urls: [`data:image/jpeg;base64,${cat.toString("base64")}`],
      quality: "low",
      reasoning_effort: "low",
      num_images: 1,
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
