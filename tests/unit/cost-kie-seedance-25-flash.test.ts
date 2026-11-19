import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/seedance-2-5-flash-2026-11-19.json";

// KIE bills Seedance 2.5 Flash per second by resolution and video input (feed
// and models API read 2026-11-19): with video input, rate x (input + output)
// seconds; without it, rate x output seconds.
const MODEL = "bytedance/seedance-2-5-flash";
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

const rowInput = (description: string) => ({
  prompt: "x",
  duration: 6,
  resolution: /480p/.test(description) ? "480p" : "720p",
  ...(/with video/.test(description) ? { reference_video_urls: [VIDEO] } : {}),
});

describe("kie Seedance 2.5 Flash pricing", () => {
  it("holds the four feed rows", () => {
    expect(evidence.feed.rows.map((row) => row.modelDescription)).toEqual([
      "bytedance/seedance-2-5-flash, 720p with video",
      "bytedance/seedance-2-5-flash, 720p no video",
      "bytedance/seedance-2-5-flash, 480p with video",
      "bytedance/seedance-2-5-flash, 480p no video",
    ]);
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

  it("matches the recorded 4 s bill of 74 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(74);
    const result = estimate(recording.request);
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
    expect(result.usd).toBeCloseTo(recording.usd, 12);
  });

  it("defaults the resolution to 720p", () => {
    const result = estimate({ prompt: "x", duration: 4 });
    expect(result.usd).toBeCloseTo(4 * 41 * CREDIT, 12);
  });

  it("needs a duration: omitted or -1, KIE bills the generated length", () => {
    for (const input of [
      { prompt: "x", resolution: "480p" },
      { prompt: "x", resolution: "480p", duration: -1 },
    ]) {
      const blind = estimate(input);
      expect(blind.usd).toBe(0);
      expect(blind.warnings.join(" ")).toContain("durationSeconds");

      const hinted = estimate(input, { durationSeconds: 7 });
      expect(hinted.usd).toBeCloseTo(7 * 18.5 * CREDIT, 12);
      expect(hinted.warnings).toEqual([]);
    }
  });

  it("fails closed on reference video without its declared length", () => {
    const result = estimate({
      prompt: "x",
      resolution: "480p",
      duration: 5,
      reference_video_urls: [VIDEO],
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain("inputDurationSeconds");
  });

  it("does not bill reference images or audio as video input", () => {
    const result = estimate({
      prompt: "x",
      resolution: "480p",
      duration: 5,
      reference_image_urls: ["https://example.com/a.png"],
      reference_audio_urls: ["https://example.com/a.mp3"],
    });
    expect(result.usd).toBeCloseTo(5 * 18.5 * CREDIT, 12);
  });

  it("quotes nothing for a resolution Flash does not offer", () => {
    const result = estimate({ prompt: "x", resolution: "1080p", duration: 5 });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(MODEL);
  });

  it("is priced apart from Seedance 2.5", () => {
    const input = { prompt: "x", resolution: "480p", duration: 4 };
    const flash = estimate(input).usd;
    const base = computeEstimate({
      provider: "kie",
      payload: { model: "bytedance/seedance-2-5", input },
    }).usd;
    expect(flash).toBeCloseTo(4 * 0.0925, 12);
    expect(base).toBeCloseTo(4 * 0.14, 12);
  });

  it("cites the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/seedance-2-5-flash",
      asOf: "2026-11-19",
    });
  });
});
