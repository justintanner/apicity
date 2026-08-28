import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";

// This endpoint downloads `video_url` server-side and rejects data URLs
// outright ("Failed to download the assets: Invalid URL: URL too long"), so
// the source is fal-hosted rather than inlined the way
// blackforestlabs/flux-video-upscale inlines its fixture. This is
// tests/fixtures/seedance-ref.mp4 — 720x576, 4.0s — uploaded once to fal
// storage before recording.
const SOURCE_VIDEO_URL =
  "https://v3b.fal.media/files/b/0aa81cc4/YSFz_9f2qby6PzwOC6CMz_topaz-precision-source.mp4";

describe("fal topaz upscale video precision integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/topaz-upscale-video-precision");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upscale a video with the precision model", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 300000,
    });

    // At 1.25x the output is 900x720 — the cheapest published tier ("$0.10
    // per 10 seconds of output at 720p") and a single billing block, since
    // the clip is well under ten seconds (BR-14). `target_fps` is left unset
    // so Apollo frame interpolation stays off.
    const result = await provider.run.topaz.upscale.video.precision({
      video_url: SOURCE_VIDEO_URL,
      model: "Proteus",
      upscale_factor: 1.25,
    });

    expect(result).toBeDefined();
    expect(typeof result.video.url).toBe("string");
    expect(result.video.url.startsWith("http")).toBe(true);
  }, 300000);

  // AC-3: video_url is the only required field.
  it("should reject a payload missing video_url", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
      model: "Proteus",
    });
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("video_url"))).toBe(true);
  });

  // BR-12/AC-08: the model enum stays open to Topaz's own new revisions but
  // must still reject typos and other families' identifiers.
  it("should accept every enumerated precision model", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const model of [
      "Proteus",
      "Proteus Natural",
      "Iris",
      "Iris Low Quality",
      "Dione DV",
      "Dione TV",
      "Dione Robust",
      "Dione Dehalo",
      "Dione Robust Dehalo",
      "Artemis High Quality",
      "Artemis Medium Quality",
      "Artemis Low Quality",
      "Artemis Strong Halo",
      "Artemis Medium Halo",
      "Artemis Aliasing & Moire",
      "Gaia HQ",
      "Gaia CG",
      "Gaia 2",
      "Rhea",
      "Theia Fine Tune Detail",
      "Theia Fine Tune Fidelity",
    ]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        model,
      });
      expect(v.success, model).toBe(true);
    }
  });

  it("should accept an unlisted Topaz precision revision", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const model of ["Proteus V3", "Gaia 3"]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        model,
      });
      expect(v.success, model).toBe(true);
    }
  });

  it("should reject a misspelled model identifier", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const model of ["proteus", "gaia hq", ""]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        model,
      });
      expect(v.success, JSON.stringify(model)).toBe(false);
    }
  });

  it("should reject upscale_factor outside the documented 1-4 range", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const upscale_factor of [0.5, 4.5]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        upscale_factor,
      });
      expect(v.success, String(upscale_factor)).toBe(false);
    }
  });

  it("should accept upscale_factor at both documented bounds", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const upscale_factor of [1, 4]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        upscale_factor,
      });
      expect(v.success, String(upscale_factor)).toBe(true);
    }
  });

  // target_fps is an integer band, not the 0-1 shape of the levels below.
  it("should bound target_fps to the documented 16-60 integers", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const target_fps of [16, 60]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        target_fps,
      });
      expect(v.success, String(target_fps)).toBe(true);
    }
    for (const target_fps of [15, 61, 30.5]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        target_fps,
      });
      expect(v.success, String(target_fps)).toBe(false);
    }
  });

  it("should reject an out-of-range enhancement level", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const key of ["compression", "noise", "halo", "recover_detail"]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        [key]: 1.5,
      });
      expect(v.success, key).toBe(false);
    }
  });

  // Film grain is a narrower band than the other levels: 0-0.1 in 0.01 steps.
  it("should hold grain to its 0-0.1 band and 0.01 step", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    for (const grain of [0, 0.05, 0.1]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        grain,
      });
      expect(v.success, String(grain)).toBe(true);
    }
    for (const grain of [0.11, 0.005]) {
      const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
        video_url: "https://example.com/clip.mp4",
        grain,
      });
      expect(v.success, String(grain)).toBe(false);
    }
  });

  // Upstream types every enhancement level as `number | null`, so null is an
  // accepted way to ask for the model's own default.
  it("should accept null for the model-defaulted levels", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
      video_url: "https://example.com/clip.mp4",
      target_fps: null,
      compression: null,
      noise: null,
      halo: null,
      grain: null,
      recover_detail: null,
    });
    expect(v.success).toBe(true);
  });

  it("should accept the full documented payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.topaz.upscale.video.precision.schema.safeParse({
      video_url: "https://example.com/clip.mp4",
      model: "Artemis High Quality",
      upscale_factor: 2,
      target_fps: 30,
      compression: 0.2,
      noise: 0.3,
      halo: 0.4,
      grain: 0.02,
      recover_detail: 0.5,
      H264_output: true,
    });
    expect(v.success).toBe(true);
  });
});
