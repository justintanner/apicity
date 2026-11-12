import { describe, expect, it } from "vitest";
import { PRICING } from "../../packages/provider/cost/src";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

// kie bills GPT Image 2.6 by tokens at five published rates (feed read
// 2026-11-12): text input 4.50, cached text input 1.125, image input 7.20,
// cached image input 1.80 and image output 27.00 USD per 1M. No payload shows
// the generated image's tokens, so the row is priced from declared modality
// usage only, the way OpenAI's per-modality image rows are.
const MODEL = "gpt-image-2-6/sunburst-text-to-image";
const payload = (input: Record<string, unknown> = {}) => ({
  model: MODEL,
  input: { prompt: "A red balloon.", ...input },
});
const usage = {
  inputTokens: 20,
  cacheReadInputTokens: 0,
  imageInputTokens: 0,
  cacheReadImageInputTokens: 0,
  outputTokens: 800,
  imageOutputTokens: 800,
};

describe("kie GPT Image 2.6 token pricing", () => {
  it("carries kie's five feed rates, with no text output rate", () => {
    expect(PRICING.kie[MODEL]).toMatchObject({
      kind: "tokens",
      rate: { input: 4.5, output: 0, cacheRead: 1.125 },
      modalityRates: { image: { input: 7.2, output: 27, cacheRead: 1.8 } },
      source: {
        url: "https://kie.ai/gpt-image-2-6?model=gpt-image-2-6%2Fsunburst-text-to-image",
        asOf: "2026-11-12",
      },
    });
  });

  it("quotes nothing without declared usage", () => {
    const estimate = computeEstimate({ provider: "kie", payload: payload() });
    expect(estimate.usd).toBe(0);
    expect(estimate.source).toBe("declared-tokens+table");
    expect(estimate.warnings.join(" ")).toContain("per-modality rates");
    expect(estimate.warnings.join(" ")).toContain(
      "costHints.imageOutputTokens"
    );
  });

  it("prices declared text and image tokens at their own rates", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: payload(),
      costHints: usage,
    });
    // 20 text input tokens at 4.50 plus 800 image output tokens at 27.00.
    expect(estimate.usd).toBeCloseTo((20 * 4.5 + 800 * 27) / 1e6, 12);
    expect(estimate.warnings).toEqual([]);
    expect(estimate.breakdown.modalities?.image).toMatchObject({
      inputTokens: 0,
      outputTokens: 800,
      outputUsdPerMillion: 27,
    });

    const cached = computeEstimate({
      provider: "kie",
      payload: payload(),
      costHints: {
        ...usage,
        inputTokens: 1020,
        imageInputTokens: 1000,
        cacheReadInputTokens: 400,
        cacheReadImageInputTokens: 400,
      },
    });
    // 20 text tokens at 4.50, 600 uncached image input at 7.20, 400 cached
    // image input at 1.80, 800 image output at 27.00.
    expect(cached.usd).toBeCloseTo(
      (20 * 4.5 + 600 * 7.2 + 400 * 1.8 + 800 * 27) / 1e6,
      12
    );
  });

  it("warns that SVG output also bills the author model's tokens", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: payload({ output_format: "svg" }),
      costHints: usage,
    });
    expect(estimate.usd).toBeGreaterThan(0);
    expect(estimate.warnings).toEqual([
      "kie: SVG output also bills the svg.model author's input and output tokens, which this estimate does not include",
    ]);
  });
});
