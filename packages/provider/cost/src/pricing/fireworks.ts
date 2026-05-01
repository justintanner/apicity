import type { ModelPricing } from "./types";

const source = { url: "https://fireworks.ai/pricing" };

export const fireworks: Record<string, ModelPricing> = {
  "deepseek-v4-pro": {
    kind: "tokens",
    rate: { input: 1.74, output: 3.48 },
    source,
  },
  "deepseek-v3": {
    kind: "tokens",
    rate: { input: 0.56, output: 1.68 },
    source,
  },
  "glm-5": { kind: "tokens", rate: { input: 1, output: 3.2 }, source },
  "glm-5.1": { kind: "tokens", rate: { input: 1.4, output: 4.4 }, source },
  "kimi-k2.6": { kind: "tokens", rate: { input: 0.95, output: 4 }, source },
  "qwen3-vl-30b": {
    kind: "tokens",
    rate: { input: 0.15, output: 0.6 },
    source,
  },
};
