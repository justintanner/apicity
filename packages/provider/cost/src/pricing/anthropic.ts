import type { ModelPricing } from "./types";

const source = {
  url: "https://platform.claude.com/docs/en/about-claude/pricing",
};

export const anthropic: Record<string, ModelPricing> = {
  "claude-opus-4-7": {
    kind: "tokens",
    rate: { input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25 },
    source,
  },
  "claude-opus-4-6": {
    kind: "tokens",
    rate: { input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25 },
    source,
  },
  "claude-opus-4-5": {
    kind: "tokens",
    rate: { input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25 },
    source,
  },
  "claude-opus-4-1": {
    kind: "tokens",
    rate: { input: 15, output: 75, cacheRead: 1.5, cacheWrite5m: 18.75 },
    source,
  },
  "claude-opus-4": {
    kind: "tokens",
    rate: { input: 15, output: 75, cacheRead: 1.5, cacheWrite5m: 18.75 },
    source,
  },
  "claude-sonnet-4-6": {
    kind: "tokens",
    rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75 },
    source,
  },
  "claude-sonnet-4-5": {
    kind: "tokens",
    rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75 },
    source,
  },
  "claude-sonnet-4": {
    kind: "tokens",
    rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75 },
    source,
  },
  "claude-haiku-4-5": {
    kind: "tokens",
    rate: { input: 1, output: 5, cacheRead: 0.1, cacheWrite5m: 1.25 },
    source,
  },
  "claude-haiku-3-5": {
    kind: "tokens",
    rate: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite5m: 1 },
    source,
  },
};
