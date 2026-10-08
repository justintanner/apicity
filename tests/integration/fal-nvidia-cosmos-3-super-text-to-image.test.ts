import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Cosmos 3 Super text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/nvidia-cosmos-3-super-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.nvidia.cosmos3Super.textToImage({
      prompt:
        "A photorealistic close-up of two damp hands shaping a spinning cylinder of wet gray clay on a pottery wheel, fingers pinching the walls upward into a narrow-necked vase, water glistening on the clay, soft studio lighting, shallow depth of field.",
    });
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
