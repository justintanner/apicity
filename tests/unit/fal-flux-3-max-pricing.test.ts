import { describe, expect, it } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

function estimate(endpoint: string, payload: Record<string, unknown>) {
  return computeEstimate({ provider: "fal", endpoint, payload });
}

const frame = {
  image_url: "https://example.com/frame.jpg",
  frame_index: 0,
};

describe("fal FLUX 3 Max pricing", () => {
  it("prices text-to-video at both published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.2125, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(0.725, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices image-to-video at both published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3-max/image-to-video", {
      prompt: "p",
      image_url: "https://example.com/image.jpg",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.2125, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3-max/image-to-video", {
      prompt: "p",
      image_url: "https://example.com/image.jpg",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(0.725, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices keyframes-to-video at both published resolution tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3-max/keyframes-to-video", {
      prompt: "p",
      keyframes: [frame],
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.2125, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3-max/keyframes-to-video", {
      prompt: "p",
      keyframes: [frame],
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(0.725, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("uses the OpenAPI defaults when duration and resolution are omitted", () => {
    const estimated = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
    });
    expect(estimated.usd).toBeCloseTo(0.2125, 10);
    expect(estimated.warnings).toEqual([]);
  });

  it("does not change the rate for audio or reasoning level", () => {
    const audioOff = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "720p",
      duration: 5,
      generate_audio: false,
      reasoning_level: "low",
    });
    const audioOn = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "720p",
      duration: 5,
      generate_audio: true,
      reasoning_level: "high",
    });
    expect(audioOff.usd).toBeCloseTo(0.2125, 10);
    expect(audioOn.usd).toBeCloseTo(audioOff.usd, 10);
  });
});
