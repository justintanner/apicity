import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/seedream-5-5-image-to-image-2026-11-12.json";
import textEvidence from "../fixtures/kie-pricing-evidence/seedream-5-5-text-to-image-2026-11-12.json";
import layerEvidence from "../fixtures/kie-pricing-evidence/seedream-5-5-layer-decomposition-2026-11-12.json";

// KIE bills Seedream 5.5 image-to-image per output image by size, plus every
// input image, the first included (feed and models API read 2026-11-12).
const MODEL = "seedream/5-5-image-to-image";
const CREDIT = 0.005;
const IMAGE = "https://example.com/cat.jpg";

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: MODEL, input } });

const inputRow = evidence.feed.rows.find((row) =>
  row.modelDescription.includes("input image")
)!;

describe("kie Seedream 5.5 image-to-image pricing", () => {
  it.each(
    evidence.feed.rows.filter((row) => !row.modelDescription.includes("input"))
  )("prices $modelDescription plus one input image", (row) => {
    const size = row.modelDescription.split(", ").at(-1)!;
    const result = estimate({ prompt: "x", image_urls: [IMAGE], size });
    expect(result.usd).toBeCloseTo(
      (Number(row.creditPrice) + Number(inputRow.creditPrice)) * CREDIT,
      12
    );
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-12");
  });

  it("bills every input image, the first included", () => {
    // The pricingDesc example: a 2K edit of two images is 6.3 + 2 x 1.44.
    const result = estimate({
      prompt: "x",
      image_urls: [IMAGE, IMAGE],
      size: "2K",
    });
    expect(result.usd).toBeCloseTo(9.18 * CREDIT, 12);
  });

  it("matches the docs callback receipt at the 2K default", () => {
    const [receipt] = evidence.docs[0].callbackExamples;
    expect(receipt.creditsConsumed).toBe(7.74);
    expect(estimate({ prompt: "x", image_urls: [IMAGE] }).usd).toBeCloseTo(
      receipt.creditsConsumed * CREDIT,
      12
    );
  });

  it("matches the recorded 1K bill of 5.04 credits", () => {
    const [recording] = evidence.recordings;
    const result = estimate({ ...recording.request, image_urls: [IMAGE] });
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
  });

  it("cites the feed anchor and fails closed without input images", () => {
    expect(PRICING.kie[MODEL].source).toEqual({
      url: "https://kie.ai/seedream-5-5?model=seedream%2F5-5-image-to-image",
      asOf: "2026-11-12",
    });
    const result = estimate({ prompt: "x", size: "1K" });
    expect(result.warnings.join(" ")).toContain(MODEL);
  });
});

// Text-to-image bills only the output image, by size (feed and models API
// read 2026-11-12); it takes no input image, so there is no extra.
const TEXT_MODEL = "seedream/5-5-text-to-image";

const textEstimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model: TEXT_MODEL, input } });

describe("kie Seedream 5.5 text-to-image pricing", () => {
  it.each(textEvidence.feed.rows)("prices $modelDescription", (row) => {
    const size = row.modelDescription.split(", ").at(-1)!;
    const result = textEstimate({ prompt: "x", aspect_ratio: "1:1", size });
    expect(result.usd).toBeCloseTo(Number(row.creditPrice) * CREDIT, 12);
    expect(result.usd).toBeCloseTo(Number(row.usdPrice), 12);
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-12");
  });

  it("matches the docs callback receipt at the 2K default", () => {
    const [receipt] = textEvidence.docs[0].callbackExamples;
    expect(receipt.creditsConsumed).toBe(6.3);
    expect(textEstimate({ prompt: "x", aspect_ratio: "16:9" }).usd).toBeCloseTo(
      receipt.creditsConsumed * CREDIT,
      12
    );
  });

  it("matches the recorded 1K bill of 3.6 credits", () => {
    const [recording] = textEvidence.recordings;
    expect(recording.creditsConsumed).toBe(3.6);
    const result = textEstimate(recording.request);
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
  });

  it("cites the feed anchor and prices an unknown size as unsupported", () => {
    expect(PRICING.kie[TEXT_MODEL].source).toEqual({
      url: "https://kie.ai/seedream-5-5?model=seedream%2F5-5-text-to-image",
      asOf: "2026-11-12",
    });
    const result = textEstimate({
      prompt: "x",
      aspect_ratio: "1:1",
      size: "4K",
    });
    expect(result.warnings.join(" ")).toContain(TEXT_MODEL);
  });
});

