import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MAI Image 2.5 Pro", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/microsoft-mai-image-2-5-pro");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.microsoft.maiImage2p5Pro({
      prompt: "A red balloon.",
    });
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);
});
