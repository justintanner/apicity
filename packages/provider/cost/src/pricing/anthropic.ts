import type { ModelPricing } from "./types";

const source = {
  url: "https://platform.claude.com/docs/en/about-claude/pricing",
  asOf: "2026-11-04",
};

export const anthropic: Record<string, ModelPricing> = {
  "claude-fable-5-1": {
    kind: "tokens",
    rate: {
      input: 10,
      output: 50,
      cacheRead: 0.25,
      cacheWrite5m: 12.5,
      cacheWrite1h: 20,
    },
    source,
  },
  "claude-mythos-5-1": {
    kind: "tokens",
    rate: {
      input: 10,
      output: 50,
      cacheRead: 0.25,
      cacheWrite5m: 12.5,
      cacheWrite1h: 20,
    },
    source,
  },
  "claude-fable-5": {
    kind: "tokens",
    rate: {
      input: 10,
      output: 50,
      cacheRead: 1,
      cacheWrite5m: 12.5,
      cacheWrite1h: 20,
    },
    source,
  },
  "claude-mythos-5": {
    kind: "tokens",
    rate: {
      input: 10,
      output: 50,
      cacheRead: 1,
      cacheWrite5m: 12.5,
      cacheWrite1h: 20,
    },
    source,
  },
  "claude-opus-5-5": {
    kind: "tokens",
    rate: {
      input: 4,
      output: 20,
      cacheRead: 0.2,
      cacheWrite5m: 5,
      cacheWrite1h: 8,
    },
    source,
  },
  "claude-opus-5": {
    kind: "tokens",
    rate: {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
    },
    source,
  },
  "claude-opus-4-8": {
    kind: "tokens",
    rate: {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
    },
    source,
  },
  "claude-opus-4-7": {
    kind: "tokens",
    rate: {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
    },
    source,
  },
  "claude-opus-4-6": {
    kind: "tokens",
    rate: {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
    },
    source,
  },
  "claude-opus-4-5": {
    kind: "tokens",
    rate: {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10,
    },
    source,
  },
  "claude-opus-4-1": {
    kind: "tokens",
    rate: {
      input: 15,
      output: 75,
      cacheRead: 1.5,
      cacheWrite5m: 18.75,
      cacheWrite1h: 30,
    },
    source,
  },
  "claude-opus-4": {
    kind: "tokens",
    rate: {
      input: 15,
      output: 75,
      cacheRead: 1.5,
      cacheWrite5m: 18.75,
      cacheWrite1h: 30,
    },
    source,
  },
  "claude-sonnet-5-5": {
    kind: "tokens",
    rate: {
      input: 2,
      output: 10,
      cacheRead: 0.1,
      cacheWrite5m: 2.5,
      cacheWrite1h: 4,
    },
    source,
  },
  "claude-sonnet-5": {
    kind: "tokens",
    rate: {
      input: 2,
      output: 10,
      cacheRead: 0.2,
      cacheWrite5m: 2.5,
      cacheWrite1h: 4,
    },
    source,
  },
  "claude-sonnet-4-6": {
    kind: "tokens",
    rate: {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite5m: 3.75,
      cacheWrite1h: 6,
    },
    source,
  },
  "claude-sonnet-4-5": {
    kind: "tokens",
    rate: {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite5m: 3.75,
      cacheWrite1h: 6,
    },
    source,
  },
  "claude-sonnet-4": {
    kind: "tokens",
    rate: {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite5m: 3.75,
      cacheWrite1h: 6,
    },
    source,
  },
  "claude-haiku-5-5": {
    kind: "tokens",
    rate: {
      input: 0.1,
      output: 0.5,
      cacheRead: 0.01,
      cacheWrite5m: 0.125,
      cacheWrite1h: 0.2,
    },
    source,
    longContext: {
      aboveInputTokens: 100000,
      rate: {
        input: 0.5,
        output: 2.5,
        cacheRead: 0.05,
        cacheWrite5m: 0.625,
        cacheWrite1h: 1,
      },
    },
  },
  "claude-haiku-4-5": {
    kind: "tokens",
    rate: {
      input: 1,
      output: 5,
      cacheRead: 0.1,
      cacheWrite5m: 1.25,
      cacheWrite1h: 2,
    },
    source,
  },
  "claude-haiku-3-5": {
    kind: "tokens",
    rate: {
      input: 0.8,
      output: 4,
      cacheRead: 0.08,
      cacheWrite5m: 1,
      cacheWrite1h: 1.6,
    },
    source,
  },
};
