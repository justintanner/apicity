import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal google gemini-omni-flash image-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/google-gemini-omni-flash-image-to-video");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should animate a still image from a natural-language prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape the schema offers: upstream's own documented sample image
    // at the minimum duration the range allows (3s against a default of 8).
    // Billing is per token over the generated video, so the shortest clip is
    // the cheapest call.
    const result = await provider.run.geminiOmniFlash.imageToVideo({
      prompt: "The dog turns its head and wags its tail in warm sunlight.",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/dog.png",
      aspect_ratio: "16:9",
      duration: 3,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: prompt and image_url are both required, the prompt is capped at the
  // documented 20,000 characters, and duration is bounded 3..10.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      image_url: "https://example.com/dog.png",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject a payload missing image_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      prompt: "The dog wags its tail.",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should reject a prompt above the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      prompt: "a".repeat(20_001),
      image_url: "https://example.com/dog.png",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept a prompt at the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      prompt: "a".repeat(20_000),
      image_url: "https://example.com/dog.png",
    });
    expect(v.success).toBe(true);
  });

  it("should reject an unknown aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      prompt: "The dog wags its tail.",
      image_url: "https://example.com/dog.png",
      aspect_ratio: "1:1",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("aspect_ratio"))).toBe(
      true
    );
  });

  it("should reject a duration outside the documented range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const duration of [2, 11]) {
      const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
        prompt: "The dog wags its tail.",
        image_url: "https://example.com/dog.png",
        duration,
      });
      expect(v.success, `duration ${duration}`).toBe(false);
      if (v.success) throw new Error("expected failure");
      expect(v.error.issues.some((i) => i.path.includes("duration"))).toBe(
        true
      );
    }
  });

  it("should reject a fractional duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      prompt: "The dog wags its tail.",
      image_url: "https://example.com/dog.png",
      duration: 4.5,
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("duration"))).toBe(true);
  });

  it("should accept both documented aspect ratios at the range bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const [aspect_ratio, duration] of [
      ["16:9", 3],
      ["9:16", 10],
    ] as const) {
      const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
        prompt: "The dog wags its tail.",
        image_url: "https://example.com/dog.png",
        aspect_ratio,
        duration,
      });
      expect(v.success, `${aspect_ratio} ${duration}`).toBe(true);
    }
  });

  it("should accept the minimal documented payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.imageToVideo.schema.safeParse({
      prompt: "The dog turns its head and wags its tail in warm sunlight.",
      image_url:
        "https://storage.googleapis.com/falserverless/example_inputs/dog.png",
    });
    expect(v.success).toBe(true);
  });
});
