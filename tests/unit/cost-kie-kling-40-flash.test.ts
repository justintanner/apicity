import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/kling-40-flash-keyframe-to-video-2026-11-12.json";

// KIE bills Kling 4.0 Flash keyframe-to-video per output second at its only
// resolution, 720p: 17 credits (feed and models API read 2026-11-12).
const MODEL = "kling-4.0/flash-keyframe-to-video";
const CREDIT = 0.005;

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

describe("kie Kling 4.0 Flash keyframe-to-video pricing", () => {
  it.each(evidence.feed.rows)("prices $modelDescription per second", (row) => {
    for (const duration of [3, 10, 20]) {
      const result = estimate({ prompt: "x", duration, resolution: "720p" });
      expect(result.usd, String(duration)).toBeCloseTo(
        duration * Number(row.creditPrice) * CREDIT,
        12
      );
      expect(result.usd, String(duration)).toBeCloseTo(
        duration * Number(row.usdPrice),
        12
      );
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe("2026-11-12");
    }
  });

  it("prices the documented 5 s and 720p defaults", () => {
    const result = estimate({ prompt: "x" });
    expect(result.usd).toBeCloseTo(5 * 17 * CREDIT, 12);
    expect(result.breakdown).toMatchObject({ units: 5, unit: "seconds" });
  });

  it("matches the recorded 3 s bill of 51 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(51);
    const result = estimate(recording.request);
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
  });

  it("does not price the docs' non-Flash callback example as Flash", () => {
    const [example] = evidence.docs[0].callbackExamples;
    expect(example.creditsConsumed).toBe(285);
    // 285 credits for 10 s is the non-Flash 28.5 credits/s rate.
    expect(estimate({ prompt: "x", duration: 10 }).usd).toBeCloseTo(
      10 * 17 * CREDIT,
      12
    );
    expect(10 * 17).not.toBe(example.creditsConsumed);
  });

  it("quotes nothing for a resolution Flash does not offer", () => {
    const result = estimate({ prompt: "x", resolution: "1080p" });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(MODEL);
  });

  it("cites the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/kling-4-0-flash?model=kling-4.0%2Fflash-keyframe-to-video",
      asOf: "2026-11-12",
    });
  });
});
