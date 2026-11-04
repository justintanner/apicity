import type { CostHints } from "../types";
import type { ModelPricing, TokenRate } from "./types";

const source = {
  url: "https://docs.fireworks.ai/serverless/pricing.md",
  asOf: "2026-11-04",
};
const embeddingSource = {
  url: "https://docs.fireworks.ai/guides/querying-embeddings-models.md",
  asOf: "2026-11-04",
};

// Prices apply uniformly to input and output, including cached input.
// Metadata must be independently pinned; never parse size from a model ID.
export function fireworksSizeRate(
  parameters: number,
  moe: boolean
): number | undefined {
  if (!Number.isSafeInteger(parameters) || parameters <= 0) return undefined;
  if (moe) {
    if (parameters <= 56e9) return 0.5;
    if (parameters >= 56.1e9 && parameters <= 176e9) return 1.2;
    return undefined;
  }
  return parameters < 4e9 ? 0.1 : parameters <= 16e9 ? 0.2 : 0.9;
}

// First five: committed Fireworks models-list recording (baseModelDetails).
// Llama 3.3: https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct
export const FIREWORKS_MODEL_SIZES = {
  "accounts/fireworks/models/chronos-hermes-13b-v2": {
    parameters: 13016192000,
    moe: false,
  },
  "accounts/fireworks/models/codegemma-2b": {
    parameters: 3030460416,
    moe: false,
  },
  "accounts/fireworks/models/codegemma-7b": {
    parameters: 9324112896,
    moe: false,
  },
  "accounts/fireworks/models/code-llama-13b": {
    parameters: 13016028160,
    moe: false,
  },
  "accounts/fireworks/models/code-llama-13b-instruct": {
    parameters: 13016028160,
    moe: false,
  },
  "accounts/fireworks/models/llama-v3p3-70b-instruct": {
    parameters: 70000000000,
    moe: false,
  },
};

const standard: Record<string, TokenRate> = {
  "accounts/fireworks/models/ember-1": {
    input: 3.0,
    cacheRead: 0.3,
    output: 15.0,
  },
  "accounts/fireworks/models/muse-spark-open": {
    input: 1.25,
    cacheRead: 0.15,
    output: 4.25,
  },
  "accounts/fireworks/models/kimi-k3": {
    input: 3.0,
    cacheRead: 0.3,
    output: 15.0,
  },
  "accounts/fireworks/routers/kimi-k3-fast": {
    input: 4.5,
    cacheRead: 0.45,
    output: 22.5,
  },
  "accounts/fireworks/routers/kimi-k3-us": {
    input: 4.5,
    cacheRead: 0.45,
    output: 22.5,
  },
  "accounts/fireworks/models/deepseek-v4p1-flash": {
    input: 0.3,
    cacheRead: 0.006,
    output: 1.2,
  },
  "accounts/fireworks/routers/deepseek-v4p1-flash-us": {
    input: 0.45,
    cacheRead: 0.009,
    output: 1.8,
  },
  "accounts/fireworks/models/deepseek-v4p1-flash-1017": {
    input: 0.3,
    cacheRead: 0.006,
    output: 1.2,
  },
  "accounts/fireworks/routers/deepseek-v4p1-flash-1017-ultrafast": {
    input: 2.4,
    cacheRead: 0.048,
    output: 9.6,
  },
  "accounts/fireworks/routers/deepseek-v4p1-flash-1017-us": {
    input: 0.45,
    cacheRead: 0.009,
    output: 1.8,
  },
  "accounts/fireworks/models/glm-5p3-flash": {
    input: 0.15,
    cacheRead: 0.03,
    output: 0.5,
  },
  "accounts/fireworks/routers/glm-5p3-flash-us": {
    input: 0.225,
    cacheRead: 0.045,
    output: 0.75,
  },
  "accounts/fireworks/models/ultramarine-1-flash-us": {
    input: 0.15,
    cacheRead: 0.03,
    output: 0.5,
  },
  "accounts/fireworks/models/glm-5p3": {
    input: 1.4,
    cacheRead: 0.26,
    output: 4.4,
  },
  "accounts/fireworks/routers/glm-5p3-us": {
    input: 2.1,
    cacheRead: 0.39,
    output: 6.6,
  },
  "accounts/fireworks/routers/glm-5p3-fast": {
    input: 2.1,
    cacheRead: 0.39,
    output: 6.6,
  },
  "accounts/fireworks/models/qwen3p8-max": {
    input: 2.0,
    cacheRead: 0.25,
    output: 6.0,
  },
  "accounts/fireworks/models/minimax-m3": {
    input: 0.3,
    cacheRead: 0.06,
    output: 1.2,
  },
  "accounts/fireworks/models/gpt-oss-120b": {
    input: 0.15,
    cacheRead: 0.015,
    output: 0.6,
  },
  "accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b": {
    input: 0.05,
    cacheRead: 0.01,
    output: 0.2,
  },
  "accounts/fireworks/models/nemotron-3-ultra-nvfp4": {
    input: 0.6,
    cacheRead: 0.12,
    output: 2.4,
  },
  "accounts/fireworks/models/rune": {
    input: 0.042,
    cacheRead: 0.0084,
    output: 0.0,
  },
};
export const FIREWORKS_PRIORITY_RATES: Record<string, TokenRate> = {
  "accounts/fireworks/models/ember-1": {
    input: 3.75,
    cacheRead: 0.375,
    output: 18.75,
  },
  "accounts/fireworks/models/muse-spark-open": {
    input: 1.875,
    cacheRead: 0.225,
    output: 6.375,
  },
  "accounts/fireworks/models/kimi-k3": {
    input: 3.75,
    cacheRead: 0.375,
    output: 18.75,
  },
  "accounts/fireworks/routers/kimi-k3-us": {
    input: 5.625,
    cacheRead: 0.5625,
    output: 28.125,
  },
  "accounts/fireworks/models/deepseek-v4p1-flash": {
    input: 0.375,
    cacheRead: 0.0075,
    output: 1.5,
  },
  "accounts/fireworks/routers/deepseek-v4p1-flash-us": {
    input: 0.5625,
    cacheRead: 0.01125,
    output: 2.25,
  },
  "accounts/fireworks/models/deepseek-v4p1-flash-1017": {
    input: 0.375,
    cacheRead: 0.0075,
    output: 1.5,
  },
  "accounts/fireworks/routers/deepseek-v4p1-flash-1017-us": {
    input: 0.5625,
    cacheRead: 0.01125,
    output: 2.25,
  },
  "accounts/fireworks/models/glm-5p3-flash": {
    input: 0.1875,
    cacheRead: 0.0375,
    output: 0.625,
  },
  "accounts/fireworks/routers/glm-5p3-flash-us": {
    input: 0.28125,
    cacheRead: 0.05625,
    output: 0.9375,
  },
  "accounts/fireworks/models/ultramarine-1-flash-us": {
    input: 0.1875,
    cacheRead: 0.0375,
    output: 0.625,
  },
  "accounts/fireworks/models/glm-5p3": {
    input: 1.75,
    cacheRead: 0.325,
    output: 5.5,
  },
  "accounts/fireworks/routers/glm-5p3-us": {
    input: 2.625,
    cacheRead: 0.4875,
    output: 8.25,
  },
  "accounts/fireworks/models/qwen3p8-max": {
    input: 3.0,
    cacheRead: 0.375,
    output: 9.0,
  },
  "accounts/fireworks/models/minimax-m3": {
    input: 0.45,
    cacheRead: 0.09,
    output: 1.8,
  },
  "accounts/fireworks/models/gpt-oss-120b": {
    input: 0.18,
    cacheRead: 0.018,
    output: 0.72,
  },
  "accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b": {
    input: 0.0625,
    cacheRead: 0.0125,
    output: 0.25,
  },
  "accounts/fireworks/models/nemotron-3-ultra-nvfp4": {
    input: 0.75,
    cacheRead: 0.15,
    output: 3.0,
  },
};

