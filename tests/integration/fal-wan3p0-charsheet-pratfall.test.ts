import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal } from "@apicity/fal";
import type { FalWan3p0ReferenceToVideoRequest } from "@apicity/fal";
import {
  CHARSHEET_FIXTURE,
  CHARSHEET_MIME_TYPE,
  CHARSHEET_PRATFALL_PROMPT,
} from "../charsheet-pratfall-helpers";

// Charsheet umbrella-pratfall bake-off (ac-gupjgo), R01 = ac-byit6h:
// Wan 3.0 reference-to-video on the shared spec. The character sheet goes in
// as the only reference image, as a data URI the way the sibling r2v test
// sends its image. The shared prompt goes in unchanged: Wan 3.0 lets a prompt
// address references positionally ("Image 1") but does not require it.
// 720p, 5 s, 9:16 and audio off follow the live queue OpenAPI read on
// 2026-11-25 (every field and value unchanged since the leaf landed).
const charsheetDataUrl = () => {
  const fixturePath = path.resolve(
    import.meta.dirname,
    "..",
    "fixtures",
    CHARSHEET_FIXTURE
  );
  return `data:${CHARSHEET_MIME_TYPE};base64,${fs
    .readFileSync(fixturePath)
    .toString("base64")}`;
};

describe("fal alibaba wan3p0 charsheet pratfall reference-to-video", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/wan3p0-charsheet-pratfall");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should stage the umbrella pratfall from the character sheet", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const endpoint = provider.run.alibaba.wan3p0.referenceToVideo;

    const request: FalWan3p0ReferenceToVideoRequest = {
      prompt: CHARSHEET_PRATFALL_PROMPT,
      reference_image_urls: [charsheetDataUrl()],
      resolution: "720p",
      duration: 5,
      aspect_ratio: "9:16",
      audio: false,
    };
    expect(endpoint.schema.safeParse(request).success).toBe(true);

    const result = await endpoint(request);

    expect(result.video.url.startsWith("https://")).toBe(true);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.duration).toBe("number");
  }, 900000);
});
