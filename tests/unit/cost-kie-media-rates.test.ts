import { describe, expect, it } from "vitest";
import { computeEstimate, classifyEstimate } from "@apicity/cost";
import evidence from "../fixtures/kie-pricing-evidence/wan-2-6-flash-2026-11-04.json";

const estimate = (model: string, input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model, input } });

describe("KIE Wan 2.6 Flash current feed", () => {
  it.each(evidence.rows)(
    "prices $modelDescription at published credits",
    (row) => {
      const model = new URL(row.anchor).searchParams.get("model")!;
      const duration = String(
        Number(row.modelDescription.match(/([\d.]+)s/)![1])
      );
      const resolution = row.modelDescription.match(/(720p|1080p)/)![1];
      const audio = row.modelDescription.includes("with audio");
      const result = estimate(model, { duration, resolution, audio });
      expect(result.usd).toBeCloseTo(Number(row.creditPrice) * 0.005, 12);
      expect(result.warnings).toEqual([]);
      expect(result.breakdown.units).toBe(1);
      expect(result.rateAsOf).toBe("2026-11-04");
    }
  );

  it.each(["wan/2-6-flash-image-to-video", "wan/2-6-flash-video-to-video"])(
    "preserves documented defaults but requires audio for %s",
    (model) => {
      expect(estimate(model, { audio: false }).usd).toBe(0.15);
      expect(estimate(model, { audio: true }).usd).toBe(0.3);
      for (const audio of [undefined, null, "true", 1]) {
        expect(classifyEstimate(estimate(model, { audio }))).toBe(
          "prohibitive"
        );
      }
      for (const input of [
        { audio: false, duration: "30" },
        { audio: true, resolution: "4k" },
      ]) {
        expect(classifyEstimate(estimate(model, input))).toBe("prohibitive");
      }
    }
  );

  it("limits video-to-video to its published ten-second maximum", () => {
    const input = { audio: true, duration: "15", resolution: "1080p" };
    expect(estimate("wan/2-6-flash-image-to-video", input).usd).toBe(0.9);
    expect(
      classifyEstimate(estimate("wan/2-6-flash-video-to-video", input))
    ).toBe("prohibitive");
  });
});
