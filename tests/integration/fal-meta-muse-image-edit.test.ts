import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Muse Image edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/meta-muse-image-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.meta.museImage.edit({
      prompt:
        "A cinematic editorial portrait in soft window light with crisp typography",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/kontext_example_input.webp",
      ],
    });
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
