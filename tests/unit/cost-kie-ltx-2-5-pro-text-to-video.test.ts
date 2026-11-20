import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/ltx-2-5-pro-text-to-video-2026-11-20.json";

// KIE bills LTX 2.5 Pro text-to-video per second of video by resolution;
// frame rate does not change the price (feed and models API read 2026-11-20,
// ac-dwmekr).
const MODEL = "ltx/2-5-pro-text-to-video";
const CREDIT = 0.005;

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

describe("kie LTX 2.5 Pro text-to-video pricing", () => {
  it("holds the two feed rows", () => {
    expect(evidence.feed.rows.map((row) => row.modelDescription)).toEqual([
      "LTX 2.5 Pro, text to video, 720p",
      "LTX 2.5 Pro, text to video, 1080p",
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
    expect(result.usd).toBeCloseTo(10 * 0.102, 12);
    expect(result.breakdown).toMatchObject({ units: 10, perUnitUsd: 0.102 });
  });

  it("has no 1440p cell", () => {
    const result = estimate({ prompt: "x", resolution: "1440p", duration: 6 });
    expect(result.usd).toBe(0);
    expect(result.warnings).not.toEqual([]);
  });

  it("does not change the price with fps", () => {
    const base = estimate({ prompt: "x", resolution: "720p", duration: 6 }).usd;
    for (const fps of [25, 48, 50])
      expect(
        estimate({ prompt: "x", resolution: "720p", duration: 6, fps }).usd
      ).toBe(base);
  });

  it("matches the recorded 720p 6 s bill of 86.4 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(86.4);
    expect(estimate(recording.request).usd).toBeCloseTo(
      recording.creditsConsumed * CREDIT,
      12
    );
  });

  it("dates the entry to the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/ltx-2-5?model=ltx%2F2-5-pro-text-to-video",
      asOf: "2026-11-20",
    });
  });
});
