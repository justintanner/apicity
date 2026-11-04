import type { ModelPricing } from "./types";

const source = {
  url: "https://platform.kimi.ai/docs/pricing/chat",
  asOf: "2026-11-04",
};
const legacySource = {
  url: "https://platform.moonshot.ai",
  asOf: "2026-04-30",
};

export const kimicoding: Record<string, ModelPricing> = {
  "kimi-k3.1-pro": {
    kind: "tokens",
    rate: { input: 2.0, output: 10.0, cacheRead: 0.2, cacheWrite: 2.0 },
    source,
  },
  "kimi-k3.1-pro-highspeed": {
    kind: "tokens",
    rate: { input: 4.0, output: 20.0, cacheRead: 0.2, cacheWrite: 4.0 },
    source,
  },
  "kimi-k3": {
    kind: "tokens",
    rate: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.0 },
    source,
  },
  "kimi-k2.7-code": {
    kind: "tokens",
    rate: { input: 0.95, output: 4.0, cacheRead: 0.19 },
    source,
  },
  "kimi-k2.7-code-highspeed": {
    kind: "tokens",
    rate: { input: 1.9, output: 8.0, cacheRead: 0.38 },
    source,
  },
  "kimi-k2.6": {
    kind: "tokens",
    rate: { input: 0.95, output: 4, cacheRead: 0.16 },
    source,
  },
  "kimi-k2.5": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.5 },
    source: legacySource,
  },
  "kimi-k2": {
    kind: "tokens",
    rate: { input: 0.55, output: 2.2 },
    source: legacySource,
  },
};
