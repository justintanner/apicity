import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

describe("fal minimax music-3 integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/minimax-music-3");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a song from a prompt and lyrics", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // Music generation is long-running, and compute seconds are what fal
    // bills, so this asks for the shortest useful clip (one 8-second
    // denoising chunk) at a low step count.
    const result = await provider.run.minimax.music3({
      prompt:
        "Genre: acoustic pop. BPM: 96. Key: C major. Warm and intimate. Vocals: soft female lead. Arrangement: fingerpicked guitar and soft piano.",
      lyrics: "[verse]\nMorning light filtering through the pine\n",
      duration: 8,
      num_inference_steps: 8,
      seed: 42,
    });

    expect(result).toBeDefined();
    expect(typeof result.audio.url).toBe("string");
    expect(result.audio.url.startsWith("http")).toBe(true);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.duration).toBe("number");
  }, 300000);

  // AC-3: prompt and lyrics are required, and duration,
  // num_inference_steps and guidance_scale are bounded upstream.
  it("should reject a payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.music3.schema.safeParse({
      lyrics: "[verse]\nla la la\n",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject a payload missing lyrics", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.music3.schema.safeParse({
      prompt: "acoustic pop",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("lyrics"))).toBe(true);
  });

  it("should reject duration outside the documented 1-300 second range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const base = { prompt: "acoustic pop", lyrics: "[verse]\nla la la\n" };
    expect(
      provider.run.minimax.music3.schema.safeParse({ ...base, duration: 0 })
        .success
    ).toBe(false);
    expect(
      provider.run.minimax.music3.schema.safeParse({ ...base, duration: 301 })
        .success
    ).toBe(false);
  });

  it("should accept duration at both documented bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const base = { prompt: "acoustic pop", lyrics: "[verse]\nla la la\n" };
    expect(
      provider.run.minimax.music3.schema.safeParse({ ...base, duration: 1 })
        .success
    ).toBe(true);
    expect(
      provider.run.minimax.music3.schema.safeParse({ ...base, duration: 300 })
        .success
    ).toBe(true);
  });

  it("should reject num_inference_steps outside the documented 1-100 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const base = { prompt: "acoustic pop", lyrics: "[verse]\nla la la\n" };
    expect(
      provider.run.minimax.music3.schema.safeParse({
        ...base,
        num_inference_steps: 0,
      }).success
    ).toBe(false);
    expect(
      provider.run.minimax.music3.schema.safeParse({
        ...base,
        num_inference_steps: 101,
      }).success
    ).toBe(false);
  });

  it("should reject guidance_scale outside the documented 0-20 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const base = { prompt: "acoustic pop", lyrics: "[verse]\nla la la\n" };
    expect(
      provider.run.minimax.music3.schema.safeParse({
        ...base,
        guidance_scale: -0.1,
      }).success
    ).toBe(false);
    expect(
      provider.run.minimax.music3.schema.safeParse({
        ...base,
        guidance_scale: 20.1,
      }).success
    ).toBe(false);
  });

  it("should accept a payload carrying only the required fields", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.minimax.music3.schema.safeParse({
      prompt: "acoustic pop",
      lyrics: "[verse]\nla la la\n",
    });
    expect(v.success).toBe(true);
  });
});
