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
  it("prices text-to-video at the 720p and 1080p tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.5525, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(1.885, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  // The card read 2026-11-24 prices its own example during the 35% promotion:
  // "A 10-second 720p video costs $1.105."
  it("matches the card's ten-second example", () => {
    const estimated = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
      resolution: "720p",
      duration: 10,
    });
    expect(estimated.usd).toBeCloseTo(1.105, 10);
    expect(estimated.warnings).toEqual([]);
  });

  // The live OpenAPI enum spells the upscaled tiers "2K" and "4K"; the card
  // prices them at $0.26/s and $0.52/s during the promotion.
  it("prices the 2K and 4K tiers on every endpoint", () => {
    for (const [endpoint, extra] of [
      ["blackforestlabs/flux-3-max/text-to-video", {}],
      [
        "blackforestlabs/flux-3-max/image-to-video",
        { image_url: "https://example.com/image.jpg" },
      ],
      ["blackforestlabs/flux-3-max/keyframes-to-video", { keyframes: [frame] }],
    ] as const) {
      for (const [resolution, usd] of [
        ["2K", 1.3],
        ["4K", 2.6],
      ] as const) {
        const estimated = estimate(endpoint, {
          prompt: "p",
          ...extra,
          resolution,
          duration: 5,
        });
        expect(estimated.usd).toBeCloseTo(usd, 10);
        expect(estimated.warnings).toEqual([]);
      }
    }
  });

  it("prices image-to-video at the 720p and 1080p tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3-max/image-to-video", {
      prompt: "p",
      image_url: "https://example.com/image.jpg",
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.5525, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3-max/image-to-video", {
      prompt: "p",
      image_url: "https://example.com/image.jpg",
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(1.885, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("prices keyframes-to-video at the 720p and 1080p tiers", () => {
    const at720p = estimate("blackforestlabs/flux-3-max/keyframes-to-video", {
      prompt: "p",
      keyframes: [frame],
      resolution: "720p",
      duration: 5,
    });
    expect(at720p.usd).toBeCloseTo(0.5525, 10);
    expect(at720p.warnings).toEqual([]);

    const at1080p = estimate("blackforestlabs/flux-3-max/keyframes-to-video", {
      prompt: "p",
      keyframes: [frame],
      resolution: "1080p",
      duration: 10,
    });
    expect(at1080p.usd).toBeCloseTo(1.885, 10);
    expect(at1080p.warnings).toEqual([]);
  });

  it("uses the OpenAPI defaults when duration and resolution are omitted", () => {
    const estimated = estimate("blackforestlabs/flux-3-max/text-to-video", {
      prompt: "p",
    });
    expect(estimated.usd).toBeCloseTo(0.5525, 10);
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
    expect(audioOff.usd).toBeCloseTo(0.5525, 10);
    expect(audioOn.usd).toBeCloseTo(audioOff.usd, 10);
  });
});
