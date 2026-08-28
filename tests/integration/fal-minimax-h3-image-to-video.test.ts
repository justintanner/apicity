import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal minimax h3 image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/minimax-h3-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a first frame", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape upstream offers: the shortest duration (5s), the lowest
    // native resolution (480P — 2K and 4K upscale a 768P base instead), and
    // no prompt expansion.
    const result = await provider.run.minimax.h3.imageToVideo({
      prompt:
        "The camera drifts slowly forward as soft afternoon light moves across the scene.",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/hailuo23/pro_i2v_in.jpg",
      duration: 5,
      resolution: "480P",
      prompt_expansion_mode: "disabled",
    });

    expect(result).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
    if (result.video.content_type != null) {
      expect(result.video.content_type).toContain("video/");
    }
    // Expansion was disabled, so upstream reports no rewritten prompt.
    expect(result.expanded_prompt ?? null).toBeNull();
  }, 300000);

  // AC-3: prompt is the only required field and every vocabulary is closed.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      image_url: "https://example.com/first-frame.jpg",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept the minimal payload of prompt alone", () => {
    // Upstream documents omitting image_url as valid: the request is then
    // handled as text-to-video at 16:9. Mirrored rather than refined away.
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
    });
    expect(v.success).toBe(true);
  });

  it("should reject an empty prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      prompt: "",
    });
    expect(v.success).toBe(false);
  });

  it("should accept both keyframe URLs, and null for either", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      image_url: "https://example.com/first-frame.jpg",
      end_image_url: "https://example.com/last-frame.jpg",
    });
    expect(v.success).toBe(true);
    const nulled = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      image_url: null,
      end_image_url: null,
    });
    expect(nulled.success).toBe(true);
  });

  it("should reject a keyframe value that is not a URL", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const field of ["image_url", "end_image_url"]) {
      const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        [field]: "not-a-url",
      });
      expect(v.success, field).toBe(false);
    }
  });

  it("should bound duration to the published 5-15 second range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const parse = (duration: unknown) =>
      provider.run.minimax.h3.imageToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        duration,
      }).success;
    expect(parse(5)).toBe(true);
    expect(parse(15)).toBe(true);
    expect(parse(4)).toBe(false);
    expect(parse(16)).toBe(false);
    expect(parse(7.5)).toBe(false);
  });

  it("should accept every documented resolution tier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const resolution of ["480P", "768P", "2K", "4K"]) {
      const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        resolution,
      });
      expect(v.success, resolution).toBe(true);
    }
  });

  it("should reject an undocumented resolution tier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      resolution: "1080p",
    });
    expect(v.success).toBe(false);
  });

  it("should accept every prompt_expansion_mode, including null", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const mode of ["disabled", "fast", "balanced", "quality", null]) {
      const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        prompt_expansion_mode: mode,
      });
      expect(v.success, String(mode)).toBe(true);
    }
  });

  it("should reject an undocumented prompt_expansion_mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.imageToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      prompt_expansion_mode: "thorough",
    });
    expect(v.success).toBe(false);
  });
});
