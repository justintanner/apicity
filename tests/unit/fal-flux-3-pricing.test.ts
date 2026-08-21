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

    const at1080p = estimate("blackforestlabs/flux-3/text-to-video", {
      prompt: "p",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(2.9, 10);
    expect(at1080p.warnings).toEqual([]);
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
});
