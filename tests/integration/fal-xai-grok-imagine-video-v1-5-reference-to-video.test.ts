import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalXaiGrokImagineVideoV1p5ReferenceToVideoRequestSchema } from "@apicity/fal/zod";

describe("fal xai/grok-imagine-video v1.5 reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/xai-grok-imagine-video-v1-5-reference-to-video"
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

    const result =
      await provider.run.xai.grokImagineVideo.v1p5.referenceToVideo({
        // v1.5 tags references positionally as <IMAGE_0>, <IMAGE_1>, ...
        prompt:
          "The person from <IMAGE_0> walks through a rainy neon-lit street",
        reference_image_urls: [imageDataUrl],
        duration: 4,
        resolution: "480p",
        aspect_ratio: "16:9",
      });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 900000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "The person from <IMAGE_0> in motion",
        reference_image_urls: ["https://example.com/img.png"],
      });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse(
        {}
      );
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(
      v.error.issues.some((i) => i.path.includes("reference_image_urls"))
    ).toBe(true);
  });

  it("should reject payload with too many reference images", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const tooMany = Array.from(
      { length: 8 },
      (_, i) => `https://example.com/img${i}.png`
    );
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "The person from <IMAGE_0> in motion",
        reference_image_urls: tooMany,
      });
    expect(v.success).toBe(false);
  });

  it("should reject an empty reference_image_urls array", () => {
    // Upstream declares minItems: 1 on v1.5; the unversioned sibling does not.
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "The person from <IMAGE_0> in motion",
        reference_image_urls: [],
      });
    expect(v.success).toBe(false);
  });

  it("should accept the 15s duration ceiling the unversioned sibling rejects", () => {
    // v1.5 raises the ceiling from 10s to 15s — this is the field-level
    // divergence that makes it a separate endpoint, not an alias.
    const provider = createFal({ apiKey: "fal-test-key" });
    const params = {
      prompt: "The person from <IMAGE_0> in motion",
      reference_image_urls: ["https://example.com/img.png"],
      duration: 15,
    };
    expect(
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse(
        params
      ).success
    ).toBe(true);
    expect(
      provider.run.xai.grokImagineVideo.referenceToVideo.schema.safeParse(
        params
      ).success
    ).toBe(false);
  });

  it("should reject a duration above the ceiling", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "The person from <IMAGE_0> in motion",
        reference_image_urls: ["https://example.com/img.png"],
        duration: 16,
      });
    expect(v.success).toBe(false);
  });

  it("should reject a prompt over the 4096-character cap", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "x".repeat(4097),
        reference_image_urls: ["https://example.com/img.png"],
      });
    expect(v.success).toBe(false);
  });

  it("should reject payload with auto aspect_ratio (not supported here)", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "The person from <IMAGE_0> in motion",
        reference_image_urls: ["https://example.com/img.png"],
        aspect_ratio: "auto",
      });
    expect(v.success).toBe(false);
  });

  it("should reject payload with wrong resolution", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema.safeParse({
        prompt: "The person from <IMAGE_0> in motion",
        reference_image_urls: ["https://example.com/img.png"],
        resolution: "1080p",
      });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema =
      provider.run.xai.grokImagineVideo.v1p5.referenceToVideo.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, and the unversioned
    // sibling is one property away on the same namespace.
    expect(schema).toBe(
      FalXaiGrokImagineVideoV1p5ReferenceToVideoRequestSchema
    );
    expect(schema).not.toBe(
      provider.run.xai.grokImagineVideo.referenceToVideo.schema
    );
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.xai.grokImagineVideo.v1p5.referenceToVideo).toBe(
      provider.post.run.xai.grokImagineVideo.v1p5.referenceToVideo
    );
  });
});
