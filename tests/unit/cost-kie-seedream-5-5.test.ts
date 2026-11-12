import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/seedream-5-5-image-to-image-2026-11-12.json";

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
