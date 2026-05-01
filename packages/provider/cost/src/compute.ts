import { anthropic } from "@apicity/anthropic";
import { fal } from "@apicity/fal";
import { openai } from "@apicity/openai";
import { xai } from "@apicity/xai";

import {
  PER_UNIT_RATES,
  PRICING_AS_OF,
  type PerUnitProviderId,
  type PerUnitRate,
  type TokenProviderId,
  type TokenRate,
  TOKEN_RATES,
} from "./pricing";

import type {
  CostEstimate,
  CostOptions,
  CostSource,
  EstimateRequest,
} from "./types";

import { extractAnthropic } from "./extract/anthropic";
import { extractChat } from "./extract/chat";
import { extractElevenLabs } from "./extract/elevenlabs";
import { extractKie } from "./extract/kie";
import { extractOpenAi } from "./extract/openai";
import { extractXai } from "./extract/xai";

const heuristicTokens = (text: string): number => Math.ceil(text.length / 4);

const lookupTokenRate = (
  provider: TokenProviderId,
  model: string
): TokenRate | undefined => TOKEN_RATES[provider][model];

const lookupPerUnitRate = (
  provider: PerUnitProviderId,
  model: string
): PerUnitRate | undefined => PER_UNIT_RATES[provider][model];

function failed(source: CostSource, warnings: string[]): CostEstimate {
  return {
    usd: 0,
    currency: "USD",
    source,
    breakdown: {},
    rateAsOf: source === "upstream-usd" ? null : PRICING_AS_OF,
    warnings,
  };
}

