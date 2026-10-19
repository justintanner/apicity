import { PRICING, PRICING_AS_OF, type PricedProviderId } from "./pricing/index";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  falDynamicBilledUnit,
} from "./pricing/fal";
import { asString } from "./pricing/helpers";

import type {
  CostEstimate,
  CostHints,
  CostSource,
  EstimateRequest,
} from "./types";
import type { TokenPricing } from "./pricing/types";

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
    const customWarnings = entry.warn?.(payload, hints) ?? [];
    return failed(
      "per-unit-table",
      customWarnings.length > 0
        ? customWarnings
        : [
            `${provider} '${pricingKey}': could not derive units from payload (check duration / text)${hintAdvice}`,
          ]
    );
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
  const extraUsd = entry.extra?.(payload, hints);
  if (
    entry.extra &&
    (extraUsd === undefined || !Number.isFinite(extraUsd) || extraUsd < 0)
  ) {
    const customWarnings = entry.warn?.(payload, hints) ?? [];
    return failed(
      "per-unit-table",
      customWarnings.length > 0
        ? customWarnings
        : [
            `${provider} '${pricingKey}': could not derive exact additional charge from payload`,
          ]
    );
  }
  const resolvedExtraUsd = extraUsd ?? 0;
  return {
    usd: units * perUnit + resolvedExtraUsd,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {
      units,
      unit: entry.unit,
      perUnitUsd: perUnit,
      ...(resolvedExtraUsd > 0 ? { extraUsd: resolvedExtraUsd } : {}),
    },
    rateAsOf: entry.source.asOf ?? PRICING_AS_OF,
    // Cost-only warnings from the entry's optional `warn` hook (e.g. googleflow
    // unknown-plan-tier fallback). Inert for every entry that omits `warn`.
    warnings: entry.warn?.(payload, hints) ?? [],
  };
}

