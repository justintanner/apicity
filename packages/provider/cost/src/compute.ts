import { PRICING, PRICING_AS_OF, type PricedProviderId } from "./pricing/index";
import { asString } from "./pricing/helpers";

import type {
  CostEstimate,
  CostHints,
  CostSource,
  EstimateRequest,
} from "./types";

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

// How evaluatePerUnit derives its pricing-table key. `keyedBy: "endpoint"`
// is for providers whose tables are keyed by endpoint id (kie, elevenlabs,
// fal, googleflow — e.g. Suno rows like "suno/generate"): the caller's
// endpoint takes precedence, falling back to payload.model / payload.model_id.
// `keyedBy: "model"` is for providers whose per-unit rows are keyed by model
// name (xai, alibaba): only payload.model / payload.model_id is consulted, so
// a caller-supplied endpoint can never be mistaken for a table key.
type PerUnitKey =
  | { keyedBy: "endpoint"; endpoint: string | undefined }
  | { keyedBy: "model" };

// Generic dispatcher for per-unit providers. Resolves the pricing key per the
// explicit `key` discriminator (see PerUnitKey), looks up the entry, runs
// `units(payload, hints)` and the ordered selectors, and returns the matching
// rate. All payload-shape knowledge lives in the model entry's closures.
//
// `hints` is the caller's cost-only channel. It travels beside `payload` for
// its whole lifetime and is never merged into it, so the bytes canonicalHash /
// mintOtp sign stay exactly what the caller will POST upstream.
function evaluatePerUnit(
  provider: PricedProviderId,
  payload: Record<string, unknown>,
  key: PerUnitKey,
  hints?: CostHints
): CostEstimate {
  const fromPayload = asString(payload.model) ?? asString(payload.model_id);
  const pricingKey =
    key.keyedBy === "endpoint" ? (key.endpoint ?? fromPayload) : fromPayload;
  if (!pricingKey) {
    return failed("per-unit-table", [
      key.keyedBy === "endpoint"
        ? `${provider}: endpoint or payload.model is required`
        : `${provider}: payload.model is required`,
    ]);
  }
  const entry = PRICING[provider][pricingKey];
  if (!entry) {
    return failed("per-unit-table", [
      `model '${pricingKey}' not found in pricing table for provider '${provider}'`,
    ]);
  }
  if (entry.kind !== "perUnit") {
    return failed("per-unit-table", [
      `${provider} '${pricingKey}' is token-billed, not per-unit`,
    ]);
  }
  const units = entry.units(payload, hints);
  if (units === undefined) {
    // Only a seconds-billed entry can be bounded by a duration hint. Naming
    // the channel to a characters / images / megapixels / generations caller
    // is dead advice, so gate on the entry's own unit — table data, not a
    // provider name.
    const hintAdvice =
      entry.unit === "seconds"
        ? "; for endpoints whose schema has no duration, pass costHints.durationSeconds"
        : "";
    return failed("per-unit-table", [
      `${provider} '${pricingKey}': could not derive units from payload (check duration / text)${hintAdvice}`,
    ]);
  }

  const selections = entry.select.map((selector) => ({
    selector,
    value: selector.pick(payload, hints),
  }));
  const missingRequired = selections
    .filter(({ selector, value }) => selector.required && value === undefined)
    .map(({ selector }) => selector.name);
  if (missingRequired.length > 0) {
    return failed("per-unit-table", [
      `${provider} '${pricingKey}': missing required selector(s): ${missingRequired.join(
        ", "
      )}`,
    ]);
  }

  const variantKey = selections
    .map(({ value }) => value)
    .filter((v): v is string => Boolean(v))
    .join("|");
  const perUnit = entry.rates[variantKey];
  if (perUnit === undefined) {
    const selectorNames = entry.select.map((s) => s.name).join(", ");
    return failed("per-unit-table", [
      `${provider} '${pricingKey}': no rate for variant '${variantKey}' (selectors: ${selectorNames})`,
    ]);
  }
  return {
    usd: units * perUnit,
    currency: "USD",
    source: "per-unit-table",
    breakdown: { units, unit: entry.unit, perUnitUsd: perUnit },
    rateAsOf: entry.source.asOf ?? PRICING_AS_OF,
    // Cost-only warnings from the entry's optional `warn` hook (e.g. googleflow
    // unknown-plan-tier fallback). Inert for every entry that omits `warn`.
    warnings: entry.warn?.(payload, hints) ?? [],
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
        // xai per-unit rates are keyed by model, never by endpoint.
        return evaluatePerUnit(
          "xai",
          req.payload,
          { keyedBy: "model" },
          req.costHints
        );
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
    // Alibaba is the one provider that bills both ways: the Qwen chat models
    // are token-billed, while the Qwen Image / Wan 2.7 media models bill per
    // image or per second. Route on the pricing entry's own `kind` so an
    // unknown model still falls through to the token path and its warning.
    case "alibaba": {
      const model = asString(req.payload.model);
      const entry = model ? PRICING.alibaba[model] : undefined;
      if (entry?.kind === "perUnit") {
        return evaluatePerUnit(
          "alibaba",
          req.payload,
          { keyedBy: "model" },
          req.costHints
        );
      }
      const ext = extractChat("alibaba", req.payload);
      if (!ext.ok) return failed("tokens-heuristic+table", ext.warnings);
      return applyTokenRate(
        "alibaba",
        ext.data.model,
        heuristicTokens(ext.data.text),
        ext.data.maxOutputTokens
      );
    }
    case "fireworks":
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
      return evaluatePerUnit(
        "kie",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
    case "elevenlabs":
      return evaluatePerUnit(
        "elevenlabs",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
    case "fal":
      return evaluatePerUnit(
        "fal",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
    case "googleflow":
      return evaluatePerUnit(
        "googleflow",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
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
