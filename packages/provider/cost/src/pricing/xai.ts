import type { ModelPricing } from "./types";

const source = { url: "https://docs.x.ai" };

export const xai: Record<string, ModelPricing> = {
  "grok-4": { kind: "tokens", rate: { input: 3, output: 15 }, source },
  "grok-3": { kind: "tokens", rate: { input: 3, output: 15 }, source },
  "grok-4-fast": { kind: "tokens", rate: { input: 0.2, output: 0.5 }, source },
  "grok-4-1-fast": {
    kind: "tokens",
    rate: { input: 0.2, output: 0.5 },
    source,
  },
};
