import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal xai/grok-imagine-video reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/xai-grok-imagine-video-reference-to-video"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from reference images", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.xai.grokImagineVideo.referenceToVideo({
      prompt:
        "A @Image1 walking through a sunlit meadow, cinematic slow motion",
      reference_image_urls: [imageDataUrl],
      duration: 6,
      aspect_ratio: "16:9",
      resolution: "480p",
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse({
        prompt: "A @Image1 in motion",
        reference_image_urls: ["https://example.com/img.png"],
      });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse({});
    expect(v.success).toBe(false);
    expect(v.error?.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(
      v.error?.issues.some((i) => i.path.includes("reference_image_urls"))
    ).toBe(true);
  });

  it("should reject payload with too many reference images", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const tooMany = Array.from(
      { length: 8 },
      (_, i) => `https://example.com/img${i}.png`
    );
    const v =
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse({
        prompt: "A @Image1 in motion",
        reference_image_urls: tooMany,
      });
    expect(v.success).toBe(false);
  });

  it("should reject payload with invalid duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse({
        prompt: "A @Image1 in motion",
        reference_image_urls: ["https://example.com/img.png"],
        duration: 15,
      });
    expect(v.success).toBe(false);
  });

  it("should reject payload with auto aspect_ratio (not supported here)", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse({
        prompt: "A @Image1 in motion",
        reference_image_urls: ["https://example.com/img.png"],
        aspect_ratio: "auto",
      });
    expect(v.success).toBe(false);
  });

  it("should reject payload with wrong resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse({
        prompt: "A @Image1 in motion",
        reference_image_urls: ["https://example.com/img.png"],
        resolution: "1080p",
      });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.xai.grokImagineVideo.referenceToVideo.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineVideo.referenceToVideo).toBe(
      provider.post.run.xai.grokImagineVideo.referenceToVideo
    );
  });
});
