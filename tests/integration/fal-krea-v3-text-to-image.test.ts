import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Krea 3 text-to-image", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/krea-v3-text-to-image");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates at low reasoning and 1024x1024", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.krea.v3.textToImage({
      prompt: "A red ceramic cup on a wooden table",
      image_size: { width: 1024, height: 1024 },
      reasoning_level: "low",
    });
    expect(result.images[0]?.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.prompt).toBe("string");
    expect(Array.isArray(result.has_nsfw_concepts)).toBe(true);
  }, 900000);
});
