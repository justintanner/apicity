import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalIdeogramVectorImageToVectorRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// tests/fixtures/cat1.jpg, uploaded once to fal storage with our key: this
// endpoint refused the fixture as a data URL ("Could not download the image",
// a free 422 with zero billable units).
const CAT1_URL =
  "https://v3b.fal.media/files/b/0aaf7eca/YdKOoA8T48QoJMIc7Sflb_apicity-cat1.jpg";

describe("fal Ideogram Vector image-to-vector", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/ideogram-vector-image-to-vector");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("converts our cat fixture into one SVG", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      image_url: CAT1_URL,
    } satisfies FalIdeogramVectorImageToVectorRequest;
    expect(
      provider.run.ideogram.vector.imageToVector.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.ideogram.vector.imageToVector(input);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https:\/\//);
  }, 900000);
});
