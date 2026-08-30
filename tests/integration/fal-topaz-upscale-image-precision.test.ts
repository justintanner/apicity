import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal topaz upscale image precision integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/topaz-upscale-image-precision");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upscale an image with the precision model", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Upstream's own sample source, from the endpoint's OpenAPI examples. It
    // is 400x225 (0.09 MP), so the default 2x factor yields 0.36 MP of output
    // — one minimum billing block, since fal charges per 24 megapixels of
    // output (BR-14).
    const result = await provider.run.topaz.upscale.image.precision({
      image_url:
        "https://storage.googleapis.com/falserverless/model_tests/codeformer/codeformer_poor_1.jpeg",
      model: "Standard V2",
      upscale_factor: 2,
      output_format: "jpeg",
    });

    expect(result).toBeDefined();
    expect(typeof result.image.url).toBe("string");
    expect(result.image.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: image_url is required and rejects the empty string.
  it("should reject a payload missing image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      model: "Standard V2",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should reject an empty image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "",
    });
    expect(v.success).toBe(false);
  });

  // BR-12/AC-08: the model enum stays open to Topaz's own new revisions but
  // must still reject typos and other families' identifiers.
  it("should accept every enumerated precision model", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const model of [
      "Standard V2",
      "High Fidelity V3",
      "High Fidelity V2",
      "Low Resolution V2",
      "CGI",
      "Text Refine",
    ]) {
      const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
        image_url: "https://example.com/photo.jpg",
        model,
      });
      expect(v.success, model).toBe(true);
    }
  });

  it("should accept an unlisted Topaz precision revision", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "https://example.com/photo.jpg",
      model: "High Fidelity V4",
    });
    expect(v.success).toBe(true);
  });

  it("should reject a misspelled model identifier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "https://example.com/photo.jpg",
      model: "standard v2",
    });
    expect(v.success).toBe(false);
  });

  it("should reject upscale_factor outside the documented 1-4 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const upscale_factor of [0.5, 4.5]) {
      const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
        image_url: "https://example.com/photo.jpg",
        upscale_factor,
      });
      expect(v.success, String(upscale_factor)).toBe(false);
    }
  });

  it("should accept upscale_factor at both documented bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const upscale_factor of [1, 4]) {
      const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
        image_url: "https://example.com/photo.jpg",
        upscale_factor,
      });
      expect(v.success, String(upscale_factor)).toBe(true);
    }
  });

  it("should reject an out-of-range enhancement level", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "https://example.com/photo.jpg",
      face_enhancement_strength: 1.5,
    });
    expect(v.success).toBe(false);
  });

  // Upstream floors Text Refine's `strength` at 0.01, not 0, and types the
  // four model-defaulted levels as nullable.
  it("should reject strength below the documented 0.01 floor", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "https://example.com/photo.jpg",
      strength: 0,
    });
    expect(v.success).toBe(false);
  });

  it("should accept null for the model-defaulted levels", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "https://example.com/photo.jpg",
      sharpen: null,
      denoise: null,
      fix_compression: null,
      strength: null,
    });
    expect(v.success).toBe(true);
  });

  it("should reject an unknown subject_detection mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.image.precision.schema.safeParse({
      image_url: "https://example.com/photo.jpg",
      subject_detection: "Everything",
    });
    expect(v.success).toBe(false);
  });
});
