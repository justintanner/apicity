import { computeEstimate, evaluateDeclaredUsage } from "./compute";
import { PRICING, type PricedProviderId } from "./pricing/index";
import type {
  ActualBasis,
  ActualUsage,
  CostActual,
  CostEstimate,
  CostHints,
  ProviderExchange,
} from "./types";
import { extractorFor } from "./actual/families";
import {
  NOTHING_REPORTED,
  SUBMIT_PENDING,
  type Extracted,
} from "./actual/shared";

// Providers whose reported token usage prices through evaluateDeclaredUsage.
// KIE prices through its own computeEstimate route, which already reads hints.
const DECLARED_USAGE_PROVIDERS: ReadonlySet<string> = new Set([
  "openai",
  "xai",
  "anthropic",
  "alibaba",
  "fireworks",
  "kimicoding",
]);

// computeEstimate keys these per-unit tables by endpoint, not by payload.model.
const PER_UNIT_KEYED_BY_ENDPOINT: ReadonlySet<string> = new Set([
  "kie",
  "elevenlabs",
  "fal",
  "googleflow",
  "wavespeed",
]);

function tokenHints(usage: ActualUsage, serviceTier?: string): CostHints {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    cacheReadInputTokens: usage.cacheReadInputTokens ?? 0,
    cacheWriteInputTokens: usage.cacheWriteInputTokens ?? 0,
    ...(usage.audioInputTokens !== undefined
      ? { audioInputTokens: usage.audioInputTokens }
      : {}),
    ...(usage.imageInputTokens !== undefined
      ? { imageInputTokens: usage.imageInputTokens }
      : {}),
    ...(usage.audioOutputTokens !== undefined
      ? { audioOutputTokens: usage.audioOutputTokens }
      : {}),
    ...(serviceTier !== undefined ? { serviceTier } : {}),
  };
}

function reportedUnits(usage: ActualUsage): number | undefined {
  return usage.seconds ?? usage.images ?? usage.characters;
}

function isPriced(provider: string): provider is PricedProviderId {
  return Object.prototype.hasOwnProperty.call(PRICING, provider);
}

// A usable figure, or the reasons there is none. evaluatePerUnit and the token
// routes both say why through warnings, so an unpriced model carries its reason
// into the actual instead of reading as zero.
function fromEstimate(estimate: CostEstimate): {
  usd: number | null;
  rateAsOf: string | null;
  warnings: string[];
} {
  if (estimate.warnings.length > 0) {
    return { usd: null, rateAsOf: null, warnings: estimate.warnings };
  }
  return {
    usd: estimate.usd,
    rateAsOf: estimate.rateAsOf,
    warnings: [],
  };
}

function derive(
  exchange: ProviderExchange,
  model: string | null,
  extracted: Extracted
): { usd: number | null; rateAsOf: string | null; warnings: string[] } {
  const none = { usd: null, rateAsOf: null, warnings: [] as string[] };
  const { usage, unpricedCacheWrite, serviceTier } = extracted;
  if (!model || !isPriced(exchange.provider)) return none;
  const provider = exchange.provider;
  const entry = PRICING[provider][model];
  const hasTokens =
    usage.inputTokens !== undefined || usage.outputTokens !== undefined;

  try {
    if (hasTokens && entry?.kind !== "perUnit") {
      if (unpricedCacheWrite) {
        return {
          ...none,
          warnings: [
            "1-hour cache writes have no bundled rate, so no figure is derived",
          ],
        };
      }
      // Anthropic and Kimi call their Standard tier "standard", which OpenAI's
      // declared usage rightly refuses. The response is the record of what
      // ran, so only OpenAI also reads the tier its request asked for.
      const tier =
        provider !== "openai" && serviceTier === "standard"
          ? undefined
          : serviceTier;
      const hints = tokenHints(usage, tier);
      if (DECLARED_USAGE_PROVIDERS.has(provider)) {
        return fromEstimate(
          evaluateDeclaredUsage(
            provider,
            model,
            provider === "openai" ? (exchange.requestBody ?? {}) : {},
            hints
          )
        );
      }
      if (provider === "kie") {
        return fromEstimate(
          computeEstimate({ provider, payload: { model }, costHints: hints })
        );
      }
      return none;
    }
    // A per-unit row prices the units the response reported, at the rate the
    // request selects. fal is left out: its unit header often differs from the
    // table's unit, so it reports billableUnits and no derived figure. A row
    // whose response reports no units has no derived figure either, because an
    // estimate from the request alone would match itself.
    const units = reportedUnits(usage);
    if (
      entry?.kind === "perUnit" &&
      exchange.requestBody &&
      units !== undefined &&
      provider !== "fal"
    ) {
      const estimate = computeEstimate({
        provider,
        payload: exchange.requestBody,
        endpoint: PER_UNIT_KEYED_BY_ENDPOINT.has(provider) ? model : undefined,
        costHints:
          usage.seconds !== undefined
            ? { durationSeconds: usage.seconds }
            : undefined,
      });
      const perUnit = estimate.breakdown.perUnitUsd;
      if (estimate.warnings.length > 0 || perUnit === undefined) {
        return { ...none, warnings: estimate.warnings };
      }
      return {
        usd: perUnit * units + (estimate.breakdown.extraUsd ?? 0),
        rateAsOf: estimate.rateAsOf,
        warnings: [],
      };
    }
  } catch (error) {
    return { ...none, warnings: [`no figure derived: ${String(error)}`] };
  }
  return none;
}

