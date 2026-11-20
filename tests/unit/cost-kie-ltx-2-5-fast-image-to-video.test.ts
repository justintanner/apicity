import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/ltx-2-5-fast-image-to-video-2026-11-20.json";

// KIE bills LTX 2.5 Fast image-to-video per second of video by resolution, at
// the Fast rates; the first-frame image and the frame rate do not change the
// price (feed and models API read 2026-11-20, ac-ey3b9p).
const MODEL = "ltx/2-5-fast-image-to-video";
const CREDIT = 0.005;
const IMAGE = "https://example.com/cat.jpg";

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

describe("kie LTX 2.5 Fast image-to-video pricing", () => {
  it("holds the three feed rows", () => {
    expect(evidence.feed.rows.map((row) => row.modelDescription)).toEqual([
      "LTX 2.5 Fast, image to video, 720p",
      "LTX 2.5 Fast, image to video, 1080p",
      "LTX 2.5 Fast, image to video, 1440p",
    ]);
  });

  it.each(evidence.feed.rows)("prices $modelDescription per second", (row) => {
    const resolution = row.modelDescription.split(", ").at(-1);
    const result = estimate({
      image_url: IMAGE,
      prompt: "x",
      resolution,
      duration: 8,
    });
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

  it("charges the text-to-video rates: the image adds nothing", () => {
    for (const resolution of ["720p", "1080p", "1440p"])
      expect(
        estimate({ image_url: IMAGE, prompt: "x", resolution, duration: 6 }).usd
      ).toBe(
        computeEstimate({
          provider: "kie",
          payload: {
            model: "ltx/2-5-fast-text-to-video",
            input: { prompt: "x", resolution, duration: 6 },
          },
        }).usd
      );
  });

  it("defaults to the documented 1080p and 10 seconds", () => {
    const result = estimate({ image_url: IMAGE, prompt: "x" });
    expect(result.usd).toBeCloseTo(10 * 0.078, 12);
    expect(result.breakdown).toMatchObject({ units: 10, perUnitUsd: 0.078 });
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
      url: "https://kie.ai/ltx-2-5?model=ltx%2F2-5-fast-image-to-video",
      asOf: "2026-11-20",
    });
  });
});
