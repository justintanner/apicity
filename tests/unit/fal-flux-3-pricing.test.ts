import { describe, expect, it } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

function estimate(endpoint: string, payload: Record<string, unknown>) {
  return computeEstimate({ provider: "fal", endpoint, payload });
}

describe("fal FLUX 3 pricing", () => {
  it("prices text-to-video at both published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3/text-to-video", {
      prompt: "p",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.85, 10);
    expect(at720p.warnings).toEqual([]);
    expect(at720p.rateAsOf).toBe("2026-10-29");

    const at1080p = estimate("blackforestlabs/flux-3/text-to-video", {
      prompt: "p",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(2.9, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices text-to-video and image-to-video at 1440p and 2160p", () => {
    // Card read 2026-10-29: $0.32/s at 2K (1440p) and $0.47/s at 4K (2160p).
    for (const endpoint of [
      "blackforestlabs/flux-3/text-to-video",
      "blackforestlabs/flux-3/image-to-video",
    ]) {
      const at1440p = estimate(endpoint, {
        prompt: "p",
        resolution: "1440p",
        duration: 5,
        ...(endpoint.endsWith("image-to-video")
          ? { image_url: "https://example.com/image.jpg" }
          : {}),
      });
      expect(at1440p.usd, endpoint).toBeCloseTo(1.6, 10);
      expect(at1440p.warnings, endpoint).toEqual([]);
      expect(at1440p.rateAsOf, endpoint).toBe("2026-10-29");

      const at2160p = estimate(endpoint, {
        prompt: "p",
        resolution: "2160p",
        duration: 5,
        ...(endpoint.endsWith("image-to-video")
          ? { image_url: "https://example.com/image.jpg" }
          : {}),
      });
      expect(at2160p.usd, endpoint).toBeCloseTo(2.35, 10);
      expect(at2160p.warnings, endpoint).toEqual([]);
    }
  });

  it("prices image-to-video at both published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3/image-to-video", {
      prompt: "p",
      image_url: "https://example.com/image.jpg",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.85, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3/image-to-video", {
      prompt: "p",
      image_url: "https://example.com/image.jpg",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(2.9, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices first-last-frame-to-video at both resolution tiers", () => {
    const at720p = estimate(
      "blackforestlabs/flux-3/first-last-frame-to-video",
      {
        prompt: "p",
        start_image_url: "https://example.com/start.jpg",
        end_image_url: "https://example.com/end.jpg",
        resolution: "720p",
        duration: 5,
      }
    );
    expect(at720p.usd).toBeCloseTo(0.85, 10);
    expect(at720p.warnings).toEqual([]);
    expect(at720p.rateAsOf).toBe("2026-08-21");

    const at1440p = estimate(
      "blackforestlabs/flux-3/first-last-frame-to-video",
      {
        prompt: "p",
        start_image_url: "https://example.com/start.jpg",
        end_image_url: "https://example.com/end.jpg",
        resolution: "1440p",
        duration: 5,
      }
    );
    expect(at1440p.usd).toBe(0);
    expect(at1440p.warnings.join(" ")).toMatch(/no rate/);

    const at1080p = estimate(
      "blackforestlabs/flux-3/first-last-frame-to-video",
      {
        prompt: "p",
        start_image_url: "https://example.com/start.jpg",
        end_image_url: "https://example.com/end.jpg",
        resolution: "1080p",
        duration: 10,
      }
    );
    expect(at1080p.usd).toBeCloseTo(2.9, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices keyframes-to-video at both published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3/keyframes-to-video", {
      prompt: "p",
      keyframes: [{ image_url: "https://example.com/one.jpg", frame_index: 0 }],
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.85, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3/keyframes-to-video", {
      prompt: "p",
      keyframes: [{ image_url: "https://example.com/one.jpg", frame_index: 0 }],
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(2.9, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices extend-video at its higher published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3/extend-video", {
      prompt: "p",
      video_url: "https://example.com/video.mp4",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(2.05, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3/extend-video", {
      prompt: "p",
      video_url: "https://example.com/video.mp4",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(5.3, 10);
    expect(at1080p.warnings).toEqual([]);
  });
});
