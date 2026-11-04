import type { ModelPricing } from "./types";

const source = {
  url: "https://docs.z.ai/guides/overview/pricing",
  asOf: "2026-11-04",
};

// Platform list prices for explicit comparisons, never coding-plan actuals.
export const zaicoding: Record<string, ModelPricing> = {
  "glm-5.3": {
    kind: "tokens",
    rate: { input: 1.4, output: 4.4, cacheRead: 0.26 },
    source,
  },
  "glm-5.3-flash": {
    kind: "tokens",
    rate: { input: 0.15, output: 0.5, cacheRead: 0.03 },
    source,
  },
  "glm-5.3-flashx": {
    kind: "tokens",
    rate: { input: 0.37, output: 1.25, cacheRead: 0.075 },
    source,
  },
  "glm-5.3-flashx-legal": {
    kind: "tokens",
    rate: { input: 0.37, output: 1.25, cacheRead: 0.075 },
    source,
  },
  "glm-5.2": {
    kind: "tokens",
    rate: { input: 1.4, output: 4.4, cacheRead: 0.26 },
    source,
  },
  "glm-5.1": {
    kind: "tokens",
    rate: { input: 1.4, output: 4.4, cacheRead: 0.26 },
    source,
  },
  "glm-5": {
    kind: "tokens",
    rate: { input: 1.0, output: 3.2, cacheRead: 0.2 },
    source,
  },
  "glm-4.7": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.2, cacheRead: 0.11 },
    source,
  },
  "glm-4.6": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.2, cacheRead: 0.11 },
    source,
  },
  "glm-4.7-flashx": {
    kind: "tokens",
    rate: { input: 0.07, output: 0.4, cacheRead: 0.01 },
    source,
  },
  "glm-4.5": {
    kind: "tokens",
    rate: { input: 0.6, output: 2.2, cacheRead: 0.11 },
    source,
  },
  "glm-4.5-x": {
    kind: "tokens",
    rate: { input: 2.2, output: 8.9, cacheRead: 0.45 },
    source,
  },
  "glm-4.5-air": {
    kind: "tokens",
    rate: { input: 0.2, output: 1.1, cacheRead: 0.03 },
    source,
  },
  "glm-4.5-airx": {
    kind: "tokens",
    rate: { input: 1.1, output: 4.5, cacheRead: 0.22 },
    source,
  },
  "glm-4-32b-0414-128k": {
    kind: "tokens",
    rate: { input: 0.1, output: 0.1 },
    source,
  },
  "glm-4.7-flash": {
    kind: "tokens",
    rate: { input: 0, output: 0, cacheRead: 0 },
    source,
  },
  "glm-4.5-flash": {
    kind: "tokens",
    rate: { input: 0, output: 0, cacheRead: 0 },
    source,
  },
  "glm-4.6v": {
    kind: "tokens",
    rate: { input: 0.3, output: 0.9, cacheRead: 0.05 },
    source,
  },
  "glm-ocr": { kind: "tokens", rate: { input: 0.03, output: 0.03 }, source },
  "glm-4.6v-flashx": {
    kind: "tokens",
    rate: { input: 0.04, output: 0.4, cacheRead: 0.004 },
    source,
  },
  "glm-4.5v": {
    kind: "tokens",
    rate: { input: 0.6, output: 1.8, cacheRead: 0.11 },
    source,
  },
  "glm-4.6v-flash": {
    kind: "tokens",
    rate: { input: 0, output: 0, cacheRead: 0 },
    source,
  },
};