// Token-billed entry whose counts the caller declares rather than the payload
// carrying them (KIE's Gemini TTS models). Distinct from `applyTokenRate` in
// two ways that matter: nothing is inferred from text, and BOTH counts are
// required — an absent output count fails closed instead of being treated as
// zero, because output is the expensive side ($14 vs $0.70 per million) and a
// silent zero would under-quote by twenty times.
function evaluateDeclaredTokens(
  provider: PricedProviderId,
  pricingKey: string,
  entry: TokenPricing,
  hints?: CostHints
): CostEstimate {
  const { inputTokens, outputTokens } = hints ?? {};
  const missing: string[] = [];
  if (typeof inputTokens !== "number") missing.push("costHints.inputTokens");
  if (typeof outputTokens !== "number") missing.push("costHints.outputTokens");
  if (typeof inputTokens !== "number" || typeof outputTokens !== "number") {
    return {
      usd: 0,
      currency: "USD",
      source: "declared-tokens+table",
      breakdown: { unit: "tokens" },
      rateAsOf: entry.source.asOf ?? PRICING_AS_OF,
      warnings: [
        `${provider} '${pricingKey}' is billed per token and the request carries ` +
          `no token count; pass ${missing.join(" and ")}. Characters are not ` +
          "tokens and no published conversion exists, so no estimate is quoted.",
      ],
    };
  }
  const { rate } = entry;
  return {
    usd: (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000,
    currency: "USD",
    source: "declared-tokens+table",
    breakdown: {
      inputTokens,
      outputTokens,
      unit: "tokens",
      inputUsdPerMillion: rate.input,
      outputUsdPerMillion: rate.output,
    },
    rateAsOf: entry.source.asOf ?? PRICING_AS_OF,
    warnings: [],
  };
}

// The CostHints token counts. Declaring any of them on the openai route
// switches it from the chars/4 heuristic to evaluateDeclaredUsage.
const DECLARED_USAGE_FIELDS = [
  "inputTokens",
  "outputTokens",
  "cacheReadInputTokens",
  "cacheWriteInputTokens",
] as const;

type DeclaredUsageField = (typeof DECLARED_USAGE_FIELDS)[number];

// Service tiers billed at the bundled Standard rates. OpenAI's response
// reports Standard processing as "default"; a request's "auto" (or no
// service_tier at all) runs on the project's default tier, Standard unless
// the project is configured otherwise -- which costHints.serviceTier, read
// from the response, overrides.
const STANDARD_SERVICE_TIERS: ReadonlySet<string> = new Set([
  "default",
  "auto",
]);

function hasDeclaredUsage(hints?: CostHints): boolean {
  return DECLARED_USAGE_FIELDS.some((field) => hints?.[field] !== undefined);
}

// Cache writes and a long-context tier both depend on billed counts that a
// chars/4 estimate cannot see, so such an entry has no heuristic path.
function requiresDeclaredUsage(entry: TokenPricing): boolean {
  return entry.rate.cacheWrite !== undefined || entry.longContext !== undefined;
}

function isTokenCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

// Prices caller-declared token usage, typically a response's reported
// `usage` (ac-0y875w). `inputTokens` is the TOTAL input and the two cache
// counts are disjoint subsets of it, so the uncached remainder is
// inputTokens - cacheReadInputTokens - cacheWriteInputTokens and no token is
// billed twice. The long-context tier is selected on that total. Every gap --
// a missing or invalid count, subsets larger than the total, a count with no
// bundled rate, a tier other than Standard, regional processing -- fails
// closed with no rate in the breakdown, so classifyEstimate reads it as
// unknown instead of quoting Standard rates for a bill OpenAI computes
// differently.
function evaluateDeclaredUsage(
  provider: PricedProviderId,
  model: string,
  payload: Record<string, unknown>,
  hints?: CostHints
): CostEstimate {
  const source: CostSource = "declared-tokens+table";
  const entry = PRICING[provider][model];
  if (!entry) {
    return failed(source, [
      `model '${model}' not found in pricing table for provider '${provider}'`,
    ]);
  }
  if (entry.kind !== "tokens") {
    return failed(source, [
      `${provider} '${model}' is per-unit billed, not token-billed`,
    ]);
  }
  const rateAsOf = entry.source.asOf ?? PRICING_AS_OF;
  const unknown = (warning: string): CostEstimate => ({
    usd: 0,
    currency: "USD",
    source,
    breakdown: { unit: "tokens" },
    rateAsOf,
    warnings: [warning],
  });

  const required: DeclaredUsageField[] = ["inputTokens", "outputTokens"];
  if (entry.rate.cacheRead !== undefined) required.push("cacheReadInputTokens");
  if (entry.rate.cacheWrite !== undefined) {
    required.push("cacheWriteInputTokens");
  }
  const named = (fields: readonly DeclaredUsageField[]): string =>
    fields.map((field) => `costHints.${field}`).join(", ");
  if (!hasDeclaredUsage(hints)) {
    return unknown(
      `${provider} '${model}' bills cache writes or a long-context tier that ` +
        "a chars/4 estimate cannot see; pass the response's usage as " +
        `${named(required)}. No estimate is quoted.`
    );
  }
  const missing = required.filter((field) => hints?.[field] === undefined);
  const invalid = DECLARED_USAGE_FIELDS.filter(
    (field) => hints?.[field] !== undefined && !isTokenCount(hints?.[field])
  );
  if (missing.length > 0 || invalid.length > 0) {
    const problems: string[] = [];
    if (missing.length > 0) problems.push(`pass ${named(missing)}`);
    if (invalid.length > 0) {
      problems.push(`${named(invalid)} must be a non-negative integer`);
    }
    return unknown(
      `${provider} '${model}' is priced from declared token usage; ` +
        `${problems.join("; ")}. No estimate is quoted.`
    );
  }

  const inputTokens = hints?.inputTokens ?? 0;
  const outputTokens = hints?.outputTokens ?? 0;
  const cacheRead = hints?.cacheReadInputTokens ?? 0;
  const cacheWrite = hints?.cacheWriteInputTokens ?? 0;
  if (cacheRead + cacheWrite > inputTokens) {
    return unknown(
      `${provider} '${model}': costHints.cacheReadInputTokens + ` +
        `costHints.cacheWriteInputTokens (${cacheRead + cacheWrite}) exceed ` +
        `costHints.inputTokens (${inputTokens}). inputTokens is the total ` +
        "input, cached and cache-write tokens included (usage.input_tokens " +
        "or usage.prompt_tokens). No estimate is quoted."
    );
  }

  const tier = hints?.serviceTier ?? payload.service_tier;
  if (
    tier !== undefined &&
    tier !== null &&
    !(typeof tier === "string" && STANDARD_SERVICE_TIERS.has(tier))
  ) {
    return unknown(
      `${provider} '${model}': service tier ${JSON.stringify(tier)} is not ` +
        'bundled; only Standard processing (service_tier "default" or ' +
        '"auto") is priced. No estimate is quoted.'
    );
  }
  if (
    hints?.regionalProcessing !== undefined &&
    hints.regionalProcessing !== false
  ) {
    return unknown(
      `${provider} '${model}': regional processing (data residency) and ` +
        "FedRAMP endpoints bill an uplift that is not bundled. No estimate " +
        "is quoted."
    );
  }

  const long =
    entry.longContext !== undefined &&
    inputTokens > entry.longContext.aboveInputTokens;
  const rate = long && entry.longContext ? entry.longContext.rate : entry.rate;
  if (cacheRead > 0 && rate.cacheRead === undefined) {
    return unknown(
      `${provider} '${model}' has no bundled cached-input rate, so ` +
        "costHints.cacheReadInputTokens must be 0. No estimate is quoted."
    );
  }
  if (cacheWrite > 0 && rate.cacheWrite === undefined) {
    return unknown(
      `${provider} '${model}' has no bundled cache-write rate, so ` +
        "costHints.cacheWriteInputTokens must be 0. No estimate is quoted."
    );
  }
  const uncached = inputTokens - cacheRead - cacheWrite;
  const usd =
    (uncached * rate.input +
      cacheRead * (rate.cacheRead ?? 0) +
      cacheWrite * (rate.cacheWrite ?? 0) +
      outputTokens * rate.output) /
    1_000_000;
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
      ...(rate.cacheRead !== undefined
        ? {
            cacheReadInputTokens: cacheRead,
            cacheReadUsdPerMillion: rate.cacheRead,
          }
        : {}),
      ...(rate.cacheWrite !== undefined
        ? {
            cacheWriteInputTokens: cacheWrite,
            cacheWriteUsdPerMillion: rate.cacheWrite,
          }
        : {}),
      ...(entry.longContext ? { contextTier: long ? "long" : "short" } : {}),
    },
    rateAsOf,
    warnings: [],
  };
}