// Includes the documented short IDs and full IDs returned by the API.
export const FIREWORKS_EMBEDDING_RATES: Record<string, number> = {
  "BAAI/bge-small-en-v1.5": 0.008,
  "thenlper/gte-base": 0.008,
  "BAAI/bge-base-en-v1.5": 0.008,
  "nomic-ai/nomic-embed-text-v1.5": 0.008,
  "nomic-ai/nomic-embed-text-v1": 0.008,
  "thenlper/gte-large": 0.016,
  "WhereIsAI/UAE-Large-V1": 0.016,
  "mixedbread-ai/mxbai-embed-large-v1": 0.016,
  "fireworks/qwen3-embedding-8b": 0.1,
  "accounts/fireworks/models/qwen3-embedding-8b": 0.1,
  "fireworks/qwen3-reranker-8b": 0.2,
  "accounts/fireworks/models/qwen3-reranker-8b": 0.2,
};

export const fireworks: Record<string, ModelPricing> = {
  ...Object.fromEntries(
    Object.entries(standard).map(([key, rate]) => [
      key,
      {
        kind: "tokens",
        rate,
        source,
      },
    ])
  ),
  ...Object.fromEntries(
    Object.entries(FIREWORKS_MODEL_SIZES).map(([key, metadata]) => {
      const rate = fireworksSizeRate(metadata.parameters, metadata.moe)!;
      return [
        key,
        {
          kind: "tokens",
          rate: { input: rate, output: rate, cacheRead: rate },
          source,
        },
      ];
    })
  ),
  ...Object.fromEntries(
    Object.entries(FIREWORKS_EMBEDDING_RATES).map(([key, rate]) => [
      key,
      {
        kind: "tokens",
        rate: { input: rate, output: 0 },
        source: embeddingSource,
      },
    ])
  ),
};

export function fireworksPricingProblem(
  model: string,
  payload: Record<string, unknown>,
  hints?: CostHints
): string | undefined {
  const tier = hints?.serviceTier ?? payload.service_tier;
  if (
    tier !== undefined &&
    tier !== "default" &&
    tier !== "auto" &&
    tier !== "priority"
  ) {
    return "fireworks: serviceTier/service_tier is not bundled; Fast and US modes require their documented router model ID; batch and spot are not priced here";
  }
  if (tier === "priority" && !Object.hasOwn(FIREWORKS_PRIORITY_RATES, model)) {
    return `fireworks: priority serviceTier is not published for model '${model}'`;
  }
  const usModel =
    model.endsWith("-us") ||
    model.endsWith("/muse-spark-open") ||
    model.endsWith("/rune");
  if (
    (hints?.regionalProcessing !== undefined &&
      hints.regionalProcessing !== false &&
      !(hints.regionalProcessing === true && usModel)) ||
    payload.region !== undefined ||
    payload.batch === true
  ) {
    return "fireworks: regionalProcessing/region or batch is not bundled for this model; use a documented US router ID";
  }
  return undefined;
}

export function fireworksEntry(
  model: string,
  payload: Record<string, unknown>,
  hints?: CostHints
): ModelPricing | undefined {
  const entry = fireworks[model];
  const priority =
    (hints?.serviceTier ?? payload.service_tier) === "priority"
      ? FIREWORKS_PRIORITY_RATES[model]
      : undefined;
  return entry?.kind === "tokens" && priority
    ? { ...entry, rate: priority }
    : entry;
}
