import { describe, expect, it } from "vitest";
import { SeedreamProLayerDecompositionRequestSchema } from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";

const model = "seedream/5-pro-layer-decomposition" as const;
const image_url = "https://example.com/source.png";
const schema = SeedreamProLayerDecompositionRequestSchema;

describe("Seedream 5 Pro layer decomposition billing", () => {
  it.each([
    ["1K", 0.035],
    ["1.5K", 0.035],
    ["2K", 0.07],
  ] as const)("prices published size %s per returned image", (size, usd) => {
    const payload = { model, input: { image_url, size } };
    expect(schema.safeParse(payload).success).toBe(true);
    const estimate = computeEstimate({
      provider: "kie",
      payload,
      costHints: { outputImages: 1 },
    });
    expect(estimate.usd).toBe(usd);
    expect(estimate.warnings).toEqual([]);
  });

  it("does not invent a published price for auto", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input: { image_url } },
      costHints: { outputImages: 1 },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it("prices two returned 1K images at twice the published cell", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input: { image_url, size: "1K" } },
      costHints: { outputImages: 2 },
    });
    expect(estimate.usd).toBe(0.07);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([undefined, 0, -1, 1.5, NaN, Infinity])(
    "requires a valid output-image count: %s",
    (outputImages) => {
      const estimate = computeEstimate({
        provider: "kie",
        payload: { model, input: { image_url, size: "1K" } },
        costHints: { outputImages },
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toContain("outputImages");
    }
  );
});
