import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Nano Banana 2.1 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/google-nano-banana-2-1-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits cat1.jpg with the existing scarf prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Reuse the owned fixture and prompt from fal-alibaba-qwen-image-3-edit.
    const result = await provider.run.nanoBanana2p1.edit({
      prompt: "Give the cat in image 1 a small red knitted scarf.",
      image_urls: [
        `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url)).toString("base64")}`,
      ],
      resolution: "1K",
      thinking_level: "minimal",
    });
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].url).toMatch(/^https:\/\//);
    expect(typeof result.description).toBe("string");
  }, 900000);
});
