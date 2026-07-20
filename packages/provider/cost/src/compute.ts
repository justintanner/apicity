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
    // A per-unit entry reaching the token path means this provider's case in
    // computeEstimate has no per-unit route yet -- name that, rather than
    // blaming the caller for an argument that would not help.
    warnings.push(
      entry
        ? `${provider} '${model}' is per-unit billed but '${provider}' has no per-unit route in computeEstimate`
        : `model '${model}' not found in pricing table for provider '${provider}'`
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

// Generic dispatcher for per-unit providers (kie, elevenlabs, fal,
// googleflow). Reads the pricing key from the explicit `endpoint`
// discriminator first (used by providers like Suno whose pricing is keyed by
// endpoint, not model version), then falls back to payload.model /
// payload.model_id. Looks up the entry, runs `units(payload)` and the ordered
// selectors, and returns the matching rate. All payload-shape knowledge lives
// in the model entry's closures.
function evaluatePerUnit(
  provider: PricedProviderId,
  payload: Record<string, unknown>,
  endpoint: string | undefined
): CostEstimate {
  const model =
    endpoint ?? asString(payload.model) ?? asString(payload.model_id);
  if (!model) {
    return failed("per-unit-table", [
      `${provider}: endpoint or payload.model is required`,
    ]);
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
    // xAI bills the Grok Imagine video and image models per second / per
    // generated image and everything else per token. Route on the pricing
    // entry's own `kind`: the table already records which models are per-unit,
    // so a hand-maintained endpoint allowlist would be a second source of
    // truth that silently misprices whenever xAI ships a media endpoint and
    // nobody updates it. Unknown models still fall through to the token path
    // and its warning.
    case "xai": {
      const model = asString(req.payload.model);
      const entry = model ? PRICING.xai[model] : undefined;
      if (entry?.kind === "perUnit") {
        // `undefined`, not `req.endpoint`: evaluatePerUnit treats its third
        // argument as the pricing key (`endpoint ?? payload.model`), and xai
        // rates are keyed by model. Forwarding the endpoint here would look up
        // a key like "v1.videos.generations" and report "not found".
        return evaluatePerUnit("xai", req.payload, undefined);
      }
      const ext = extractXai(req.payload);
      if (!ext.ok) return failed("tokens-heuristic+table", ext.warnings);
      return applyTokenRate(
        "xai",
        ext.data.model,
        heuristicTokens(ext.data.text),
        ext.data.maxOutputTokens
      );
    }
    case "openai":
    case "anthropic": {
      const ext =
        req.provider === "openai"
          ? extractOpenAi(req.payload)
          : extractAnthropic(req.payload);
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
      return evaluatePerUnit("kie", req.payload, req.endpoint);
    case "elevenlabs":
      return evaluatePerUnit("elevenlabs", req.payload, req.endpoint);
    case "fal":
      return evaluatePerUnit("fal", req.payload, req.endpoint);
    case "googleflow":
      return evaluatePerUnit("googleflow", req.payload, req.endpoint);
    case "free-media-upload":
      return {
        usd: 0,
        currency: "USD",
        source: "free",
        breakdown: {},
        rateAsOf: PRICING_AS_OF,
        warnings: [],
      };
    default: {
      // Exhaustiveness guard. Widening EstimateRequest without adding a case
      // above fails to compile *here*, naming the unhandled provider, rather
      // than as a TS2366 pointing at this function's return type.
      const unhandled: never = req;
      throw new Error(
        `computeEstimate: unhandled request ${JSON.stringify(unhandled)}`
      );
    }
  }
}
