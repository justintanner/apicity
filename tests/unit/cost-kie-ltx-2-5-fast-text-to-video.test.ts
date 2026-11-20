import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/ltx-2-5-fast-text-to-video-2026-11-20.json";

// KIE bills LTX 2.5 Fast text-to-video per second of video by resolution;
// frame rate does not change the price (feed and models API read 2026-11-20,
// ac-ujmlmh).
const MODEL = "ltx/2-5-fast-text-to-video";
const CREDIT = 0.005;

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

describe("kie LTX 2.5 Fast text-to-video pricing", () => {
  it("holds the three feed rows", () => {
    expect(evidence.feed.rows.map((row) => row.modelDescription)).toEqual([
      "LTX 2.5 Fast, text to video, 720p",
      "LTX 2.5 Fast, text to video, 1080p",
      "LTX 2.5 Fast, text to video, 1440p",
    ]);
  });

  it.each(evidence.feed.rows)("prices $modelDescription per second", (row) => {
    const resolution = row.modelDescription.split(", ").at(-1);
    const result = estimate({ prompt: "x", resolution, duration: 8 });
    expect(result.usd).toBeCloseTo(8 * Number(row.creditPrice) * CREDIT, 12);
    expect(result.usd).toBeCloseTo(8 * Number(row.usdPrice), 12);
    expect(result.breakdown).toEqual({
      units: 8,
      unit: "seconds",
      perUnitUsd: Number(row.usdPrice),
    });
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-20");
  });

  it("defaults to the documented 1080p and 10 seconds", () => {
    const result = estimate({ prompt: "x" });
    expect(result.usd).toBeCloseTo(10 * 0.078, 12);
    expect(result.breakdown).toMatchObject({ units: 10, perUnitUsd: 0.078 });
  });

  it("does not change the price with fps or seed", () => {
    const base = estimate({ prompt: "x", resolution: "720p", duration: 6 });
    for (const fps of [24, 25, 48, 50])
      expect(
        estimate({ prompt: "x", resolution: "720p", duration: 6, fps, seed: 7 })
          .usd
      ).toBe(base.usd);
  });

  it.each([null, "six", { s: 6 }])("fails duration %j closed", (duration) => {
    const result = estimate({ prompt: "x", duration });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("could not derive units");
  });

  it("matches the recorded 720p 6 s bill of 64.8 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(64.8);
    expect(estimate(recording.request).usd).toBeCloseTo(
      recording.creditsConsumed * CREDIT,
      12
    );
  });

  it("dates the entry to the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/ltx-2-5?model=ltx%2F2-5-fast-text-to-video",
      asOf: "2026-11-20",
    });
  });
});
