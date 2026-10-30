import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal GPT Image 2 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/openai-gpt-image-2-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits one cat image with low quality at minimum output area", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.openai.gptImage2.edit({
      prompt: "Add a blue bow tie to the cat.",
      image_urls: [
        `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      ],
      image_size: { width: 1024, height: 640 },
      quality: "low",
      num_images: 1,
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
