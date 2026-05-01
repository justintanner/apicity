import type { ModelPricing } from "./types";

const source = {
  url: "https://www.alibabacloud.com/help/en/model-studio/model-pricing",
};

export const alibaba: Record<string, ModelPricing> = {
  "qwen3.6-plus": {
    kind: "tokens",
    rate: { input: 0.325, output: 1.95 },
    source,
  },
  "qwen3.5-0.8b": {
    kind: "tokens",
    rate: { input: 0.01, output: 0.04 },
    source,
  },
};
