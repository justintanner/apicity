import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("Meshy 7.1 Text To 3d", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/meshy-v7-1-text-to-3d");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates from the minimal request", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.meshy.v7p1.textTo3d({
      prompt: "A red panda waves once, then holds still.",
    });
    expect(result).toBeTruthy();
    expect(result.model_glb.url).toMatch(/^https?:\/\//);
    expect(result.model_urls).toBeTruthy();
    expect(result.prompt.length).toBeGreaterThan(0);
  }, 900000);
});
