import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal minimax h3 text-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/minimax-h3-text-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape upstream offers: the shortest duration (5s), the lowest
    // native resolution (480P — 2K and 4K upscale a 768P base instead), and
    // no prompt expansion.
    const result = await provider.run.minimax.h3.textToVideo({
      prompt:
        "A white kitten chases a butterfly across a sunlit garden. Gentle camera tracking, natural movement, soft afternoon light.",
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
    const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
      duration: 5,
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept the minimal payload of prompt alone", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
    });
    expect(v.success).toBe(true);
  });

  it("should reject an empty prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
      prompt: "",
    });
    expect(v.success).toBe(false);
  });

  it("should bound duration to the published 5-15 second range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const parse = (duration: unknown) =>
      provider.run.minimax.h3.textToVideo.schema.safeParse({
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
      const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        resolution,
      });
      expect(v.success, resolution).toBe(true);
    }
  });

  it("should reject an undocumented resolution tier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      resolution: "1080p",
    });
    expect(v.success).toBe(false);
  });

  it("should accept every documented aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const aspect_ratio of ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]) {
      const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        aspect_ratio,
      });
      expect(v.success, aspect_ratio).toBe(true);
    }
  });

  it("should reject an undocumented aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      aspect_ratio: "2:1",
    });
    expect(v.success).toBe(false);
  });

  it("should accept every prompt_expansion_mode, including null", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const mode of ["disabled", "fast", "balanced", "quality", null]) {
      const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
        prompt: "a kitten in a garden",
        prompt_expansion_mode: mode,
      });
      expect(v.success, String(mode)).toBe(true);
    }
  });

  it("should reject an undocumented prompt_expansion_mode", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.h3.textToVideo.schema.safeParse({
      prompt: "a kitten in a garden",
      prompt_expansion_mode: "thorough",
    });
    expect(v.success).toBe(false);
  });
});
