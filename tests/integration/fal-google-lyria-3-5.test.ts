import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Google Lyria 3.5", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/google-lyria-3-5");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.google.lyria3p5({
      prompt: "Gentle solo piano, slow tempo, no vocals, about twenty seconds.",
    });
    expect(result).toBeTruthy();
    expect(result.audio.url).toMatch(/^https?:\/\//);
  }, 900000);
});