const FAL_DYNAMIC_ENDPOINT_SET: ReadonlySet<string> = new Set(
  FAL_DYNAMIC_PRICING_ENDPOINTS
);

/**
 * Whether a fal endpoint is deliberately unpriced rather than unknown.
 */
function isFalDynamicEndpoint(endpoint: string): boolean {
  return FAL_DYNAMIC_ENDPOINT_SET.has(endpoint);
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
    // OpenAI also prices declared usage (ac-0y875w): any CostHints token
    // count opts in, and an entry that bills cache writes or a long-context
    // tier (gpt-5.6-sol) requires it. Without either, the chars/4 path below
    // runs exactly as before.
    case "openai": {
      const model = asString(req.payload.model);
      const entry = model ? PRICING.openai[model] : undefined;
      if (
        model &&
        (hasDeclaredUsage(req.costHints) ||
          (entry?.kind === "tokens" && requiresDeclaredUsage(entry)))
      ) {
        return evaluateDeclaredUsage(
          "openai",
          model,
          req.payload,
          req.costHints
        );
      }
      const ext = extractOpenAi(req.payload);
      if (!ext.ok) return failed("tokens-heuristic+table", ext.warnings);
      return applyTokenRate(
        "openai",
        ext.data.model,
        heuristicTokens(ext.data.text),
        ext.data.maxOutputTokens
      );
    }
    case "anthropic": {
      const ext = extractAnthropic(req.payload);
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
    // KIE is per-unit for every media model, but two Gemini TTS models are
    // billed purely per token. Route on the pricing entry's own `kind`, the
    // way xai and alibaba already do, so the table stays the single source of
    // truth for which models bill which way (ac-6lg2s0).
    case "kie": {
      const pricingKey =
        req.endpoint ??
        asString(req.payload.model) ??
        asString(req.payload.model_id);
      const entry = pricingKey ? PRICING.kie[pricingKey] : undefined;
      if (entry?.kind === "tokens") {
        return evaluateDeclaredTokens(
          "kie",
          pricingKey as string,
          entry,
          req.costHints
        );
      }
      return evaluatePerUnit(
        "kie",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
    }
    case "elevenlabs":
      return evaluatePerUnit(
        "elevenlabs",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
    // A fal endpoint on the dynamic list is unpriced BY DESIGN, not unknown.
    // The generic "not found in pricing table" warning cannot tell those two
    // apart, so a caller had no way to know that a real number is one call
    // away. `@apicity/cost` stays dependency-free and pure-local — it does not
    // make the call — but it now names it (ac-nz65nc). Where the endpoint's
    // card and recorded bill were checked, the warning names its billed unit
    // and why the request cannot fix it (ac-j3d6ki.4).
    case "fal": {
      if (req.endpoint && isFalDynamicEndpoint(req.endpoint)) {
        const billed = falDynamicBilledUnit(req.endpoint);
        return {
          usd: 0,
          currency: "USD",
          source: "per-unit-table",
          breakdown: {},
          rateAsOf: PRICING_AS_OF,
          warnings: [
            (billed
              ? `fal '${req.endpoint}' bills ${billed.unit}. This estimator ` +
                "cannot derive that quantity from the request payload: " +
                `${billed.why}, so no local rate exists for it. `
              : `fal '${req.endpoint}' is billed on a unit this estimator cannot ` +
                "derive from the request payload (compute seconds, delivered " +
                "output metadata, or tokens with no published per-image " +
                "constant), so no local rate exists for it. ") +
              "fal reports the " +
              "billed units after the call (x-fal-billable-units); to price " +
              "them, pass them as unitQuantity to resolveFalDynamicEstimate, " +
              "which calls fal's own pricing API: " +
              "POST https://api.fal.ai/v1/models/pricing/estimate, exposed as " +
              "fal.v1.models.pricing.estimate, with FAL_ADMIN_API_KEY.",
          ],
        };
      }
      return evaluatePerUnit(
        "fal",
        req.payload,
        { keyedBy: "endpoint", endpoint: req.endpoint },
        req.costHints
      );
    }
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
