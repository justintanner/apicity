import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalIdeogramVectorTextToVectorRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Ideogram Vector text-to-vector", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/ideogram-vector-text-to-vector");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("draws the house prompt as one low-quality SVG", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt: "A red panda waves once, then holds still.",
      quality: "low",
    } satisfies FalIdeogramVectorTextToVectorRequest;
    expect(
      provider.run.ideogram.vector.textToVector.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.ideogram.vector.textToVector(input);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https:\/\//);
  }, 900000);
});
