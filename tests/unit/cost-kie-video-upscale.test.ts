import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import type { CostHints } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/video-upscale-2026-11-12.json";

// KIE bills Kie Video Upscale per second of INPUT video by the `resolution`
// output box (feed and models API read 2026-11-12): 1.5 credits at 1080P, 3 at
// 2K (the documented default) and 6 at 4K. The request carries no duration,
// so the caller declares the source clip's length as costHints.durationSeconds.
const MODEL = "video/upscale";
const CREDIT = 0.005;
const VIDEO = "https://example.com/cat.mp4";

const estimate = (input: Record<string, unknown>, costHints?: CostHints) =>
  computeEstimate({
    provider: "kie",
    payload: { model: MODEL, input },
    ...(costHints ? { costHints } : {}),
  });

// "KIE Video Upscale, Video to Video, 1080P output, per second" names a box.
const boxOf = (description: string) =>
  description.split(", ")[2]!.split(" ")[0];

describe("kie Kie Video Upscale pricing", () => {
  it("has a feed row for every box", () => {
    expect(
      evidence.feed.rows.map((row) => boxOf(row.modelDescription))
    ).toEqual(["1080P", "2K", "4K"]);
  });

  it.each(evidence.feed.rows)("prices $modelDescription", (row) => {
    const result = estimate(
      { video_url: VIDEO, resolution: boxOf(row.modelDescription) },
      { durationSeconds: 10 }
    );
    expect(result.usd).toBeCloseTo(10 * Number(row.creditPrice) * CREDIT, 12);
    expect(result.usd).toBeCloseTo(10 * Number(row.usdPrice), 12);
    expect(result.rateAsOf).toBe("2026-11-12");
    expect(result.breakdown).toMatchObject({ units: 10, unit: "seconds" });
  });

  it("matches the recorded 1080P bill of 4.5 credits for the 3 s clip", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(4.5);
    const result = estimate(
      { video_url: VIDEO, resolution: recording.request.resolution },
      recording.costHints
    );
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
  });

  it("prices the documented default box, 2K, when the request omits it", () => {
    expect(
      estimate({ video_url: VIDEO }, { durationSeconds: 3 }).usd
    ).toBeCloseTo(3 * 3 * CREDIT, 12);
  });

  it("fails closed without the input length, which the request cannot carry", () => {
    const result = estimate({ video_url: VIDEO, resolution: "1080P" });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain("costHints.durationSeconds");
  });

  it("fails closed on a box outside the uppercase enum", () => {
    const result = estimate(
      { video_url: VIDEO, resolution: "1080p" },
      { durationSeconds: 3 }
    );
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain("no rate for variant '1080p'");
  });

  it("cites the feed anchor, read on 2026-11-12", () => {
    expect(PRICING.kie[MODEL]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "1080P": 0.0075, "2K": 0.015, "4K": 0.03 },
      source: { url: "https://kie.ai/video-upscaler", asOf: "2026-11-12" },
    });
    for (const row of evidence.feed.rows) {
      expect(row.anchor).toBe("https://kie.ai/video-upscaler");
    }
  });

  it("has no docs billing example to reproduce", () => {
    expect(
      evidence.docs[0].callbackExamples.map(
        (example) => example.creditsConsumed
      )
    ).toEqual([null]);
  });
});
