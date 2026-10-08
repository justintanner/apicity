import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Bria Fibo Edit 1.5 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bria-fibo-edit-1-5-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.bria.fiboEdit1p5.edit({
      image_urls: [
        "https://v3b.fal.media/files/b/0aa69153/6d2UFjgrQCRM6BoWpXpZ3_126_1.jpg",
        "https://v3b.fal.media/files/b/0aa69153/Gy-fjFofCbQP9w3lsfc2e_126_2.jpg",
      ],
      instruction:
        "Uncross her arms and place the serum bottle in her right hand raised beside her face, label toward the camera.",
    });
    expect(result.image.url).toMatch(/^https?:\/\//);
  }, 900000);
});
