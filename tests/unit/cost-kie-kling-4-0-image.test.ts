import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/kling-4-0-image-2026-11-19.json";

// KIE bills Kling 4.0 Image per output image by resolution, plus 0.5 credits
// for each reference image or element (feed and models API read 2026-11-19,
// ac-i4vebc).
const MODEL = "kling-4-0/image";
const CREDIT = 0.005;
const IMAGE = "https://example.com/a.png";

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

const tierRows = evidence.feed.rows.filter((row) =>
  /, (2K|4K|8K)$/.test(row.modelDescription)
);

describe("kie Kling 4.0 Image pricing", () => {
  it("holds the four feed rows", () => {
    expect(
      evidence.feed.rows.map((row) => row.modelDescription).sort()
    ).toEqual([
      "kling image 4.0, image, 2K",
      "kling image 4.0, image, 4K",
      "kling image 4.0, image, 8K",
      "kling image 4.0, image, reference image or element (each)",
    ]);
  });

  it.each(tierRows)("prices $modelDescription per image", (row) => {
    const resolution = row.modelDescription.slice(-2).toLowerCase();
    const result = estimate({ prompt: "x", resolution, count: 3 });
    expect(result.usd).toBeCloseTo(3 * Number(row.creditPrice) * CREDIT, 12);
    expect(result.usd).toBeCloseTo(3 * Number(row.usdPrice), 12);
    expect(result.breakdown).toMatchObject({ units: 3, unit: "images" });
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-19");
  });

  it("adds the per-reference row for each image and element", () => {
    const [row] = evidence.feed.rows.filter((r) =>
      /reference image or element/.test(r.modelDescription)
    );
    const each = Number(row.creditPrice) * CREDIT;
    expect(each).toBeCloseTo(Number(row.usdPrice), 12);
    const result = estimate({
      prompt: "@image_1 and @Hero",
      image_urls: [IMAGE, IMAGE],
      elements: [{ name: "Hero", image_urls: [IMAGE, IMAGE] }],
    });
    expect(result.usd).toBeCloseTo(0.0565 + 3 * each, 12);
    expect(result.breakdown).toMatchObject({ extraUsd: 3 * each });
  });

  it("defaults to one 2k image and fails a series request without count closed", () => {
    expect(estimate({ prompt: "x" }).usd).toBeCloseTo(0.0565, 12);
    const series = estimate({ prompt: "x", mode: "series" });
    expect(series.usd).toBe(0);
    expect(series.warnings[0]).toContain("could not derive units");
    expect(estimate({ prompt: "x", mode: "series", count: 4 }).usd).toBeCloseTo(
      4 * 0.0565,
      12
    );
  });

  it.each([0, 11, 2.5, "3"])("fails count %j closed", (count) => {
    expect(estimate({ prompt: "x", count }).usd).toBe(0);
  });

  it("fails a non-array reference list closed", () => {
    expect(estimate({ prompt: "x", image_urls: IMAGE }).usd).toBe(0);
  });

  it("matches the recorded 2k bill of 11.3 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(11.3);
    expect(estimate(recording.request).usd).toBeCloseTo(
      recording.creditsConsumed * CREDIT,
      12
    );
  });

  it("dates the entry to the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/kling-image-4-0?model=kling-4-0%2Fimage",
      asOf: "2026-11-19",
    });
  });
});
