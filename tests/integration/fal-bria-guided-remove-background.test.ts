import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Bria Guided Remove Background", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/bria-guided-remove-background");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("removes the background from our fixture and returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Owned cat2.jpg; prompt reused from fal-bytedance-seedream-v5-pro-layerize.
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat2.jpg")
    );
    const result = await provider.run.bria.guidedRemoveBackground({
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      prompt: "separate the cat from the background",
    });
    expect(result.image.url).toMatch(/^https?:\/\//);
    expect(result.image.content_type).toBe("image/png");
    expect(result.image.width).toBeGreaterThan(0);
    expect(result.image.height).toBeGreaterThan(0);
  }, 900000);
});
