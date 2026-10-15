import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

function fixtureDataUrl(name: string, mime: string): string {
  return `data:${mime};base64,${readFileSync(new URL(`../fixtures/${name}`, import.meta.url)).toString("base64")}`;
}

describe("fal Vidu Q4 reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/vidu-q4-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("places the cat2.jpg cat on the beach.png beach for three seconds at 540p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Reuse the owned fixtures and prompt from kie-vidu-q4-reference-to-video,
    // with fal's [@reference_image_N] tokens for "reference image N".
    const result = await provider.run.vidu.q4.referenceToVideo({
      prompt:
        "In the scene of [@reference_image_1], the white cat from [@reference_image_2] sits on the wet sand, blinks, and turns its head toward the waves.",
      reference_image_urls: [
        fixtureDataUrl("beach.png", "image/png"),
        fixtureDataUrl("cat2.jpg", "image/jpeg"),
      ],
      duration: 3,
      resolution: "540p",
      audio: false,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
    if (result.cover_image != null) {
      expect(result.cover_image.url).toMatch(/^https:\/\//);
    }
  }, 900000);
});
