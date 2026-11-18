import { asObject, asString } from "./helpers";
import type { ModelPricing } from "./types";

export const nunchux: Record<string, ModelPricing> = {
  // /pricing and /v1/pricing quote 0.03024 / 0.04536 / 0.1017 USD
  // after Google's standard 10% discount. The table stores list USD.
  "gemini-nano-banana-2.1": {
    kind: "perUnit",
    unit: "images",
    units: () => 1,
    select: [
      {
        name: "image_size",
        required: true,
        pick: (p) => {
          const size = asObject(p.response_format)?.image_size;
          return size === undefined ? "4K" : asString(size);
        },
      },
    ],
    rates: { "1K": 0.0336, "2K": 0.0504, "4K": 0.113 },
    source: { url: "https://nunchux.ai/pricing", asOf: "2026-11-18" },
  },
};
