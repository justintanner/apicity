import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Marigold V2", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/marigold-v2");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("predicts depth for our fixture and returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Owned beach.png (the PR 331 Vidu Q4 asset); the endpoint takes no prompt.
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "beach.png")
    );
    const result = await provider.run.marigoldV2({
      image_url: `data:image/png;base64,${image.toString("base64")}`,
      prediction_type: "depth",
    });
    expect(result.image.url).toMatch(/^https?:\/\//);
    expect(result.image.content_type).toBe("image/png");
    expect(result.image.width).toBeGreaterThan(0);
    expect(result.image.height).toBeGreaterThan(0);
    expect(Number.isInteger(result.seed)).toBe(true);
  }, 900000);
});
