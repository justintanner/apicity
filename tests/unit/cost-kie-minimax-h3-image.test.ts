import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/minimax-h3-text-to-image-2026-11-12.json";
import editEvidence from "../fixtures/kie-pricing-evidence/minimax-h3-image-edit-2026-11-12.json";

// KIE bills MiniMax H3 Image per output image by its total pixels (feed and
// models API read 2026-11-12): 1.8 credits up to 4.5 MP, which covers the 1K
// and 2K tiers, and 5.5 credits up to 20 MP (4K). A custom width x height
// takes its tier from its pixel count.
const MODEL = "minimax-h3/text-to-image";
const CREDIT = 0.005;

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

// "MiniMax H3 Image, text to image, 1K / 2K (≤4.5 MP)" names two tiers.
const rowTiers = (description: string): string[] =>
  description
    .split(", ")
    .at(-1)!
    .replace(/\s*\(.*\)$/, "")
    .split(" / ");

describe("kie MiniMax H3 Image text-to-image pricing", () => {
  it("has a feed row for every tier", () => {
    expect(
      evidence.feed.rows.flatMap((row) => rowTiers(row.modelDescription)).sort()
    ).toEqual(["1K", "2K", "4K"]);
  });

  it.each(evidence.feed.rows)("prices $modelDescription", (row) => {
    for (const resolution of rowTiers(row.modelDescription)) {
      const result = estimate({ prompt: "x", resolution });
      expect(result.usd, resolution).toBeCloseTo(
        Number(row.creditPrice) * CREDIT,
        12
      );
      expect(result.usd, resolution).toBeCloseTo(Number(row.usdPrice), 12);
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe("2026-11-12");
    }
  });

  it("prices the 2K default when neither a tier nor a custom size is sent", () => {
    expect(estimate({ prompt: "x" }).usd).toBeCloseTo(1.8 * CREDIT, 12);
  });

  it("matches the recorded 1K bill of 1.8 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(1.8);
    const result = estimate(recording.request);
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
    expect(result.breakdown).toMatchObject({ units: 1, unit: "images" });
  });

  it.each([
    // The docs' own examples: 1920 x 1080 -> 2K, 3840 x 2160 -> 4K.
    [1920, 1080, 1.8],
    [3840, 2160, 5.5],
    // The tier edges: up to 1,200,000 pixels is 1K, up to 4,500,000 is 2K.
    [1200, 1000, 1.8],
    [2250, 2000, 1.8],
    [2251, 2000, 5.5],
    // The pixel bounds KIE accepts.
    [1024, 640, 1.8],
    [5000, 4000, 5.5],
  ])("prices a custom %i x %i by its pixels", (width, height, credits) => {
    const result = estimate({ prompt: "x", width, height });
    expect(result.usd).toBeCloseTo(credits * CREDIT, 12);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    [{ width: 1920 }],
    [{ height: 1080 }],
    [{ width: 1920, height: 1080, resolution: "4K" }],
    [{ width: 1920, height: 1080, aspect_ratio: "16:9" }],
    [{ width: 800, height: 800 }],
    [{ width: 5000, height: 4001 }],
    [{ width: 3001, height: 1000 }],
    [{ width: "1920", height: 1080 }],
    [{ resolution: "8K" }],
  ])("quotes nothing for a size KIE rejects: %j", (size) => {
    const result = estimate({ prompt: "x", ...size });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(MODEL);
  });

  it("cites the feed anchor", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/minimax-h3-image?model=minimax-h3%2Ftext-to-image",
      asOf: "2026-11-12",
    });
  });
});

// Image edit bills the output image as text-to-image does, plus 0.5 credits
// for every reference image, the first included (feed and models API read
// 2026-11-12).
const EDIT_MODEL = "minimax-h3/image-edit";
const IMAGE = "https://example.com/cat.jpg";

const editEstimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: EDIT_MODEL, input } });

const referenceRow = editEvidence.feed.rows.find((row) =>
  row.modelDescription.includes("reference image")
)!;
const editTierRows = editEvidence.feed.rows.filter(
  (row) => row !== referenceRow
);

describe("kie MiniMax H3 Image edit pricing", () => {
  it("has a reference-image row and a feed row for every tier", () => {
    expect(referenceRow.creditPrice).toBe("0.5");
    expect(
      editTierRows.flatMap((row) => rowTiers(row.modelDescription)).sort()
    ).toEqual(["1K", "2K", "4K"]);
  });

  it.each(editTierRows)(
    "prices $modelDescription plus one reference image",
    (row) => {
      for (const resolution of rowTiers(row.modelDescription)) {
        const result = editEstimate({
          prompt: "x",
          image_urls: [IMAGE],
          resolution,
        });
        expect(result.usd, resolution).toBeCloseTo(
          (Number(row.creditPrice) + Number(referenceRow.creditPrice)) * CREDIT,
          12
        );
        expect(result.warnings).toEqual([]);
        expect(result.rateAsOf).toBe("2026-11-12");
      }
    }
  );

  it("bills every reference image, the first included", () => {
    for (const count of [1, 2, 16]) {
      const result = editEstimate({
        prompt: "x",
        image_urls: Array(count).fill(IMAGE),
      });
      expect(result.usd, String(count)).toBeCloseTo(
        (1.8 + 0.5 * count) * CREDIT,
        12
      );
    }
  });

  it("matches the recorded 1K edit bill of 2.3 credits", () => {
    const [recording] = editEvidence.recordings;
    expect(recording.creditsConsumed).toBe(2.3);
    const result = editEstimate(recording.request);
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
    expect(result.breakdown).toMatchObject({
      units: 1,
      perUnitUsd: 0.009,
      extraUsd: 0.0025,
    });
  });

  it("prices a custom size by its pixels, plus the references", () => {
    const result = editEstimate({
      prompt: "x",
      image_urls: [IMAGE],
      width: 3840,
      height: 2160,
    });
    expect(result.usd).toBeCloseTo((5.5 + 0.5) * CREDIT, 12);
  });

  it.each([
    [{}],
    [{ image_urls: [] }],
    [{ image_urls: Array(17).fill(IMAGE) }],
    [{ image_urls: [42] }],
    [{ image_urls: [IMAGE], width: 1920 }],
  ])("quotes nothing for a request KIE rejects: %j", (fields) => {
    const result = editEstimate({ prompt: "x", ...fields });
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain(EDIT_MODEL);
  });

  it("cites the feed anchor", () => {
    expect(PRICING.kie[EDIT_MODEL].source).toEqual({
      url: "https://kie.ai/minimax-h3-image?model=minimax-h3%2Fimage-edit",
      asOf: "2026-11-12",
    });
  });
});
