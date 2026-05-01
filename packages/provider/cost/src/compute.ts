import { PRICING, PRICING_AS_OF, type PricedProviderId } from "./pricing/index";
import { asString } from "./pricing/helpers";

import type { CostEstimate, CostSource, EstimateRequest } from "./types";

import { extractAnthropic } from "./extract/anthropic";
import { extractChat } from "./extract/chat";
import { extractOpenAi } from "./extract/openai";
import { extractXai } from "./extract/xai";

const heuristicTokens = (text: string): number => Math.ceil(text.length / 4);

function failed(source: CostSource, warnings: string[]): CostEstimate {
  return {
    usd: 0,
    currency: "USD",
    source,
    breakdown: {},
    rateAsOf: PRICING_AS_OF,
    warnings,
  };
}

function applyTokenRate(
  provider: PricedProviderId,
  model: string,
  inputTokens: number,
  maxOutputTokens: number | undefined
): CostEstimate {
  const entry = PRICING[provider][model];
  const warnings: string[] = [];
  const outputTokens = maxOutputTokens ?? 0;
  if (maxOutputTokens === undefined) {
    warnings.push(
      "maxOutputTokens not provided; output cost not included in estimate"
    );
  }
  const source: CostSource = "tokens-heuristic+table";
  if (!entry || entry.kind !== "tokens") {
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
  const { rate } = entry;
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
    rateAsOf: entry.source.asOf ?? PRICING_AS_OF,
    warnings,
  };
}

// Generic dispatcher for per-unit providers (kie, elevenlabs). Reads the
// model id from payload.model (or payload.model_id for elevenlabs), looks
// up the entry, runs `units(payload)` and the ordered selectors, and
// returns the matching rate. All payload-shape knowledge lives in the
// model entry's closures.
function evaluatePerUnit(
  provider: PricedProviderId,
  payload: Record<string, unknown>
): CostEstimate {
  const model = asString(payload.model) ?? asString(payload.model_id);
  if (!model) {
    return failed("per-unit-table", [`${provider}: payload.model is required`]);
  }
  const entry = PRICING[provider][model];
  if (!entry) {
    return failed("per-unit-table", [
      `model '${model}' not found in pricing table for provider '${provider}'`,
    ]);
  }
  if (entry.kind !== "perUnit") {
    return failed("per-unit-table", [
      `${provider} '${model}' is token-billed, not per-unit`,
    ]);
  }
  const units = entry.units(payload);
  if (units === undefined) {
    return failed("per-unit-table", [
      `${provider} '${model}': could not derive units from payload (check duration / text)`,
    ]);
  }
  const variantKey = entry.select
    .map((s) => s.pick(payload))
    .filter((v): v is string => Boolean(v))
    .join("|");
  const perUnit = entry.rates[variantKey];
  if (perUnit === undefined) {
    const selectorNames = entry.select.map((s) => s.name).join(", ");
    return failed("per-unit-table", [
      `${provider} '${model}': no rate for variant '${variantKey}' (selectors: ${selectorNames})`,
    ]);
  }
  return {
    usd: units * perUnit,
    currency: "USD",
    source: "per-unit-table",
    breakdown: { units, unit: entry.unit, perUnitUsd: perUnit },
    rateAsOf: entry.source.asOf ?? PRICING_AS_OF,
    warnings: [],
  };
}

export function computeEstimate(req: EstimateRequest): CostEstimate {
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
      if (!ext.ok) return failed("tokens-heuristic+table", ext.warnings);
      const inputTokens = heuristicTokens(ext.data.text);
      return applyTokenRate(
        req.provider,
        ext.data.model,
        inputTokens,
        ext.data.maxOutputTokens
      );
    }
    case "fireworks":
    case "alibaba":
    case "kimicoding": {
      const ext = extractChat(req.provider, req.payload);
      if (!ext.ok) return failed("tokens-heuristic+table", ext.warnings);
      const inputTokens = heuristicTokens(ext.data.text);
      return applyTokenRate(
        req.provider,
        ext.data.model,
        inputTokens,
        ext.data.maxOutputTokens
      );
    }
    case "kie":
      return evaluatePerUnit("kie", req.payload);
    case "elevenlabs":
      return evaluatePerUnit("elevenlabs", req.payload);
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
