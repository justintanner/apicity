import type { ModelPricing } from "./types";

const source = { url: "https://openai.com/api/pricing" };

export const openai: Record<string, ModelPricing> = {
  "gpt-5": { kind: "tokens", rate: { input: 1.25, output: 10 }, source },
  "gpt-5-mini": { kind: "tokens", rate: { input: 0.25, output: 2 }, source },
  "gpt-5-nano": { kind: "tokens", rate: { input: 0.05, output: 0.4 }, source },
  "gpt-4.1": { kind: "tokens", rate: { input: 2, output: 8 }, source },
  "gpt-4.1-mini": { kind: "tokens", rate: { input: 0.4, output: 1.6 }, source },
  "gpt-4.1-nano": { kind: "tokens", rate: { input: 0.1, output: 0.4 }, source },
  "gpt-4o": { kind: "tokens", rate: { input: 2.5, output: 10 }, source },
  "gpt-4o-mini": { kind: "tokens", rate: { input: 0.15, output: 0.6 }, source },
  o3: { kind: "tokens", rate: { input: 2, output: 8 }, source },
  "o4-mini": { kind: "tokens", rate: { input: 1.1, output: 4.4 }, source },
  "text-embedding-3-small": {
    kind: "tokens",
    rate: { input: 0.02, output: 0 },
    source,
  },
  "text-embedding-3-large": {
    kind: "tokens",
    rate: { input: 0.13, output: 0 },
    source,
  },
};
