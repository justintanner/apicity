import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/ltx-2-5-fast-audio-to-video-2026-11-20.json";

// KIE bills LTX 2.5 Fast audio-to-video per second at the Fast rates, "billed
// on the actual video length (follows your audio, to 0.01 s)" (feed and
// models API read 2026-11-20, ac-ium3f4).
const MODEL = "ltx/2-5-fast-audio-to-video";
const CREDIT = 0.005;
const AUDIO = "https://example.com/voice.mp3";

const estimate = (
  input: Record<string, unknown>,
  costHints?: { durationSeconds: number }
) =>
  computeEstimate({
    provider: "kie",
    payload: {
      model: MODEL,
      input: { audio_url: AUDIO, prompt: "x", ...input },
    },
    ...(costHints ? { costHints } : {}),
  });

describe("kie LTX 2.5 Fast audio-to-video pricing", () => {
  it("holds the three feed rows", () => {
    expect(evidence.feed.rows.map((row) => row.modelDescription)).toEqual([
      "LTX 2.5 Fast, audio to video, 720p",
      "LTX 2.5 Fast, audio to video, 1080p",
      "LTX 2.5 Fast, audio to video, 1440p",
    ]);
  });

  it.each(evidence.feed.rows)("prices $modelDescription per second", (row) => {
    const resolution = row.modelDescription.split(", ").at(-1);
    const result = estimate({ resolution, duration: 7.5 });
    expect(result.usd).toBeCloseTo(7.5 * Number(row.creditPrice) * CREDIT, 12);
    expect(result.breakdown).toEqual({
      units: 7.5,
      unit: "seconds",
      perUnitUsd: Number(row.usdPrice),
    });
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-20");
  });

  it("prices an omitted duration from the declared audio length", () => {
    const result = estimate({}, { durationSeconds: 6.008 });
    expect(result.usd).toBeCloseTo(6.008 * 0.078, 12);
    expect(result.breakdown).toMatchObject({ units: 6.008, perUnitUsd: 0.078 });
  });

  it("cuts a longer audio to the limit: 20 s, or 10 s at 1440p or 48/50 fps", () => {
    expect(estimate({}, { durationSeconds: 45 }).breakdown.units).toBe(20);
    expect(
      estimate({ resolution: "1440p" }, { durationSeconds: 45 }).breakdown.units
    ).toBe(10);
    expect(estimate({ fps: 50 }, { durationSeconds: 12 }).breakdown.units).toBe(
      10
    );
    expect(estimate({ fps: 25 }, { durationSeconds: 12 }).breakdown.units).toBe(
      12
    );
  });

  it("lets a wire duration win over the hint", () => {
    expect(
      estimate({ duration: 3 }, { durationSeconds: 6.008 }).breakdown.units
    ).toBe(3);
  });

  it("fails closed without a duration or an audio length", () => {
    const result = estimate({});
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("could not derive units");
  });

  it.each([null, "two", 0, -2])("fails duration %j closed", (duration) => {
    const result = estimate({ duration }, { durationSeconds: 6 });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("could not derive units");
  });

  it("matches the recorded 720p 2 s bill of 21.6 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(21.6);
    expect(recording.output.durationSeconds).toBe(2);
    expect(estimate(recording.request).usd).toBeCloseTo(
      recording.creditsConsumed * CREDIT,
      12
    );
  });

  it("dates the entry to the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/ltx-2-5?model=ltx%2F2-5-fast-audio-to-video",
      asOf: "2026-11-20",
    });
  });
});
