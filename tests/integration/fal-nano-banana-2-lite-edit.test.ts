import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal nano-banana-2-lite edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/nano-banana-2-lite-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image with a prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.nanoBanana2Lite.edit({
      prompt:
        "Turn this portrait into a polished studio editorial image with a muted teal backdrop, preserving the person.",
      image_urls: [imageDataUrl],
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      limit_generations: true,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images[0].content_type).toBe("image/png");
    expect(result.images[0].file_name).toMatch(/\.png$/);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.description).toBe("string");
  }, 300000);
});
