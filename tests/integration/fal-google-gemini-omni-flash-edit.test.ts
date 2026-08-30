import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal google gemini-omni-flash edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/google-gemini-omni-flash-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit a source video from a natural-language instruction", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Cheapest shape the schema offers: the two required fields only, against
    // upstream's own short documented sample clip. Billing is per token over
    // the source video, so a shorter input is a cheaper call.
    const result = await provider.run.geminiOmniFlash.edit({
      prompt: "Make this video anime. Keep everything else the same.",
      video_url:
        "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
    });

    expect(result).toBeDefined();
    expect(result.video).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: prompt and video_url are both required, and the prompt is capped at
  // the documented 20,000 characters.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.edit.schema.safeParse({
      video_url: "https://example.com/clip.mp4",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject a payload missing video_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.edit.schema.safeParse({
      prompt: "Make this video anime.",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("video_url"))).toBe(true);
  });

  it("should reject a prompt above the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.edit.schema.safeParse({
      prompt: "a".repeat(20_001),
      video_url: "https://example.com/clip.mp4",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should accept a prompt at the documented maximum length", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.edit.schema.safeParse({
      prompt: "a".repeat(20_000),
      video_url: "https://example.com/clip.mp4",
    });
    expect(v.success).toBe(true);
  });

  it("should reject a non-string video_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.edit.schema.safeParse({
      prompt: "Make this video anime.",
      video_url: 42,
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("video_url"))).toBe(true);
  });

  it("should accept the minimal documented payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.geminiOmniFlash.edit.schema.safeParse({
      prompt: "Make this video anime. Keep everything else the same.",
      video_url:
        "https://storage.googleapis.com/falserverless/model_tests/video_models/mmaudio_input.mp4",
    });
    expect(v.success).toBe(true);
  });
});
