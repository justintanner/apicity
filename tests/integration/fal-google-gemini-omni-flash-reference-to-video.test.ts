import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal google gemini-omni-flash reference-to-video integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody(
      "fal/google-gemini-omni-flash-reference-to-video"
    );
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video from a reference image and a prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape the schema offers: a single reference image — upstream's
    // own documented sample — at the minimum duration the range allows (3s
    // against a default of 8). Billing is per token over both the reference
    // images and the generated video, so one image and the shortest clip is
    // the cheapest call.
    const result = await provider.run.geminiOmniFlash.referenceToVideo({
      prompt:
        "<IMAGE_REF_0> walks slowly through a sunlit meadow, camera holding still.",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/veo31-r2v-input-1.png",
      ],
      aspect_ratio: "16:9",
      duration: 3,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: prompt and image_urls are both required, the prompt is capped at the
  // documented 20,000 characters, image_urls holds 1..10 entries, and duration
  // is bounded 3..10.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      image_urls: ["https://example.com/ref.png"],
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject a payload missing image_urls", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "<IMAGE_REF_0> walks through a meadow.",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_urls"))).toBe(
      true
    );
  });

  it("should reject an empty image_urls array", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "<IMAGE_REF_0> walks through a meadow.",
      image_urls: [],
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_urls"))).toBe(
      true
    );
  });

  it("should reject more reference images than the documented maximum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "<IMAGE_REF_0> walks through a meadow.",
      image_urls: Array.from(
        { length: 11 },
        (_, i) => `https://example.com/ref-${i}.png`
      ),
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("image_urls"))).toBe(
      true
    );
  });

  it("should accept reference images at both range bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const count of [1, 10]) {
      const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
        prompt: "<IMAGE_REF_0> walks through a meadow.",
        image_urls: Array.from(
          { length: count },
          (_, i) => `https://example.com/ref-${i}.png`
        ),
      });
      expect(v.success, `${count} image_urls`).toBe(true);
    }
  });

  it("should reject a prompt above the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "a".repeat(20_001),
      image_urls: ["https://example.com/ref.png"],
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept a prompt at the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "a".repeat(20_000),
      image_urls: ["https://example.com/ref.png"],
    });
    expect(v.success).toBe(true);
  });

  it("should reject an unknown aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "<IMAGE_REF_0> walks through a meadow.",
      image_urls: ["https://example.com/ref.png"],
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
      const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
        prompt: "<IMAGE_REF_0> walks through a meadow.",
        image_urls: ["https://example.com/ref.png"],
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
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt: "<IMAGE_REF_0> walks through a meadow.",
      image_urls: ["https://example.com/ref.png"],
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
      const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
        prompt: "<IMAGE_REF_0> walks through a meadow.",
        image_urls: ["https://example.com/ref.png"],
        aspect_ratio,
        duration,
      });
      expect(v.success, `${aspect_ratio} ${duration}`).toBe(true);
    }
  });

  it("should accept the minimal documented payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.referenceToVideo.schema.safeParse({
      prompt:
        "<IMAGE_REF_0> walks slowly through a sunlit meadow, camera holding still.",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/veo31-r2v-input-1.png",
      ],
    });
    expect(v.success).toBe(true);
  });
});
