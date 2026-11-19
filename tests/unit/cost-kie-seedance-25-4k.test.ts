import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/seedance-2-5-4k-2026-11-19.json";

// KIE bills Seedance 2.5 per second by resolution and video input. The 4K
// tier arrived on 2026-11-19 (feed and models API read that day, ac-vggwxn):
// with video input, rate x (input + output) seconds; without it, rate x
// output seconds.
const MODEL = "bytedance/seedance-2-5";
const CREDIT = 0.005;
const VIDEO = "https://example.com/clip.mp4";

const estimate = (
  input: Record<string, unknown>,
  costHints?: { durationSeconds?: number; inputDurationSeconds?: number }
) =>
  computeEstimate({
    provider: "kie",
    payload: { model: MODEL, input },
    ...(costHints ? { costHints } : {}),
  });

// "bytedance/seedance-2-5, 4K with video" -> the request that selects it.
const rowInput = (description: string) => {
  const label = description.split(", ")[1] ?? "";
  const resolution = /^4K\b/.test(label) ? "4k" : label.split(" ")[0];
  return {
    prompt: "x",
    duration: 6,
    resolution,
    ...(/with video/.test(label) ? { reference_video_urls: [VIDEO] } : {}),
  };
};

describe("kie Seedance 2.5 pricing, 4K tier", () => {
  it("holds all eight feed rows, the two 4K rows first", () => {
    expect(evidence.feed.rows.map((row) => row.modelDescription)).toEqual([
      "bytedance/seedance-2-5, 4K with video",
      "bytedance/seedance-2-5, 4K no video",
      "bytedance/seedance-2-5, 1080p with video",
      "bytedance/seedance-2-5, 1080p no video",
      "bytedance/seedance-2-5, 720p with video",
      "bytedance/seedance-2-5, 720p no video",
      "bytedance/seedance-2-5, 480p with video",
      "bytedance/seedance-2-5, 480p no video",
    ]);
  });

  it("matches the models API pricingDesc 4K line", () => {
    expect(evidence.models_api.entry.pricingDesc).toContain(
      "4K: 155 credits/s ($0.775/s, with video) | 251 credits/s ($1.255/s, no video)"
    );
  });

  it.each(evidence.feed.rows)("prices $modelDescription", (row) => {
    const video = /with video/.test(row.modelDescription);
    // 6 s out, plus 4 s of reference video when the row has video input.
    const seconds = video ? 10 : 6;
    const result = estimate(
      rowInput(row.modelDescription),
      video ? { inputDurationSeconds: 4 } : undefined
    );
    expect(result.usd).toBeCloseTo(
      seconds * Number(row.creditPrice) * CREDIT,
      12
    );
    expect(result.usd).toBeCloseTo(seconds * Number(row.usdPrice), 12);
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-19");
  });

  it("prices a 4 s 4K text-to-video at 1004 credits", () => {
    const result = estimate({ prompt: "x", duration: 4, resolution: "4k" });
    expect(result.usd).toBeCloseTo(1004 * CREDIT, 12);
  });

  it("fails a 4K reference-video request closed without its clip length", () => {
    const result = estimate({
      prompt: "x",
      duration: 6,
      resolution: "4k",
      reference_video_urls: [VIDEO],
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(
      "costHints.inputDurationSeconds"
    );
  });

  it("keeps the 4K tier off the draft render", () => {
    const draft = PRICING.kie["bytedance/seedance-2-5-draft"];
    expect(draft.kind).toBe("perUnit");
    if (draft.kind !== "perUnit") return;
    expect(Object.keys(draft.rates).sort()).toEqual([
      "1080p|no-video",
      "1080p|video",
    ]);
  });
});
