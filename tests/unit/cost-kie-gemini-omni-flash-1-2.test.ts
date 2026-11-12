import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/google-gemini-omni-flash-1-2-2026-11-12.json";

// KIE bills Gemini Omni Flash 1.2 per second of output by resolution (feed
// and models API read 2026-11-12). Video edit sends no duration and bills the
// input video's length, which callers declare as costHints.durationSeconds.
const MODEL = "google/gemini-omni-flash-1-2";

const estimate = (
  input: Record<string, unknown>,
  costHints?: { durationSeconds: number }
) =>
  computeEstimate({
    provider: "kie",
    payload: { model: MODEL, input },
    ...(costHints ? { costHints } : {}),
  });

describe("kie Gemini Omni Flash 1.2 per-second pricing", () => {
  it.each(evidence.feed.rows)(
    "prices $modelDescription at the published credits per second",
    (row) => {
      const resolution = row.modelDescription.split(", ").at(-1)!;
      const result = estimate({ prompt: "x", duration: 5, resolution });
      expect(result.usd).toBeCloseTo(5 * Number(row.creditPrice) * 0.005, 12);
      expect(result.breakdown.unit).toBe("seconds");
      expect(result.breakdown.units).toBe(5);
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe("2026-11-12");
    }
  );

  it("cites the feed anchor as its price page", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/gemini-omni-1-2-flash",
      asOf: "2026-11-12",
    });
  });

  it("matches the recorded 3 s 360p bill of 12 credits", () => {
    const [recording] = evidence.recordings;
    const result = estimate(recording.request);
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * 0.005, 12);
    expect(result.usd).toBeCloseTo(0.06, 12);
  });

  it("prices an omitted resolution at the documented 720p default", () => {
    expect(estimate({ prompt: "x", duration: 8 }).usd).toBeCloseTo(
      8 * 0.045,
      12
    );
  });

  it("prices a video edit from the declared input length, and asks for it otherwise", () => {
    const input = {
      prompt: "Restyle the clip.",
      video_list: ["https://example.com/clip.mp4"],
      resolution: "1080p",
    };
    const declared = estimate(input, { durationSeconds: 6 });
    expect(declared.usd).toBeCloseTo(6 * 0.05, 12);
    expect(declared.warnings).toEqual([]);

    const undeclared = estimate(input);
    expect(undeclared.usd).toBe(0);
    expect(undeclared.warnings.join(" ")).toContain(
      "costHints.durationSeconds"
    );
  });
});
