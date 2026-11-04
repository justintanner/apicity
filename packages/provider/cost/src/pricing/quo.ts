import type { ModelPricing } from "./types";

// Follow Quo's published 160/70-character rule. Smart encoding can reduce
// the billed segments; the API response does not report that count.
export const quo: Record<string, ModelPricing> = {
  messages: {
    kind: "perUnit",
    unit: "segments",
    units: (payload) => {
      if (typeof payload.content !== "string" || !payload.content.length)
        return undefined;
      const limit = /^[\x20-\x7e\r\n]*$/.test(payload.content) ? 160 : 70;
      return Math.ceil(payload.content.length / limit);
    },
    select: [],
    rates: { "": 0.01 },
    warn: (payload) => {
      const warnings: string[] = [];
      if (
        !Array.isArray(payload.to) ||
        payload.to.length !== 1 ||
        typeof payload.to[0] !== "string" ||
        !/^\+1\d{10}$/.test(payload.to[0])
      )
        warnings.push(
          "quo: US/Canada base rate only; international or group destinations require additional country-specific pricing"
        );
      if (
        typeof payload.content === "string" &&
        /[^\x20-\x7e\r\n]/.test(payload.content)
      )
        warnings.push(
          "quo: non-GSM text splits at 70 characters; smart encoding may change the billed segment count"
        );
      return warnings;
    },
    source: {
      url: "https://www.quo.com/docs/mdx/pricing-support/pricing-overview",
      asOf: "2026-11-04",
    },
  },
};
