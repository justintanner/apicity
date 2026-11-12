import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import type { CostHints } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/kie-image-upscale-2026-11-12.json";

// KIE bills Kie Image Upscale once per task by its total OUTPUT pixels (feed
// and models API read 2026-11-12): 1.5 credits up to 4.19 MP (2K), 4 up to
// 16.78 MP (4K) and 12 up to 67.11 MP (8K). The output is the input's width x
// height times upscale_factor squared, and the request carries only the image
// URL, so the caller declares the input size as costHints.
const MODEL = "kie/image-upscale";
const CREDIT = 0.005;
const IMAGE = "https://example.com/cat.jpg";

const estimate = (input: Record<string, unknown>, costHints?: CostHints) =>
  computeEstimate({
    provider: "kie",
    payload: { model: MODEL, input },
    ...(costHints ? { costHints } : {}),
  });

const size = (inputWidth: number, inputHeight: number): CostHints => ({
  inputWidth,
  inputHeight,
});

describe("kie Kie Image Upscale pricing", () => {
  // "Kie Image Upscale, image-upscale, 2K (≤4.19 MP)" names one tier. The docs
  // table reaches each tier edge from a 1024 x 1024 input at factor 2, 4, 8.
  const factorOf = { "2K": "2", "4K": "4", "8K": "8" } as const;
  const tierOf = (description: string) =>
    description.split(", ").at(-1)!.split(" ")[0] as keyof typeof factorOf;

  it("has a feed row for every tier", () => {
    expect(
      evidence.feed.rows.map((row) => tierOf(row.modelDescription))
    ).toEqual(["2K", "4K", "8K"]);
  });

  it.each(evidence.feed.rows)("prices $modelDescription", (row) => {
    const result = estimate(
      {
        image_url: IMAGE,
        upscale_factor: factorOf[tierOf(row.modelDescription)],
      },
      size(1024, 1024)
    );
    expect(result.usd).toBeCloseTo(Number(row.creditPrice) * CREDIT, 12);
    expect(result.usd).toBeCloseTo(Number(row.usdPrice), 12);
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-12");
    expect(result.breakdown).toMatchObject({ units: 1, unit: "images" });
  });

  it("matches the recorded 2K bill of 1.5 credits", () => {
    const [recording] = evidence.recordings;
    expect(recording.creditsConsumed).toBe(1.5);
    // cat1.jpg is 768 x 1024: 1536 x 2048 at factor 2, as recorded.
    expect(recording.output).toMatchObject({ width: 1536, height: 2048 });
    const result = estimate(
      { image_url: IMAGE, upscale_factor: recording.request.upscale_factor },
      recording.costHints
    );
    expect(result.usd).toBeCloseTo(recording.creditsConsumed * CREDIT, 12);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    // The tier edges are the docs table's outputs: 2048, 4096, 8192 squared.
    [1024, 1024, "2", 1.5],
    [1024, 1025, "2", 4],
    [2048, 2048, "2", 4],
    [2048, 2049, "2", 12],
    [4096, 4096, "2", 12],
    // Factor "1" keeps the size, so the input's own pixels set the tier.
    [1024, 1024, "1", 1.5],
    [4000, 3000, "1", 4],
    [8192, 8192, "1", 12],
    // A wide output at the 16,384 px side limit: 16384 x 1024 is the 4K edge.
    [2048, 128, "8", 4],
  ] as const)(
    "bills a %i x %i input at factor %s as %f credits",
    (width, height, upscale_factor, credits) => {
      const result = estimate(
        { image_url: IMAGE, upscale_factor },
        size(width, height)
      );
      expect(result.usd).toBeCloseTo(credits * CREDIT, 12);
      expect(result.warnings).toEqual([]);
    }
  );

  it('prices the default factor, "2", when the request omits it', () => {
    expect(estimate({ image_url: IMAGE }, size(768, 1024)).usd).toBeCloseTo(
      1.5 * CREDIT,
      12
    );
    expect(estimate({ image_url: IMAGE }, size(2048, 2048)).usd).toBeCloseTo(
      4 * CREDIT,
      12
    );
  });

  it("quotes the 8K tier, an upper bound, and warns without a declared size", () => {
    const result = estimate({ image_url: IMAGE, upscale_factor: "1" });
    expect(result.usd).toBeCloseTo(12 * CREDIT, 12);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain(
      "without costHints.inputWidth and costHints.inputHeight this estimate quotes the 8K tier, an upper bound"
    );
  });

  it.each([
    // The docs' own 422 example: 1646 x 1646 at factor 8 is 173 MP.
    [{ upscale_factor: "8" }, size(1646, 1646), "67,108,864 pixels"],
    // 2049 x 8 = 16,392 px on one side, though only 6.7 MP in all.
    [{ upscale_factor: "8" }, size(2049, 50), "16,384 px per side"],
    [{ upscale_factor: "1" }, size(8193, 8192), "67,108,864 pixels"],
  ] as const)(
    "fails closed on a size KIE rejects with 422 (%j, %j)",
    (fields, hints, limit) => {
      const result = estimate({ image_url: IMAGE, ...fields }, hints);
      expect(result.usd).toBe(0);
      expect(result.breakdown).toEqual({});
      expect(result.warnings.join(" ")).toContain(limit);
      expect(result.warnings.join(" ")).toContain("422 and no charge");
    }
  );

  it.each([
    [{ inputWidth: 1024 }],
    [{ inputHeight: 1024 }],
    [{ inputWidth: 0, inputHeight: 1024 }],
    [{ inputWidth: -1024, inputHeight: 1024 }],
    [{ inputWidth: 1024.5, inputHeight: 1024 }],
    [{ inputWidth: Number.NaN, inputHeight: 1024 }],
    [{ inputWidth: "1024", inputHeight: 1024 } as unknown as CostHints],
  ])("fails closed on an unusable declared size %j", (hints) => {
    const result = estimate({ image_url: IMAGE, upscale_factor: "2" }, hints);
    expect(result.usd).toBe(0);
    expect(result.warnings).toEqual([
      "kie 'kie/image-upscale': costHints.inputWidth and costHints.inputHeight must both be positive integers.",
    ]);
  });

  it.each(["3", "16", 2, null])(
    "fails closed on the factor %j, which the schema rejects",
    (upscale_factor) => {
      const result = estimate(
        { image_url: IMAGE, upscale_factor },
        size(1024, 1024)
      );
      expect(result.usd).toBe(0);
      expect(result.warnings).toEqual([
        'kie \'kie/image-upscale\': upscale_factor must be the string "1", "2", "4" or "8".',
      ]);
    }
  );

  it("cites the feed anchor, read on 2026-11-12", () => {
    expect(PRICING.kie[MODEL]).toMatchObject({
      kind: "perUnit",
      unit: "images",
      rates: { "2K": 0.0075, "4K": 0.02, "8K": 0.06 },
      source: { url: "https://kie.ai/image-upscaler", asOf: "2026-11-12" },
    });
    for (const row of evidence.feed.rows) {
      expect(row.anchor).toBe("https://kie.ai/image-upscaler");
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