function tokensTimesTable(
  provider: TokenProviderId,
  model: string,
  inputTokens: number,
  maxOutputTokens: number | undefined,
  heuristic: boolean
): CostEstimate {
  const rate = lookupTokenRate(provider, model);
  const warnings: string[] = [];
  const outputTokens = maxOutputTokens ?? 0;
  if (maxOutputTokens === undefined) {
    warnings.push(
      "maxOutputTokens not provided; output cost not included in estimate"
    );
  }
  const source: CostSource = heuristic
    ? "tokens-heuristic+table"
    : "tokens-api+table";
  if (!rate) {
    warnings.push(
      `model '${model}' not found in pricing table for provider '${provider}'`
    );
    return {
      usd: 0,
      currency: "USD",
      source,
      breakdown: { inputTokens, outputTokens, unit: "tokens" },
      rateAsOf: PRICING_AS_OF,
      warnings,
    };
  }
  const usd =
    (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
  return {
    usd,
    currency: "USD",
    source,
    breakdown: {
      inputTokens,
      outputTokens,
      unit: "tokens",
      inputUsdPerMillion: rate.input,
      outputUsdPerMillion: rate.output,
    },
    rateAsOf: PRICING_AS_OF,
    warnings,
  };
}

function perUnitTimesTable(
  provider: PerUnitProviderId,
  rateKey: string,
  units: number
): CostEstimate {
  const rate = lookupPerUnitRate(provider, rateKey);
  const warnings: string[] = [];
  if (!rate) {
    warnings.push(
      `model '${rateKey}' not found in pricing table for provider '${provider}'`
    );
    return failed("per-unit-table", warnings);
  }
  return {
    usd: units * rate.perUnit,
    currency: "USD",
    source: "per-unit-table",
    breakdown: { units, unit: rate.unit, perUnitUsd: rate.perUnit },
    rateAsOf: PRICING_AS_OF,
    warnings,
  };
}

async function countOpenAiTokens(
  opts: CostOptions,
  model: string,
  text: string,
  signal: AbortSignal | undefined
): Promise<number> {
  if (!opts.openai)
    throw new Error("cost.estimate: openai opts required for upstream tokens");
  const client = openai(opts.openai);
  const res = await client.post.v1.responses.inputTokens(
    { model, input: text },
    signal
  );
  return res.input_tokens;
}

async function countAnthropicTokens(
  opts: CostOptions,
  model: string,
  text: string,
  signal: AbortSignal | undefined
): Promise<number> {
  if (!opts.anthropic)
    throw new Error(
      "cost.estimate: anthropic opts required for upstream tokens"
    );
  const client = anthropic(opts.anthropic);
  const res = await client.v1.messages.countTokens(
    { model, messages: [{ role: "user", content: text }] },
    signal
  );
  return res.input_tokens;
}

async function countXaiTokens(
  opts: CostOptions,
  model: string,
  text: string,
  signal: AbortSignal | undefined
): Promise<number> {
  if (!opts.xai)
    throw new Error("cost.estimate: xai opts required for upstream tokens");
  const client = xai(opts.xai);
  const res = await client.post.v1.tokenizeText({ model, text }, signal);
  return res.token_ids.length;
}

async function falUpstreamUsd(
  opts: CostOptions,
  endpoint_id: string,
  payload: Record<string, unknown>,
  estimateType: "historical_api_price" | "unit_price",
  signal: AbortSignal | undefined
): Promise<CostEstimate> {
  if (!opts.fal)
    throw new Error("cost.estimate: fal opts required for upstream-usd");
  const client = fal(opts.fal);
  const r = await client.v1.models.pricing.estimate(
    { estimate_type: estimateType, endpoints: { [endpoint_id]: payload } },
    signal
  );
  const warnings: string[] = [];
  if (r.currency !== "USD") {
    warnings.push(`fal returned currency '${r.currency}', not USD`);
  }
  return {
    usd: r.total_cost,
    currency: "USD",
    source: "upstream-usd",
    breakdown: {},
    rateAsOf: null,
    warnings,
  };
}

export async function computeEstimate(
  opts: CostOptions,
  req: EstimateRequest
): Promise<CostEstimate> {
  switch (req.provider) {
    case "openai":
    case "anthropic":
    case "xai": {
      const ext =
        req.provider === "openai"
          ? extractOpenAi(req.payload)
          : req.provider === "anthropic"
            ? extractAnthropic(req.payload)
            : extractXai(req.payload);
      if (!ext.ok) return failed("tokens-api+table", ext.warnings);
      const heuristic = req.useHeuristic === true;
      const inputTokens = heuristic
        ? heuristicTokens(ext.data.text)
        : req.provider === "openai"
          ? await countOpenAiTokens(
              opts,
              ext.data.model,
              ext.data.text,
              req.signal
            )
          : req.provider === "anthropic"
            ? await countAnthropicTokens(
                opts,
                ext.data.model,
                ext.data.text,
                req.signal
              )
            : await countXaiTokens(
                opts,
                ext.data.model,
                ext.data.text,
                req.signal
              );
      return tokensTimesTable(
        req.provider,
        ext.data.model,
        inputTokens,
        ext.data.maxOutputTokens,
        heuristic
      );
    }
    case "fireworks":
    case "alibaba":
    case "kimicoding": {
      const ext = extractChat(req.provider, req.payload);
      if (!ext.ok) return failed("tokens-heuristic+table", ext.warnings);
      const inputTokens = heuristicTokens(ext.data.text);
      return tokensTimesTable(
        req.provider,
        ext.data.model,
        inputTokens,
        ext.data.maxOutputTokens,
        true
      );
    }
    case "fal":
      return falUpstreamUsd(
        opts,
        req.endpoint_id,
        req.payload,
        req.estimateType ?? "unit_price",
        req.signal
      );
    case "kie": {
      const ext = extractKie(req.payload);
      if (!ext.ok) return failed("per-unit-table", ext.warnings);
      return perUnitTimesTable("kie", ext.data.rateKey, ext.data.units);
    }
    case "elevenlabs": {
      const ext = extractElevenLabs(req.payload);
      if (!ext.ok) return failed("per-unit-table", ext.warnings);
      return perUnitTimesTable(
        "elevenlabs",
        ext.data.model,
        ext.data.characters
      );
    }
    case "free":
      return {
        usd: 0,
        currency: "USD",
        source: "free",
        breakdown: {},
        rateAsOf: PRICING_AS_OF,
        warnings: [],
      };
  }
}
