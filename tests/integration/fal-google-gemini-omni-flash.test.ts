import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal google gemini-omni-flash integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/google-gemini-omni-flash");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video with synchronized audio from a prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape the schema offers: the documented minimum duration.
    const result = await provider.run.geminiOmniFlash({
      prompt: "A calico cat naps on a sunlit windowsill, purring softly.",
      duration: 3,
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: prompt is required; duration is bounded to 3-10 inclusive and
  // aspect_ratio is a closed vocabulary of the two documented values.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({ duration: 5 });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject a prompt above the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({
      prompt: "a".repeat(20_001),
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept a prompt at the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({
      prompt: "a".repeat(20_000),
    });
    expect(v.success).toBe(true);
  });

  it("should reject duration below the documented minimum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({
      prompt: "a cat",
      duration: 2,
    });
    expect(v.success).toBe(false);
  });

  it("should reject duration above the documented maximum", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({
      prompt: "a cat",
      duration: 11,
    });
    expect(v.success).toBe(false);
  });

  it("should reject a non-integer duration", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({
      prompt: "a cat",
      duration: 4.5,
    });
    expect(v.success).toBe(false);
  });

  it("should accept duration at the documented bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const duration of [3, 10]) {
      const v = provider.run.geminiOmniFlash.schema.safeParse({
        prompt: "a cat",
        duration,
      });
      expect(v.success, `duration ${duration}`).toBe(true);
    }
  });

  it("should accept both documented aspect ratios", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const aspect_ratio of ["16:9", "9:16"]) {
      const v = provider.run.geminiOmniFlash.schema.safeParse({
        prompt: "a cat",
        aspect_ratio,
      });
      expect(v.success, aspect_ratio).toBe(true);
    }
  });

  it("should reject an undocumented aspect ratio", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.schema.safeParse({
      prompt: "a cat",
      aspect_ratio: "1:1",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("aspect_ratio"))).toBe(
      true
    );
  });
});