// Reads provider data of any shape, so a malformed exchange reports "none"
// with the reason rather than throwing into a billing path.
function safeExtract(exchange: ProviderExchange): Extracted {
  try {
    return extractorFor(exchange.provider)(exchange);
  } catch (error) {
    return {
      usage: {},
      evidence: [],
      warnings: [`could not read this exchange: ${String(error)}`],
    };
  }
}

function basisOf(
  usage: ActualUsage,
  statedUsd: number | null,
  derivedUsd: number | null
): ActualBasis {
  if (statedUsd !== null) return "stated";
  if (derivedUsd !== null) return "derived";
  return Object.keys(usage).length > 0 ? "usage-only" : "none";
}

/**
 * Reads what one exchange says the call used and cost. Pure and local: no
 * network, no file access, and it never guesses. A family with nothing to read
 * returns basis "none" and a warning, and an unpriced model returns
 * "usage-only" with the estimator's reason.
 *
 * statedUsd is the provider's figure or a fixed conversion (xAI ticks, MachGen
 * micros, KIE credits at 0.005 USD). ElevenLabs credits are `usage.credits`,
 * never USD, because their value depends on the plan. settled is false on a
 * submit or an in-flight poll; merge those with mergeActuals.
 */
export function extractActual(exchange: ProviderExchange): CostActual {
  const extracted = safeExtract(exchange);
  const warnings = [...(extracted.warnings ?? [])];
  if (exchange.status >= 400) {
    warnings.push(`the provider answered HTTP ${exchange.status}`);
  }
  const model = extracted.model ?? null;
  const derived = derive(exchange, model, extracted);
  warnings.push(...derived.warnings);
  const statedUsd = extracted.statedUsd ?? null;
  const statedListUsd = extracted.statedListUsd ?? null;
  const basis = basisOf(extracted.usage, statedUsd, derived.usd);
  if (basis === "none" && statedListUsd === null && warnings.length === 0) {
    warnings.push(NOTHING_REPORTED);
  }
  return {
    provider: exchange.provider,
    dotPath: exchange.dotPath ?? null,
    model,
    usage: extracted.usage,
    evidence: extracted.evidence,
    statedUsd,
    statedListUsd,
    derivedUsd: derived.usd,
    usd: statedUsd ?? derived.usd,
    basis,
    settled: extracted.settled ?? true,
    rateAsOf: derived.rateAsOf,
    warnings,
  };
}

function lastNonNull<T>(values: readonly (T | null)[]): T | null {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = values[i];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

/**
 * Combines the exchanges of one call, in the order they happened: a submit, its
 * polls and any receipt. A later figure replaces an earlier one, because the
 * terminal read holds the final bill. The call is settled once any part is.
 */
export function mergeActuals(parts: readonly CostActual[]): CostActual {
  const head = parts[0];
  if (!head) {
    return {
      provider: "",
      dotPath: null,
      model: null,
      usage: {},
      evidence: [],
      statedUsd: null,
      statedListUsd: null,
      derivedUsd: null,
      usd: null,
      basis: "none",
      settled: false,
      rateAsOf: null,
      warnings: ["no exchanges to merge"],
    };
  }
  const usage: ActualUsage = {};
  for (const part of parts) Object.assign(usage, part.usage);
  const statedUsd = lastNonNull(parts.map((part) => part.statedUsd));
  const statedListUsd = lastNonNull(parts.map((part) => part.statedListUsd));
  const derivedUsd = lastNonNull(parts.map((part) => part.derivedUsd));
  const settled = parts.some((part) => part.settled);
  const basis = basisOf(usage, statedUsd, derivedUsd);
  const warnings = [...new Set(parts.flatMap((part) => part.warnings))].filter(
    (warning) =>
      !(settled && warning === SUBMIT_PENDING) &&
      !(basis !== "none" && warning === NOTHING_REPORTED)
  );
  return {
    provider: head.provider,
    dotPath: head.dotPath,
    model: lastNonNull(parts.map((part) => part.model)),
    usage,
    evidence: [...new Set(parts.flatMap((part) => part.evidence))],
    statedUsd,
    statedListUsd,
    derivedUsd,
    usd: statedUsd ?? derivedUsd,
    basis,
    settled,
    rateAsOf: lastNonNull(parts.map((part) => part.rateAsOf)),
    warnings,
  };
}
