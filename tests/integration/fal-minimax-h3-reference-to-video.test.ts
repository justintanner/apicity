import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal minimax h3 reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/minimax-h3-reference-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a subject reference image", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape upstream offers: the shortest duration (5s), the lowest
    // native resolution (480P — 2K and 4K upscale a 768P base instead), a
    // single reference asset, and no prompt expansion.
    const result = await provider.run.minimax.h3.referenceToVideo({
      prompt:
        "Image 1 is the subject. Keep it consistent while the camera drifts slowly forward through soft afternoon light.",
      reference_image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/hailuo23/pro_i2v_in.jpg",
      ],
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
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      reference_image_urls: ["https://example.com/subject.jpg"],
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept the minimal payload of prompt alone", () => {
    // Upstream marks every reference list optional, so a prompt-only request
    // is valid. Mirrored rather than refined away.
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
    });
    expect(v.success).toBe(true);
  });

  it("should reject an empty prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      prompt: "",
    });
    expect(v.success).toBe(false);
  });

  it("should accept all three reference modalities together", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      prompt: "Image 1 walks past Video 1 while Audio 1 plays.",
      reference_image_urls: ["https://example.com/subject.jpg"],
      reference_video_urls: ["https://example.com/motion.mp4"],
      reference_audio_urls: ["https://example.com/voice.mp3"],
    });
    expect(v.success).toBe(true);
  });

  it("should reject a reference URL that is not a URL", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const field of [
      "reference_image_urls",
      "reference_video_urls",
      "reference_audio_urls",
    ]) {
      const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        [field]: ["not-a-url"],
      });
      expect(v.success, field).toBe(false);
    }
  });

  it("should cap each reference list at its published length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const urls = (n: number) =>
      Array.from({ length: n }, (_, i) => `https://example.com/ref-${i}.bin`);
    const parse = (field: string, n: number) => {
      const payload: Record<string, unknown> = {
        prompt: "a kitten in a garden",
        [field]: urls(n),
      };
      // Audio may not stand alone upstream, so the audio list under test is
      // paired with one image; that is the audio-only rule, not this cap.
      if (field === "reference_audio_urls") {
        payload.reference_image_urls = ["https://example.com/subject.jpg"];
      }
      return provider.run.minimax.h3.referenceToVideo.schema.safeParse(payload)
        .success;
    };
    expect(parse("reference_image_urls", 9)).toBe(true);
    expect(parse("reference_image_urls", 10)).toBe(false);
    expect(parse("reference_video_urls", 3)).toBe(true);
    expect(parse("reference_video_urls", 4)).toBe(false);
    expect(parse("reference_audio_urls", 3)).toBe(true);
    expect(parse("reference_audio_urls", 4)).toBe(false);
  });

  it("should reject audio as the only reference modality", () => {
    // Upstream: "Audio cannot be the only reference input; provide at least
    // one reference image or video with it."
    const provider = createFal({ apiKey: "fal-test-key" });
    const audioOnly = provider.run.minimax.h3.referenceToVideo.schema.safeParse(
      {
        prompt: "Audio 1 plays over the scene.",
        reference_audio_urls: ["https://example.com/voice.mp3"],
      }
    );
    expect(audioOnly.success).toBe(false);
    if (audioOnly.success) throw new Error("expected failure");
    expect(
      audioOnly.error.issues.some((i) =>
        i.path.includes("reference_audio_urls")
      )
    ).toBe(true);

    const withImage = provider.run.minimax.h3.referenceToVideo.schema.safeParse(
      {
        prompt: "Image 1 dances to Audio 1.",
        reference_audio_urls: ["https://example.com/voice.mp3"],
        reference_image_urls: ["https://example.com/subject.jpg"],
      }
    );
    expect(withImage.success).toBe(true);
  });

  it("should cap the three reference lists at 12 files combined", () => {
    // The per-list caps sum to 15, so the combined cap bites on its own.
    const provider = createFal({ apiKey: "fal-test-key" });
    const urls = (n: number, tag: string) =>
      Array.from(
        { length: n },
        (_, i) => `https://example.com/${tag}-${i}.bin`
      );
    const parse = (images: number) =>
      provider.run.minimax.h3.referenceToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        reference_image_urls: urls(images, "img"),
        reference_video_urls: urls(3, "vid"),
        reference_audio_urls: urls(3, "aud"),
      }).success;
    expect(parse(6)).toBe(true);
    expect(parse(7)).toBe(false);
  });

  it("should bound duration to the published 5-15 second range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const parse = (duration: unknown) =>
      provider.run.minimax.h3.referenceToVideo.schema.safeParse({
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
      const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        resolution,
      });
      expect(v.success, resolution).toBe(true);
    }
  });

  it("should reject an undocumented resolution tier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      resolution: "1080p",
    });
    expect(v.success).toBe(false);
  });

  it("should accept every documented aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const aspect of [
      "adaptive",
      "21:9",
      "16:9",
      "4:3",
      "1:1",
      "3:4",
      "9:16",
    ]) {
      const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        aspect_ratio: aspect,
      });
      expect(v.success, aspect).toBe(true);
    }
  });

  it("should reject an undocumented aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      aspect_ratio: "2:1",
    });
    expect(v.success).toBe(false);
  });

  it("should accept every prompt_expansion_mode, including null", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const mode of ["disabled", "fast", "balanced", "quality", null]) {
      const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        prompt_expansion_mode: mode,
      });
      expect(v.success, String(mode)).toBe(true);
    }
  });

  it("should reject an undocumented prompt_expansion_mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.referenceToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      prompt_expansion_mode: "thorough",
    });
    expect(v.success).toBe(false);
  });
});
