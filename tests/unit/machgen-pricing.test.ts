import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  PRICING,
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "@apicity/cost";
import { machgenPayload, MACHGEN_CASES } from "../machgen-helpers";
import type { CostHints } from "@apicity/cost";

const estimate = (
  overrides: Record<string, unknown> = {},
  costHints?: CostHints
) =>
  computeEstimate({
    provider: "machgen",
    payload: { ...machgenPayload(0, "T2V"), ...overrides },
    costHints,
  });
describe("MachGen pricing", () => {
  it("prices all 16 approved recording payloads at gross rates", () => {
    const expected = [
      [0.035, 0.035, 0.05],
      [0.4, 0.4, 0.4],
      [0.28, 0.28, 0.28],
      [0.098, 0.098, 0.098],
      [0.396, 0.396, 0.396],
      [0.095],
    ];
    for (const [i] of MACHGEN_CASES.entries()) {
      const tasks =
        i === 5 ? (["I2V"] as const) : (["T2V", "I2V", "R2V"] as const);
      for (const [j, task] of tasks.entries()) {
        const result = computeEstimate({
          provider: "machgen",
          payload: machgenPayload(i, task),
        });
        expect(result.usd).toBeCloseTo(expected[i]![j]!, 8);
        expect(result.warnings).toEqual([]);
        expect(result.rateAsOf).toBe("2026-10-22");
      }
    }
  });
  it("applies H3 graduated pricing, frame snapping and frame-to-frame rates", () => {
    expect(
      estimate({ video_config: { height: 768, duration_secs: 30 } }).usd
    ).toBeCloseTo(0.9);
    expect(
      estimate({ video_config: { height: 480, duration_secs: 30 } }).usd
    ).toBeCloseTo(0.7875);
    expect(
      estimate({ video_config: { height: 480, num_frames: 22 } }).usd
    ).toBeCloseTo(0.035);
    expect(
      estimate({ task_type: "I2V", src_image_urls: ["a", "b"] }).usd
    ).toBeCloseTo(0.05);
    expect(
      estimate({
        adapter: "example-adapter",
        video_config: { height: 768, duration_secs: 30 },
      }).usd
    ).toBeCloseTo(1.125);
    expect(
      estimate(
        { task_type: "R2V", src_video_urls: ["v"] },
        { inputDurationSeconds: 20 }
      ).usd
    ).toBeCloseTo(1.05);
  });
  it("fails closed for unpriced and unknowable charges", () => {
    for (const overrides of [
      { video_config: { height: 1080, duration_secs: 1 } },
      { video_config: { height: 1440, duration_secs: 16 } },
      { video_config: { height: 480, duration_secs: 31 } },
      { video_config: { height: 480, duration_secs: 1, sharpen: true } },
      { src_task_ids: ["opaque"] },
      { model: "Unknown-Model" },
      { model: "Grok-Imagine-Video-1.5", task_type: "T2V" },
    ]) {
      expect(estimate(overrides).usd).toBe(0);
      expect(estimate(overrides).warnings.length).toBeGreaterThan(0);
    }
  });
  it("requires duration hints for Smart length and input-video charges", () => {
    const smart = { video_config: { height: 480, duration_secs: -1 } };
    expect(estimate(smart).warnings.join()).toContain(
      "costHints.durationSeconds"
    );
    expect(estimate(smart, { durationSeconds: 10 }).usd).toBeCloseTo(0.35);
    const video = {
      model: "Seedance-2.5",
      task_type: "R2V",
      src_video_urls: ["v"],
      video_config: { height: 480, duration_secs: 4 },
    };
    expect(estimate(video).warnings.join()).toContain(
      "input plus output seconds"
    );
    expect(estimate(video, { inputDurationSeconds: 3 }).usd).toBeCloseTo(0.42);
    expect(estimate(video, { inputDurationSeconds: -1 }).usd).toBe(0);
    expect(
      estimate({
        model: "Seedance-2.5",
        draft_source_task_id: "draft",
        video_config: { height: 480, duration_secs: 4 },
      }).usd
    ).toBeCloseTo(2.36);
  });
  it("pins provenance, shared slugs and displays", () => {
    for (const row of Object.values(PRICING.machgen))
      expect(row.source).toEqual({
        url: "https://www.machgen.ai/pricing",
        asOf: "2026-10-22",
      });
    expect(MODEL_SLUGS.machgen).toEqual({
      "MiniMax-H3": "mmh3",
      "Seedance-2.5": "sd2p5",
      "Seedance-2.0": "sd2",
      "Alibaba-Wan-3.0": "wan3p0",
      "HappyHorse-1.1": "hh1p1",
      "Grok-Imagine-Video-1.5": "grokimgv1p5",
    });
    for (const slug of Object.values(MODEL_SLUGS.machgen))
      expect([
        ...Object.values(MODEL_SLUGS.kie),
        ...Object.values(MODEL_SLUGS.xai),
      ]).toContain(slug);
    expect(Object.keys(MODEL_DISPLAY.machgen)).toEqual(
      Object.keys(MODEL_SLUGS.machgen)
    );
  });
});