// Layer decomposition bills each returned image by size, the base included,
// plus the one input image; auto bills at the 2K rate (feed and models API
// read 2026-11-12). max_images caps the count.
const LAYER_MODEL = "seedream/5-5-layer-decomposition";

const layerEstimate = (
  input: Record<string, unknown>,
  costHints?: { outputImages?: number }
) =>
  computeEstimate({
    provider: "kie",
    payload: { model: LAYER_MODEL, input },
    ...(costHints ? { costHints } : {}),
  });

const layerInputRow = layerEvidence.feed.rows.find((row) =>
  row.modelDescription.includes("input image")
)!;

describe("kie Seedream 5.5 layer decomposition pricing", () => {
  it.each(
    layerEvidence.feed.rows.filter(
      (row) => !row.modelDescription.includes("input image")
    )
  )("prices $modelDescription per returned image plus the input", (row) => {
    const size = row.modelDescription.split(", ").at(-1)!;
    const result = layerEstimate(
      { image_url: IMAGE, size },
      { outputImages: 3 }
    );
    expect(result.usd).toBeCloseTo(
      (3 * Number(row.creditPrice) + Number(layerInputRow.creditPrice)) *
        CREDIT,
      12
    );
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-12");
  });

  it("matches the docs callback receipt: three images at auto bill at 2K", () => {
    const [receipt] = layerEvidence.docs[0].callbackExamples;
    expect(receipt.creditsConsumed).toBe(20.34);
    const result = layerEstimate(
      { image_url: IMAGE, size: "auto" },
      { outputImages: receipt.outputImages }
    );
    expect(result.usd).toBeCloseTo(receipt.creditsConsumed * CREDIT, 12);
    // auto is the default.
    expect(
      layerEstimate({ image_url: IMAGE }, { outputImages: 3 }).usd
    ).toBeCloseTo(result.usd, 12);
  });

  it("matches the recorded bill of 8.64 credits for two images at 1K", () => {
    const [recording] = layerEvidence.recordings;
    expect(recording.creditsConsumed).toBe(8.64);
    const request = { ...recording.request, image_url: IMAGE };
    const result = layerEstimate(request, {
      outputImages: recording.outputImages,
    });
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
    expect(result.warnings).toEqual([]);
  });

  it("quotes the max_images cap as an upper bound without an image count", () => {
    const capped = layerEstimate({
      image_url: IMAGE,
      size: "1K",
      max_images: 2,
    });
    expect(capped.usd).toBeCloseTo(8.64 * CREDIT, 12);
    expect(capped.warnings.join(" ")).toContain("upper bound");
    // The schema default caps the job at 30 images.
    const defaulted = layerEstimate({ image_url: IMAGE });
    expect(defaulted.usd).toBeCloseTo((1.44 + 30 * 6.3) * CREDIT, 12);
    expect(defaulted.warnings.join(" ")).toContain("max_images (30)");
  });

  it("fails closed on a count above the cap, a cap out of range, or no image", () => {
    for (const [input, hints] of [
      [{ image_url: IMAGE, max_images: 2 }, { outputImages: 3 }],
      [{ image_url: IMAGE, max_images: 101 }, undefined],
      [{ image_url: IMAGE }, { outputImages: 0 }],
      [{ size: "1K" }, { outputImages: 2 }],
    ] as const) {
      const result = layerEstimate(input, hints);
      expect(result.warnings.join(" "), JSON.stringify(input)).toContain(
        LAYER_MODEL
      );
    }
  });

  it("cites the layer-decomposition feed anchor", () => {
    expect(PRICING.kie[LAYER_MODEL].source).toEqual({
      url: "https://kie.ai/seedream-5-5?model=seedream%2F5-5-layer-decomposition",
      asOf: "2026-11-12",
    });
  });
});
