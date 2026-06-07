import type { ModelPricing } from "./types";

const source = { url: "https://docs.x.ai" };
const grokBuild01Source = {
  url: "https://docs.x.ai/developers/models/grok-build-0.1",
  asOf: "2026-06-07",
};

const grokBuild01: ModelPricing = {
  kind: "tokens",
  rate: { input: 1, output: 2, cacheRead: 0.2 },
  source: grokBuild01Source,
};

export const xai: Record<string, ModelPricing> = {
  "grok-build-0.1": grokBuild01,
  "grok-code-fast-1": grokBuild01,
  "grok-code-fast": grokBuild01,
  "grok-code-fast-1-0825": grokBuild01,
  "grok-4": { kind: "tokens", rate: { input: 3, output: 15 }, source },
  "grok-3": { kind: "tokens", rate: { input: 3, output: 15 }, source },
  "grok-4-fast": { kind: "tokens", rate: { input: 0.2, output: 0.5 }, source },
  "grok-4-1-fast": {
    kind: "tokens",
    rate: { input: 0.2, output: 0.5 },
    source,
  },
};
