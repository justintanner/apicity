import type { ModelPricing } from "./types";

const source = { url: "https://platform.moonshot.ai" };

export const kimicoding: Record<string, ModelPricing> = {
  "kimi-k2.6": {
    kind: "tokens",
    rate: { input: 0.95, output: 4, cacheRead: 0.16 },
    source,
  },
  "kimi-k2.5": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.5 },
    source,
  },
  "kimi-k2": { kind: "tokens", rate: { input: 0.55, output: 2.2 }, source },
};
