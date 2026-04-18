import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { fal } from "@apicity/fal";

describe("fal nano-banana text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/nano-banana");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 600000,
    });

    const result = await provider.run.nanoBanana.textToImage({
      prompt:
        "An action shot of a black lab swimming in an inground suburban swimming pool.",
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.description).toBe("string");
  }, 600000);
});
