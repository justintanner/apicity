import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MiniMax H3 Max Turbo reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-max-turbo-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("keeps cat1.jpg as Image 1 at the cheapest tier", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // One reference image, 2 s at 480P, prompt expansion off.
    const result = await provider.run.minimax.h3MaxTurbo.referenceToVideo({
      prompt: "Image 1 is the cat. The cat slowly blinks, static camera.",
      reference_image_urls: [
        `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      ],
      duration: 2,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
    });
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(Number.isInteger(result.seed)).toBe(true);
    expect(result.expanded_prompt ?? null).toBeNull();
    // One image fits inside the 4,096 reference tokens the clip price covers.
    expect(result.reference_tokens).toBeLessThanOrEqual(4096);
  }, 900000);
});
