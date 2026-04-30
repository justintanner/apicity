import { anthropic } from "@apicity/anthropic";
import { openai } from "@apicity/openai";
import { xai } from "@apicity/xai";
import { fal } from "@apicity/fal";

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
  UsdElevenLabsRequest,
  UsdHeuristicRequest,
  UsdKieRequest,
  UsdRequest,
  UsdTokenRequest,
} from "./types";

const heuristicTokens = (text: string): number => Math.ceil(text.length / 4);

const lookupTokenRate = (
  provider: TokenProviderId,
  model: string
): TokenRate | undefined => TOKEN_RATES[provider][model];

const lookupPerUnitRate = (
  provider: PerUnitProviderId,
  model: string
): PerUnitRate | undefined => PER_UNIT_RATES[provider][model];

async function countTokensViaApi(
  opts: CostOptions,
  req: UsdTokenRequest
): Promise<number> {
  switch (req.provider) {
    case "openai": {
      if (!opts.openai)
        throw new Error("cost.usd: openai opts required for upstream tokens");
      const client = openai(opts.openai);
      const res = await client.post.v1.responses.inputTokens(
        { model: req.model, input: req.text },
        req.signal
      );
      return res.input_tokens;
    }
    case "anthropic": {
      if (!opts.anthropic)
        throw new Error(
          "cost.usd: anthropic opts required for upstream tokens"
        );
      const client = anthropic(opts.anthropic);
      const res = await client.v1.messages.countTokens(
        {
          model: req.model,
          messages: [{ role: "user", content: req.text }],
        },
        req.signal
      );
      return res.input_tokens;
    }
    case "xai": {
      if (!opts.xai)
        throw new Error("cost.usd: xai opts required for upstream tokens");
      const client = xai(opts.xai);
      const res = await client.post.v1.tokenizeText(
        { model: req.model, text: req.text },
        req.signal
      );
      return res.token_ids.length;
    }
  }
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
      `maxOutputTokens not provided; output cost not included in estimate`
    );
  }
  if (!rate) {
    warnings.push(
      `model '${model}' not found in pricing table for provider '${provider}'`
    );
    return {
      usd: 0,
      currency: "USD",
      source: heuristic ? "tokens-heuristic+table" : "tokens-api+table",
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
    source: heuristic ? "tokens-heuristic+table" : "tokens-api+table",
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
  req: UsdElevenLabsRequest | UsdKieRequest
): CostEstimate {
  const provider: PerUnitProviderId = req.provider;
  const rate = lookupPerUnitRate(provider, req.model);
  const warnings: string[] = [];
  if (!rate) {
    warnings.push(
      `model '${req.model}' not found in pricing table for provider '${provider}'`
    );
    return {
      usd: 0,
      currency: "USD",
      source: "per-unit-table",
      breakdown: {},
      rateAsOf: PRICING_AS_OF,
      warnings,
    };
  }

  let units = 0;
  if (req.provider === "elevenlabs") {
    units = req.characters;
  } else {
    if (rate.unit === "seconds") units = req.seconds ?? 0;
    else if (rate.unit === "images") units = req.images ?? 0;
    else if (rate.unit === "songs") units = req.songs ?? 0;
    if (units === 0) {
      warnings.push(
        `kie model '${req.model}' priced per ${rate.unit} but no '${rate.unit}' provided`
      );
    }
  }

  return {
    usd: units * rate.perUnit,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {
      units,
      unit: rate.unit,
      perUnitUsd: rate.perUnit,
    },
    rateAsOf: PRICING_AS_OF,
    warnings,
  };
}

async function falUpstreamUsd(
  opts: CostOptions,
  endpoint_id: string,
  payload: Record<string, unknown>,
  estimate_type: "historical_api_price" | "unit_price",
  signal: AbortSignal | undefined
): Promise<CostEstimate> {
  if (!opts.fal)
    throw new Error("cost.usd: fal opts required for upstream-usd");
  const client = fal(opts.fal);
  const r = await client.v1.models.pricing.estimate(
    { estimate_type, endpoints: { [endpoint_id]: payload } },
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

export async function computeUsd(
  opts: CostOptions,
  req: UsdRequest
): Promise<CostEstimate> {
  switch (req.provider) {
    case "openai":
    case "anthropic":
    case "xai": {
      const heuristic = req.useHeuristic === true;
      const inputTokens = heuristic
        ? heuristicTokens(req.text)
        : await countTokensViaApi(opts, req);
      return tokensTimesTable(
        req.provider,
        req.model,
        inputTokens,
        req.maxOutputTokens,
        heuristic
      );
    }
    case "fireworks":
    case "alibaba":
    case "kimicoding": {
      const r = req as UsdHeuristicRequest;
      const inputTokens = heuristicTokens(r.text);
      return tokensTimesTable(
        r.provider,
        r.model,
        inputTokens,
        r.maxOutputTokens,
        true
      );
    }
    case "fal":
      return falUpstreamUsd(
        opts,
        req.endpoint_id,
        req.payload,
        req.estimate_type ?? "unit_price",
        req.signal
      );
    case "elevenlabs":
    case "kie":
      return perUnitTimesTable(req);
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
