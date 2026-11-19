import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/gpt-image-2-6-economy-text-to-image-2026-11-19.json";
import editEvidence from "../fixtures/kie-pricing-evidence/gpt-image-2-6-economy-image-to-image-2026-11-19.json";

// kie's economy channel bills GPT Image 2.6 a flat 5 credits (0.025 USD) per
// 1K image, its only size (feed and models API read 2026-11-12 and
// 2026-11-19). No page prices a gif, so only png output is quoted.
const MODEL = "gpt-image-2-6/economy-text-to-image";
const CREDIT = 0.005;

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

const pngInput = {
  prompt: "A red balloon.",
  aspect_ratio: "auto",
  background: "auto",
  output_format: "png",
  frame_count: "auto",
  frame_duration_ms: "auto",
};

describe("kie GPT Image 2.6 economy text-to-image pricing", () => {
  it("has one 1K feed row, matching the models API pricingDesc", () => {
    expect(evidence.feed.rows).toHaveLength(1);
    const [row] = evidence.feed.rows;
    expect(row.modelDescription).toBe(
      "gpt-image-2-6-economy, text-to-image, 1K"
    );
    expect(row.creditUnit).toBe("per image");
    expect(evidence.models_api.entry.pricingDesc).toContain(
      `${row.creditPrice} credits ($${row.usdPrice}) per 1K image`
    );
  });

  it("prices the feed row for a png image", () => {
    const [row] = evidence.feed.rows;
    const result = estimate(pngInput);
    expect(result.usd).toBeCloseTo(Number(row.creditPrice) * CREDIT, 12);
    expect(result.usd).toBeCloseTo(Number(row.usdPrice), 12);
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-19");
    expect(result.breakdown).toMatchObject({ units: 1, unit: "images" });
  });

  it("has both recorded bodies: every default, and aspect_ratio alone", () => {
    expect(evidence.recordings.map((r) => Object.keys(r.request))).toEqual([
      [
        "prompt",
        "aspect_ratio",
        "background",
        "output_format",
        "frame_count",
        "frame_duration_ms",
      ],
      ["prompt", "aspect_ratio"],
    ]);
  });

  it.each(evidence.recordings)(
    "matches the recorded bill of 5 credits for task $taskId",
    (recording) => {
      expect(recording.creditsConsumed).toBe(5);
      const result = estimate(recording.request);
      expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
      expect(result.usd).toBeCloseTo(recording.usd, 12);
      expect(result.warnings).toEqual([]);
    }
  );

  it("is not the docs callback example's template figure", () => {
    const [example] = evidence.docs[0].callbackExamples;
    expect(example.creditsConsumed).toBe(3);
    expect(estimate(pngInput).usd).not.toBeCloseTo(
      example.creditsConsumed * CREDIT,
      12
    );
  });

  it.each([
    ["gif", { output_format: "gif", frame_count: "9" }],
    ["jpeg", { output_format: "jpeg" }],
  ])("quotes nothing for %s output and says why", (_, fields) => {
    const result = estimate({ ...pngInput, ...fields });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(MODEL);
    expect(result.warnings.join(" ")).toContain("png output only");
  });

  it("cites the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: evidence.source,
      asOf: "2026-11-19",
    });
    expect(evidence.feed.rows[0].anchor).toBe(evidence.source);
  });
});

// Image-to-image bills the same flat 5 credits per 1K image, with no charge
// per input image (feed and models API read 2026-11-19). png is its only
// output format.
const EDIT_MODEL = "gpt-image-2-6/economy-image-to-image";
const IMAGE = "https://example.com/cat.jpg";

const editEstimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: EDIT_MODEL, input } });

describe("kie GPT Image 2.6 economy image-to-image pricing", () => {
  it("has one 1K feed row, matching the models API pricingDesc", () => {
    expect(editEvidence.feed.rows).toHaveLength(1);
    const [row] = editEvidence.feed.rows;
    expect(row.modelDescription).toBe(
      "gpt-image-2-6-economy, image-to-image, 1K"
    );
    expect(row.creditUnit).toBe("per image");
    expect(editEvidence.models_api.entry.pricingDesc).toContain(
      `${row.creditPrice} credits ($${row.usdPrice}) per 1K image`
    );
  });

  it("prices the feed row whatever the input image count", () => {
    const [row] = editEvidence.feed.rows;
    for (const count of [0, 1, 16]) {
      const result = editEstimate({
        prompt: "x",
        aspect_ratio: "auto",
        input_urls: Array(count).fill(IMAGE),
      });
      expect(result.usd, String(count)).toBeCloseTo(Number(row.usdPrice), 12);
      expect(result.usd, String(count)).toBeCloseTo(
        Number(row.creditPrice) * CREDIT,
        12
      );
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe("2026-11-19");
    }
  });

  it("matches the recorded bill of 5 credits", () => {
    const [recording] = editEvidence.recordings;
    expect(recording.creditsConsumed).toBe(5);
    const result = editEstimate({ ...recording.request, input_urls: [IMAGE] });
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
    expect(result.breakdown).toMatchObject({ units: 1, unit: "images" });
  });

  it("quotes nothing for a format other than png and says why", () => {
    const result = editEstimate({
      prompt: "x",
      aspect_ratio: "auto",
      output_format: "gif",
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(EDIT_MODEL);
  });

  it("cites the feed anchor", () => {
    expect(PRICING.kie[EDIT_MODEL].source).toEqual({
      url: editEvidence.source,
      asOf: "2026-11-19",
    });
    expect(editEvidence.feed.rows[0].anchor).toBe(editEvidence.source);
  });
});
