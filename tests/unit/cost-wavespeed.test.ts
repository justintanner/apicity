import { describe, expect, it } from "vitest";

import { computeEstimate } from "@apicity/cost";
import type { CostHints } from "@apicity/cost";

const estimate = (
  endpoint: string,
  payload: Record<string, unknown>,
  costHints?: CostHints
) => computeEstimate({ provider: "wavespeed", endpoint, payload, costHints });

const PROMPT = "A red paper boat drifts across a calm pond at sunrise.";

describe("wavespeed alibaba/wan-3.0/text-to-video", () => {
  const model = "alibaba/wan-3.0/text-to-video";

  it("prices the recorded payload at the 0.10 USD list quote", () => {
    const result = estimate(model, {
      prompt: PROMPT,
      resolution: "480p",
      duration: 2,
      generate_audio: false,
    });

    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeCloseTo(0.1, 9);
  });

  it("bills 1080p at twice the 720p rate, up to 30 s", () => {
    expect(
      estimate(model, { prompt: PROMPT, resolution: "1080p", duration: 30 }).usd
    ).toBeCloseTo(6, 9);
  });

  it("bills the 2 s floor at the 720p default", () => {
    expect(estimate(model, { prompt: PROMPT, duration: 1 }).usd).toBeCloseTo(
      0.2,
      9
    );
  });

  it("fails closed on a duration that is not a number", () => {
    const result = estimate(model, { prompt: PROMPT, duration: "5" });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
  });
});
